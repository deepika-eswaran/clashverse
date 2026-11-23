import { useState, useRef, useCallback } from 'react';
import {
  loadPlayerProfile,
  savePlayerProfile,
  clearPlayerProfile,
} from '../services/storageService';
import { createNewPlayer, applyMatchResult } from '../features/player/playerModel';

export function usePlayer() {
  // Load the saved profile once, when the app starts.
  const [player, setPlayer] = useState(() => loadPlayerProfile());
  // Always holds the newest profile, so socket callbacks never use an old copy.
  const playerRef = useRef(player);

  const commit = useCallback((next) => {
    playerRef.current = next;
    if (next) savePlayerProfile(next);
    setPlayer(next);
  }, []);

  const createProfile = useCallback(
    ({ username, avatarId }) => {
      const newPlayer = createNewPlayer({ username, avatarId });
      commit(newPlayer);
      return newPlayer;
    },
    [commit]
  );

  const resetProfile = useCallback(() => {
    clearPlayerProfile();
    commit(null);
  }, [commit]);

  // Called once per finished match. matchId stops it counting twice.
  const recordMatch = useCallback(
    ({ outcome, battlePoints, matchId }) => {
      const current = playerRef.current;
      if (!current || !matchId || current.lastMatchId === matchId) return;
      commit(applyMatchResult(current, { outcome, battlePoints, matchId }));
    },
    [commit]
  );

  return { player, createProfile, resetProfile, recordMatch };
}
