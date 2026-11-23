import { useState } from 'react';
import { Button } from '../components/Button/Button';
import { AvatarBadge } from '../components/AvatarBadge/AvatarBadge';
import './LobbyPage.css';

export function LobbyPage({ roomState, onLeave }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?room=${roomState.roomCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="lobby-wrapper">
      <div className="lobby-card">
        <header className="lobby-header">
          <p className="lobby-eyebrow">WAITING FOR PLAYERS</p>
          <h1 className="lobby-title">Room {roomState.roomCode}</h1>
          <p className="lobby-subtitle">
            {roomState.deckName} • {roomState.players.length} / {roomState.maxPlayers} Joined
          </p>
        </header>

        <div className="share-box">
          <span className="share-box__label">Share this link with your friends:</span>
          <div className="share-box__row">
            <input type="text" readOnly value={shareUrl} className="setup-input" />
            <Button variant="primary" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        <div className="roster-list">
          {Array.from({ length: roomState.maxPlayers }, (_, idx) => {
            const joined = roomState.players[idx];
            return (
              <div
                key={idx}
                className={`roster-slot ${joined ? 'roster-slot--ready' : ''}`}
              >
                {joined ? (
                  <span className="roster-slot__who">
                    <AvatarBadge avatarId={joined.avatarId} size="sm" />
                    {joined.name}
                  </span>
                ) : (
                  <span>⏳ Waiting for Player {idx + 1}...</span>
                )}
                {joined?.isHost && <span className="host-tag">HOST</span>}
              </div>
            );
          })}
        </div>

        <Button variant="secondary" fullWidth onClick={onLeave}>
          Leave Room
        </Button>
      </div>
    </section>
  );
}
