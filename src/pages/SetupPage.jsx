import { useState } from 'react';
import { DECKS } from '../data/decks';
import { Button } from '../components/Button/Button';
import { PlayerProfileCard } from '../features/player/PlayerProfileCard';
import { AvatarBadge } from '../components/AvatarBadge/AvatarBadge';
import './SetupPage.css';

const PLAYER_OPTIONS = [2, 3, 4];

function ProfileBar({ player, onSwitchProfile }) {
  const [showStats, setShowStats] = useState(false);

  function handleSwitch() {
    const ok = window.confirm(
      'Switch challenger? This deletes your saved name, avatar and stats on this device.'
    );
    if (ok) onSwitchProfile();
  }

  return (
    <div className="profile-bar">
      <div className="profile-bar__row">
        <AvatarBadge avatarId={player.avatarId} size="sm" />
        <div className="profile-bar__meta">
          <strong>{player.username}</strong>
          <span>
            {player.rank} • LVL {player.level}
          </span>
        </div>
        <button
          type="button"
          className="profile-bar__link"
          onClick={() => setShowStats((v) => !v)}
        >
          {showStats ? 'Hide stats' : 'My stats'}
        </button>
        <button type="button" className="profile-bar__link" onClick={handleSwitch}>
          Switch
        </button>
      </div>
      {showStats && <PlayerProfileCard player={player} />}
    </div>
  );
}

export function SetupPage({
  player,
  initialRoomCode,
  error,
  onSwitchProfile,
  onCreateRoom,
  onJoinRoom,
}) {
  const [step, setStep] = useState(1);
  const [playerCount, setPlayerCount] = useState(null);

  if (initialRoomCode) {
    return (
      <section className="lobby-wrapper">
        <div className="lobby-card">
          <header className="lobby-header">
            <p className="lobby-eyebrow">CLASHVERSE // JOIN MATCH</p>
            <h1 className="lobby-title">Room {initialRoomCode}</h1>
            <p className="lobby-subtitle">You will join as {player.username}.</p>
          </header>

          <ProfileBar player={player} onSwitchProfile={onSwitchProfile} />

          {error && <p className="lobby-error">{error}</p>}

          <Button
            variant="primary"
            fullWidth
            onClick={() => onJoinRoom({ roomCode: initialRoomCode })}
          >
            Join Room
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="lobby-wrapper">
      <div className="lobby-card">
        <header className="lobby-header">
          <p className="lobby-eyebrow">CLASHVERSE // STEP {step} OF 2</p>
          <h1 className="lobby-title">
            {step === 1 ? 'Select Players' : 'Select Trump Deck'}
          </h1>
          <p className="lobby-subtitle">
            {step === 1
              ? 'Choose how many players will join via your room link.'
              : `${playerCount} Players — pick WWE or Power Rangers.`}
          </p>
        </header>

        <ProfileBar player={player} onSwitchProfile={onSwitchProfile} />

        {step === 1 ? (
          <div className="lobby-section">
            <div className="player-grid">
              {PLAYER_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className="choice-tile"
                  onClick={() => {
                    setPlayerCount(count);
                    setStep(2);
                  }}
                >
                  <span className="choice-tile__big">{count}P</span>
                  <span className="choice-tile__sub">{count} Players</span>
                </button>
              ))}
            </div>
            {error && <p className="lobby-error">{error}</p>}
          </div>
        ) : (
          <div className="lobby-section">
            <div className="deck-grid">
              {Object.values(DECKS).map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  style={{ '--deck-accent': deck.accent }}
                  className="deck-tile deck-tile--active"
                  onClick={() =>
                    onCreateRoom({
                      maxPlayers: playerCount,
                      deckId: deck.id,
                    })
                  }
                >
                  <span className="deck-tile__name">{deck.name}</span>
                  <span className="deck-tile__desc">{deck.tagline}</span>
                  <span className="deck-tile__meta">
                    {Math.floor(deck.cards.length / playerCount)} cards each • Shuffled
                  </span>
                </button>
              ))}
            </div>

            {error && <p className="lobby-error">{error}</p>}

            <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
              ← Back to Player Select
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
