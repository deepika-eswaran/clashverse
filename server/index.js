import express from 'express';
import http from 'http';
import cors from 'cors';
import crypto from 'crypto';
import { Server } from 'socket.io';
import { DECKS } from '../src/data/decks.js';
import { STARTER_AVATARS } from '../src/data/avatars.js';

const PORT = process.env.PORT || 4000;
// On deploy, set CLIENT_ORIGIN to your website link (comma separated for many).
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const origins = CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',');

const TURN_SECONDS = 30;
const REVEAL_MS = 4000;
// A player who is offline longer than this gets auto-played by the server.
const OFFLINE_GRACE_MS = 10000;
// If nobody is connected, the room is deleted after this time.
const EMPTY_ROOM_TTL_MS = 2 * 60 * 1000;

const app = express();
app.use(cors({ origin: origins }));
app.get('/', (_req, res) => res.send('CLASHVERSE server is running'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: origins, methods: ['GET', 'POST'] },
});

const rooms = new Map();
// socket id -> room code, so a player can only act inside their own room
const socketToRoom = new Map();

/* ---------- small helpers ---------- */

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cleanName(name, fallback) {
  const trimmed = String(name ?? '').trim().slice(0, 16);
  return trimmed || fallback;
}

function cleanAvatar(avatarId) {
  return STARTER_AVATARS.some((a) => a.id === avatarId)
    ? avatarId
    : STARTER_AVATARS[0].id;
}

function randomStat(room) {
  const keys = Object.keys(DECKS[room.deckId].statLabels);
  return keys[Math.floor(Math.random() * keys.length)];
}

function createPlayer(room, socket, { name, avatarId, isHost }) {
  const id = room.nextPlayerId;
  room.nextPlayerId += 1;

  return {
    id,
    token: crypto.randomUUID(),
    socketId: socket.id,
    name: cleanName(name, `Player ${id}`),
    avatarId: cleanAvatar(avatarId),
    isHost,
    connected: true,
    offlineSince: null,
    hand: [],
    selectedCard: null,
    roundsWon: 0,
    points: 0,
  };
}

function getContext(socket) {
  const code = socketToRoom.get(socket.id);
  const room = code ? rooms.get(code) : null;
  if (!room) return {};
  const player = room.players.find((p) => p.socketId === socket.id);
  return player ? { room, player } : {};
}

/* ---------- timers ---------- */

function clearRoomTimer(room) {
  if (room.timer) {
    clearInterval(room.timer);
    clearTimeout(room.timer);
    room.timer = null;
  }
}

function deleteRoom(room) {
  clearRoomTimer(room);
  if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
  room.players.forEach((p) => {
    if (socketToRoom.get(p.socketId) === room.code) {
      socketToRoom.delete(p.socketId);
    }
  });
  rooms.delete(room.code);
}

// Nobody is online: stop the game clock and delete the room later.
function pauseRoom(room) {
  clearRoomTimer(room);
  room.paused = true;
  if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
  room.cleanupTimer = setTimeout(() => deleteRoom(room), EMPTY_ROOM_TTL_MS);
}

/* ---------- sending state to players ---------- */

function broadcastRoom(room) {
  const deck = DECKS[room.deckId];

  room.players.forEach((viewer) => {
    if (!viewer.connected) return;

    const sanitizedPlayers = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      isHost: p.isHost,
      connected: p.connected,
      handCount: p.hand.length,
      hand: p.id === viewer.id ? p.hand : [],
      hasPickedCard: Boolean(p.selectedCard),
      selectedCard:
        room.phase === 'reveal' || (p.id === viewer.id && p.selectedCard)
          ? p.selectedCard
          : null,
      roundsWon: p.roundsWon,
      points: p.points,
    }));

    io.to(viewer.socketId).emit('room:state', {
      roomCode: room.code,
      matchId: room.matchId,
      maxPlayers: room.maxPlayers,
      deckId: room.deckId,
      deckName: deck.name,
      statLabels: deck.statLabels,
      phase: room.phase,
      roundNumber: room.roundNumber,
      activePlayerId: room.players[room.activePlayerIndex]?.id || null,
      selectedStat: room.selectedStat,
      roundResult: room.roundResult,
      timeLeft: room.timeLeft,
      matchWinner: room.matchWinner,
      canRematch: room.players.every((p) => p.connected),
      myPlayerId: viewer.id,
      players: sanitizedPlayers,
    });
  });
}

/* ---------- game flow ---------- */

function everyonePicked(room) {
  return room.players.every((p) => Boolean(p.selectedCard) || p.hand.length === 0);
}

function autoPickCards(room) {
  room.players.forEach((p) => {
    if (p.hand.length > 0 && !p.selectedCard) {
      p.selectedCard = p.hand.shift();
    }
  });
}

