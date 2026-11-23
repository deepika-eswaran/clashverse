const STORAGE_KEYS = {
  PLAYER_PROFILE: 'clashverse_player_profile_v1',
  ROOM_SESSION: 'clashverse_room_session_v1',
};

export function savePlayerProfile(player) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_PROFILE, JSON.stringify(player));
    return true;
  } catch (error) {
    console.error('Failed to save player profile:', error);
    return false;
  }
}

export function loadPlayerProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load player profile:', error);
    return null;
  }
}

export function clearPlayerProfile() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_PROFILE);
    return true;
  } catch (error) {
    console.error('Failed to clear player profile:', error);
    return false;
  }
}

// The room seat is saved per browser tab (sessionStorage), so two tabs on the
// same computer can still play as two different players while testing.
export function saveRoomSession(session) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.ROOM_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save room session:', error);
  }
}

export function loadRoomSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.ROOM_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load room session:', error);
    return null;
  }
}

export function clearRoomSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.ROOM_SESSION);
  } catch (error) {
    console.error('Failed to clear room session:', error);
  }
}
