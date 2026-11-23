import { useState } from 'react';
import { STARTER_AVATARS } from '../../data/avatars';
import { AvatarSelector } from './AvatarSelector';
import { Button } from '../../components/Button/Button';
import './PlayerSetupForm.css';

export function PlayerSetupForm({ onCreateProfile }) {
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState(STARTER_AVATARS[0].id);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = username.trim();

    if (trimmed.length < 3) {
      setError('Callsign must be at least 3 characters.');
      return;
    }

    if (trimmed.length > 16) {
      setError('Callsign cannot exceed 16 characters.');
      return;
    }

    setError('');
    onCreateProfile({ username: trimmed, avatarId });
  }

  return (
    <section className="setup-wrapper">
      <div className="setup-card">
        <header className="setup-card__header">
          <p className="setup-card__eyebrow">CLASHVERSE // ARENA ENTRY</p>
          <h1 className="setup-card__title">Create Challenger</h1>
          <p className="setup-card__subtitle">
            Worlds collide. Legends rise. Choose your callsign and emblem to enter.
          </p>
        </header>

        <form className="setup-form" onSubmit={handleSubmit} noValidate>
          <div className="setup-form__field">
            <label htmlFor="player-username" className="setup-form__label">
              Challenger Callsign
            </label>
            <input
              id="player-username"
              type="text"
              className="setup-form__input"
              placeholder="e.g. CYBER_VIPER"
              maxLength={16}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="setup-form__error">{error}</p>}
          </div>

          <div className="setup-form__field">
            <span className="setup-form__label">Select Emblem</span>
            <AvatarSelector
              selectedAvatarId={avatarId}
              onSelect={setAvatarId}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth>
            Enter Clashverse
          </Button>
        </form>
      </div>
    </section>
  );
}
