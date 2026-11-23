import { useState, useEffect } from 'react';
import { socket } from './services/socketService';
import {
  saveRoomSession,
  loadRoomSession,
  clearRoomSession,
} from './services/storageService';
import { usePlayer } from './hooks/usePlayer';
import { PlayerSetupForm } from './features/player/PlayerSetupForm';
import { SetupPage } from './pages/SetupPage';
import { LobbyPage } from './pages/LobbyPage';
import { BattlePage } from './pages/BattlePage';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const initialRoomCode = params.get('room');

  const { player, createProfile, resetProfile, recordMatch } = usePlayer();
  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    function handleConnect() {
      setConnected(true);
      setError('');
      // After a refresh or a network drop, take the old seat back.
      const session = loadRoomSession();
      if (session) socket.emit('room:rejoin', session);
    }

    function handleDisconnect() {
      setConnected(false);
    }

    function handleRoomState(state) {
      setError('');
      setRoomState(state);

      // Match is over: save the result to the player's profile.
      if (state.phase === 'finished' && state.matchWinner) {
        const me = state.players.find((p) => p.id === state.myPlayerId);
        const outcome = state.matchWinner.isDraw
          ? 'draw'
          : state.matchWinner.id === state.myPlayerId
          ? 'win'
          : 'loss';
        recordMatch({
          outcome,
          battlePoints: me?.points || 0,
          matchId: state.matchId,
        });
      }
    }

    function handleJoined({ roomCode, token }) {
      saveRoomSession({ roomCode, token });
    }

    function handleRejoinFailed() {
      clearRoomSession();
      setRoomState(null);
    }

    function handleRoomError(msg) {
      setError(msg);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room:state', handleRoomState);
    socket.on('room:joined', handleJoined);
    socket.on('room:rejoin_failed', handleRejoinFailed);
    socket.on('room:error', handleRoomError);

    // The socket may already be connected before this effect runs.
    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room:state', handleRoomState);
      socket.off('room:joined', handleJoined);
      socket.off('room:rejoin_failed', handleRejoinFailed);
      socket.off('room:error', handleRoomError);
    };
  }, [recordMatch]);

  function handleLeaveRoom() {
    socket.emit('room:leave');
    clearRoomSession();
    setRoomState(null);
    setError('');
  }

  // First time here: create the challenger profile (name + avatar).
  if (!player) {
    return (
      <div className="app-shell">
        <PlayerSetupForm onCreateProfile={createProfile} />
      </div>
    );
  }

  const serverError = !connected
    ? 'Game server is offline. Run "npm run server" in a second terminal.'
    : error;

  return (
    <div className="app-shell">
      {!roomState ? (
        <SetupPage
          player={player}
          initialRoomCode={initialRoomCode}
          error={serverError}
          onSwitchProfile={resetProfile}
          onCreateRoom={(payload) =>
            socket.emit('room:create', {
              ...payload,
              playerName: player.username,
              avatarId: player.avatarId,
            })
          }
          onJoinRoom={(payload) =>
            socket.emit('room:join', {
              ...payload,
              playerName: player.username,
              avatarId: player.avatarId,
            })
          }
        />
      ) : roomState.phase === 'lobby' ? (
        <LobbyPage roomState={roomState} onLeave={handleLeaveRoom} />
      ) : (
        <BattlePage
          roomState={roomState}
          error={serverError}
          onPickCard={(cardId) => socket.emit('game:pick_card', { cardId })}
          onPickStat={(statKey) => socket.emit('game:pick_stat', { statKey })}
          onRematch={() => socket.emit('game:rematch')}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}