// Players who have been offline for a while get played automatically.
// Returns true if the phase moved on (the new phase already broadcast).
function autoPlayOfflinePlayers(room) {
  const now = Date.now();
  const isGone = (p) => !p.connected && now - p.offlineSince >= OFFLINE_GRACE_MS;

  if (room.phase === 'pick_card') {
    room.players.forEach((p) => {
      if (isGone(p) && !p.selectedCard && p.hand.length > 0) {
        p.selectedCard = p.hand.shift();
      }
    });
    if (everyonePicked(room)) {
      startPickStatPhase(room);
      return true;
    }
  }

  if (room.phase === 'pick_stat') {
    const active = room.players[room.activePlayerIndex];
    if (active && isGone(active)) {
      resolveRound(room, randomStat(room));
      return true;
    }
  }

  return false;
}

function startTimer(room, onExpire) {
  clearRoomTimer(room);
  room.timeLeft = TURN_SECONDS;
  broadcastRoom(room);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;

    if (room.timeLeft <= 0) {
      clearRoomTimer(room);
      onExpire();
      return;
    }

    if (autoPlayOfflinePlayers(room)) return;
    broadcastRoom(room);
  }, 1000);
}

function onPickCardExpire(room) {
  autoPickCards(room);
  startPickStatPhase(room);
}

function onPickStatExpire(room) {
  resolveRound(room, randomStat(room));
}

function startPickCardPhase(room) {
  room.phase = 'pick_card';
  room.selectedStat = null;
  room.roundResult = null;
  room.players.forEach((p) => {
    p.selectedCard = null;
  });

  startTimer(room, () => onPickCardExpire(room));
}

function startPickStatPhase(room) {
  room.phase = 'pick_stat';
  startTimer(room, () => onPickStatExpire(room));
}

function finishMatch(room) {
  room.phase = 'finished';

  const sorted = [...room.players].sort((a, b) => b.points - a.points);
  const topPoints = sorted[0].points;
  const leaders = sorted.filter((p) => p.points === topPoints);

  room.matchWinner =
    leaders.length > 1
      ? { id: null, name: null, points: topPoints, isDraw: true }
      : { id: leaders[0].id, name: leaders[0].name, points: topPoints, isDraw: false };

  broadcastRoom(room);
}

function scheduleNextRound(room) {
  clearRoomTimer(room);
  // Played cards vanish permanently; next round starts after the reveal.
  room.timer = setTimeout(() => {
    room.timer = null;
    room.players.forEach((p) => {
      p.selectedCard = null;
    });

    const anyCardsLeft = room.players.some((p) => p.hand.length > 0);
    if (!anyCardsLeft) {
      finishMatch(room);
      return;
    }

    room.roundNumber += 1;
    startPickCardPhase(room);
  }, REVEAL_MS);
}

function resolveRound(room, statKey) {
  if (room.phase === 'reveal') return;

  clearRoomTimer(room);
  room.selectedStat = statKey;
  room.phase = 'reveal';

  const contenders = room.players.filter((p) => p.selectedCard);
  let highest = -1;
  let winners = [];

  contenders.forEach((p) => {
    const val = p.selectedCard.stats[statKey];
    if (val > highest) {
      highest = val;
      winners = [p.id];
    } else if (val === highest) {
      winners.push(p.id);
    }
  });

  const isTie = winners.length !== 1;
  const winnerId = isTie ? null : winners[0];

  if (!isTie) {
    const winnerIdx = room.players.findIndex((p) => p.id === winnerId);
    if (winnerIdx !== -1) {
      room.players[winnerIdx].roundsWon += 1;
      room.players[winnerIdx].points += 3;
      room.activePlayerIndex = winnerIdx;
    }
  }

  room.roundResult = { isTie, winnerId, highestValue: highest };
  broadcastRoom(room);
  scheduleNextRound(room);
}

function dealAndStart(room) {
  const deck = DECKS[room.deckId];
  const shuffled = shuffle(deck.cards);
  const perPlayer = Math.floor(shuffled.length / room.players.length);

  room.players.forEach((p, idx) => {
    p.hand = shuffled.slice(idx * perPlayer, (idx + 1) * perPlayer);
    p.selectedCard = null;
    p.roundsWon = 0;
    p.points = 0;
  });

  room.matchNumber += 1;
  room.matchId = `${room.code}-${room.matchNumber}-${crypto.randomUUID().slice(0, 6)}`;
  room.roundNumber = 1;
  room.activePlayerIndex = 0;
  room.matchWinner = null;
  startPickCardPhase(room);
}

// Used when someone comes back after everyone was offline.
function resumeRoom(room) {
  room.paused = false;
  if (room.cleanupTimer) {
    clearTimeout(room.cleanupTimer);
    room.cleanupTimer = null;
  }

  if (room.phase === 'pick_card') {
    startTimer(room, () => onPickCardExpire(room));
  } else if (room.phase === 'pick_stat') {
    startTimer(room, () => onPickStatExpire(room));
  } else if (room.phase === 'reveal') {
    broadcastRoom(room);
    scheduleNextRound(room);
  } else {
    broadcastRoom(room);
  }
}

/* ---------- leaving / disconnecting ---------- */

