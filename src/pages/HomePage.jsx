import { PlayerProfileCard } from '../features/player/PlayerProfileCard';
import { Button } from '../components/Button/Button';
import './HomePage.css';

const UPCOMING_MODES = [
  { id: 'battle', title: 'Battle Arena', phase: 'Phase 3' },
  { id: 'collection', title: 'Card Collection', phase: 'Phase 2' },
  { id: 'leaderboard', title: 'Leaderboard', phase: 'Phase 7' },
  { id: 'challenges', title: 'Daily Challenges', phase: 'Phase 5' },
  { id: 'events', title: 'Multiverse Events', phase: 'Phase 6' },
];

export function HomePage({ player, onResetProfile }) {
  function handleReset() {
    const confirmed = window.confirm(
      'Reset local guest profile? This will clear your saved Phase 1 profile.'
    );
    if (confirmed) {
      onResetProfile();
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1 className="home-header__brand">CLASHVERSE</h1>
          <p className="home-header__tagline">Worlds collide. Legends rise.</p>
        </div>
        <Button variant="danger" onClick={handleReset}>
          Reset Profile
        </Button>
      </header>

      <main className="home-grid">
        <div className="home-grid__main">
          <PlayerProfileCard player={player} />
        </div>

        <aside className="home-menu" aria-label="Main Menu">
          <h3 className="home-menu__title">Command Deck</h3>
          <div className="home-menu__list">
            <div className="menu-item menu-item--active">
              <span className="menu-item__name">Player Profile</span>
              <span className="menu-item__status">Active</span>
            </div>

            {UPCOMING_MODES.map((mode) => (
              <div key={mode.id} className="menu-item menu-item--locked">
                <span className="menu-item__name">🔒 {mode.title}</span>
                <span className="menu-item__status">{mode.phase}</span>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
