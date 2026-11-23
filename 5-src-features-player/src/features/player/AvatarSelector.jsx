import { STARTER_AVATARS } from '../../data/avatars';
import { AvatarBadge } from '../../components/AvatarBadge/AvatarBadge';
import './AvatarSelector.css';

export function AvatarSelector({ selectedAvatarId, onSelect }) {
  return (
    <div className="avatar-selector" role="radiogroup" aria-label="Select Avatar">
      {STARTER_AVATARS.map((avatar) => {
        const isSelected = avatar.id === selectedAvatarId;
        return (
          <button
            key={avatar.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`avatar-option ${isSelected ? 'avatar-option--selected' : ''}`}
            style={{ '--option-accent': avatar.accent }}
            onClick={() => onSelect(avatar.id)}
          >
            <AvatarBadge avatarId={avatar.id} size="sm" />
            <span className="avatar-option__label">{avatar.label}</span>
          </button>
        );
      })}
    </div>
  );
}
