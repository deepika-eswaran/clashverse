import { generatePlayerId } from '../../utils/idGenerator';

export function createNewPlayer({ username, avatarId }) {
  return {
    playerId: generatePlayerId(),
    username: username.trim(),
    avatarId,
    level: 1,
    xp: 0,
    rank: 'Rookie',
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    totalBattlePoints: 0,
    createdAt: new Date().toISOString(),
  };
}

export function calculateWinRate(wins, matchesPlayed) {
  if (!matchesPlayed) return 0;
  return Math.round((wins / matchesPlayed) * 100);
}

const RANKS = [
  { minLevel: 1, name: 'Rookie' },
  { minLevel: 3, name: 'Challenger' },
  { minLevel: 6, name: 'Veteran' },
  { minLevel: 10, name: 'Champion' },
  { minLevel: 15, name: 'Legend' },
];

// Every 100 XP is one level.
export function getLevelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

export function getRankForLevel(level) {
  let rank = RANKS[0].name;
  RANKS.forEach((r) => {
    if (level >= r.minLevel) rank = r.name;
  });
  return rank;
}

// outcome is 'win', 'loss' or 'draw'.
// XP: 10 for playing + battle points + 30 bonus for a win.
export function applyMatchResult(player, { outcome, battlePoints, matchId }) {
  const won = outcome === 'win';
  const lost = outcome === 'loss';
  const currentWinStreak = won ? player.currentWinStreak + 1 : lost ? 0 : player.currentWinStreak;
  const xp = player.xp + 10 + battlePoints + (won ? 30 : 0);
  const level = getLevelFromXp(xp);

  return {
    ...player,
    matchesPlayed: player.matchesPlayed + 1,
    wins: player.wins + (won ? 1 : 0),
    losses: player.losses + (lost ? 1 : 0),
    currentWinStreak,
    bestWinStreak: Math.max(player.bestWinStreak, currentWinStreak),
    totalBattlePoints: player.totalBattlePoints + battlePoints,
    xp,
    level,
    rank: getRankForLevel(level),
    lastMatchId: matchId,
  };
}
