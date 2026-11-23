import { getAvatarById } from '../../data/avatars';
import './AvatarBadge.css';

export function AvatarBadge({ avatarId, size = 'md' }) {
  const avatar = getAvatarById(avatarId);

  return (
    <div
      className={`avatar-badge avatar-badge--${size}`}
      style={{ '--avatar-accent': avatar.accent }}
      aria-label={avatar.label}
    >
      <span className="avatar-badge__symbol" role="img" aria-hidden="true">
        {avatar.symbol}
      </span>
    </div>
  );
}