function handlePlayerGone(socket) {
  const code = socketToRoom.get(socket.id);
  socketToRoom.delete(socket.id);

  const room = code ? rooms.get(code) : null;
  if (!room) return;

  const player = room.players.find((p) => p.socketId === socket.id);
  if (!player) return;

  // Lobby: just remove the seat.
  if (room.phase === 'lobby') {
    room.players = room.players.filter((p) => p.id !== player.id);

    if (room.players.length === 0) {
      deleteRoom(room);
      return;
    }
    if (player.isHost) room.players[0].isHost = true;
    broadcastRoom(room);
    return;
  }

  // In a match: keep the seat so the player can rejoin.
  player.connected = false;
  player.offlineSince = Date.now();

  if (room.players.every((p) => !p.connected)) {
    pauseRoom(room);
    return;
  }
  broadcastRoom(room);
}

/* ---------- socket events ---------- */

io.on('connection', (socket) => {
  socket.on('room:create', ({ maxPlayers, deckId, playerName, avatarId } = {}) => {
    if (socketToRoom.has(socket.id)) {
      socket.emit('room:error', 'You are already in a room.');
      return;
    }
    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 4 || !DECKS[deckId]) {
      socket.emit('room:error', 'Invalid room settings.');
      return;
    }

    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const room = {
      code,
      maxPlayers,
      deckId,
      phase: 'lobby',
      roundNumber: 0,
      matchNumber: 0,
      matchId: null,
      activePlayerIndex: 0,
      selectedStat: null,
      roundResult: null,
      timeLeft: TURN_SECONDS,
      matchWinner: null,
      timer: null,
      cleanupTimer: null,
      paused: false,
      nextPlayerId: 1,
      players: [],
    };

    const host = createPlayer(room, socket, { name: playerName, avatarId, isHost: true });
    room.players.push(host);

    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('room:joined', { roomCode: code, token: host.token });
    broadcastRoom(room);
  });

  socket.on('room:join', ({ roomCode, playerName, avatarId } = {}) => {
    if (socketToRoom.has(socket.id)) {
      socket.emit('room:error', 'You are already in a room.');
      return;
    }

    const code = String(roomCode ?? '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('room:error', 'Room not found. Check the link or code.');
      return;
    }
    if (room.phase !== 'lobby') {
      socket.emit('room:error', 'Match already started.');
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit('room:error', 'Room is full.');
      return;
    }

    const player = createPlayer(room, socket, { name: playerName, avatarId, isHost: false });
    room.players.push(player);

    socketToRoom.set(socket.id, code);
    socket.join(code);
    socket.emit('room:joined', { roomCode: code, token: player.token });

    if (room.players.length === room.maxPlayers) {
      dealAndStart(room);
    } else {
      broadcastRoom(room);
    }
  });

  // Page refresh or network drop: take the old seat back using the token.
  socket.on('room:rejoin', ({ roomCode, token } = {}) => {
    const code = String(roomCode ?? '').trim().toUpperCase();
    const room = rooms.get(code);
    const player = room?.players.find((p) => p.token === token);

    if (!room || !player) {
      socket.emit('room:rejoin_failed');
      return;
    }

    // Same seat open in another tab: the new tab wins.
    if (player.socketId && player.socketId !== socket.id) {
      socketToRoom.delete(player.socketId);
      io.sockets.sockets
        .get(player.socketId)
        ?.emit('room:error', 'This seat was opened in another tab.');
    }

    player.socketId = socket.id;
    player.connected = true;
    player.offlineSince = null;
    socketToRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('room:joined', { roomCode: code, token: player.token });

    if (room.paused) {
      resumeRoom(room);
    } else {
      broadcastRoom(room);
    }
  });

  socket.on('game:pick_card', ({ cardId } = {}) => {
    const { room, player } = getContext(socket);
    if (!room || room.phase !== 'pick_card' || room.paused) return;
    if (player.selectedCard) return;

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) return;

    player.selectedCard = player.hand.splice(cardIdx, 1)[0];

    if (everyonePicked(room)) {
      startPickStatPhase(room);
    } else {
      broadcastRoom(room);
    }
  });

  socket.on('game:pick_stat', ({ statKey } = {}) => {
    const { room, player } = getContext(socket);
    if (!room || room.phase !== 'pick_stat' || room.paused) return;

    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== player.id) return;

    // Only accept stats that really exist in this deck.
    if (!Object.hasOwn(DECKS[room.deckId].statLabels, statKey)) return;

    resolveRound(room, statKey);
  });

  socket.on('game:rematch', () => {
    const { room } = getContext(socket);
    if (!room || room.phase !== 'finished') return;

    if (!room.players.every((p) => p.connected)) {
      socket.emit('room:error', 'Wait until every player is back online.');
      return;
    }
    dealAndStart(room);
  });

  socket.on('room:leave', () => {
    const code = socketToRoom.get(socket.id);
    handlePlayerGone(socket);
    if (code) socket.leave(code);
  });

  socket.on('disconnect', () => {
    handlePlayerGone(socket);
  });
});

server.listen(PORT, () => {
  console.log(`CLASHVERSE multiplayer server running on port ${PORT}`);
});
