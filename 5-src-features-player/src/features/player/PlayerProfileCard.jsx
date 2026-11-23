import { AvatarBadge } from '../../components/AvatarBadge/AvatarBadge';
import { calculateWinRate } from './playerModel';
import './PlayerProfileCard.css';

export function PlayerProfileCard({ player }) {
  const winRate = calculateWinRate(player.wins, player.matchesPlayed);

  const stats = [
    { label: 'Matches', value: player.matchesPlayed },
    { label: 'Wins', value: player.wins },
    { label: 'Losses', value: player.losses },
    { label: 'Win Rate', value: `${winRate}%` },
    { label: 'Current Streak', value: player.currentWinStreak },
    { label: 'Best Streak', value: player.bestWinStreak },
    { label: 'Battle Points', value: player.totalBattlePoints, highlight: true },
    { label: 'Total XP', value: player.xp },
  ];

  return (
    <section className="profile-card" aria-label="Player Profile">
      <div className="profile-card__identity">
        <AvatarBadge avatarId={player.avatarId} size="lg" />
        <div className="profile-card__meta">
          <div className="profile-card__badges">
            <span className="rank-pill">{player.rank}</span>
            <span className="level-pill">LVL {player.level}</span>
          </div>
          <h2 className="profile-card__username">{player.username}</h2>
          <p className="profile-card__id">ID: {player.playerId}</p>
        </div>
      </div>

      <div className="profile-card__stats">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`stat-tile ${stat.highlight ? 'stat-tile--gold' : ''}`}
          >
            <span className="stat-tile__label">{stat.label}</span>
            <span className="stat-tile__value">{stat.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
