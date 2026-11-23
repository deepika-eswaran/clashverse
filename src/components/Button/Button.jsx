import './Button.css';

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
  onClick,
}) {
  const classNames = [
    'cv-btn',
    `cv-btn--${variant}`,
    fullWidth ? 'cv-btn--full' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || variant === 'locked'}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
