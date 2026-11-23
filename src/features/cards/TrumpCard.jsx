import './TrumpCard.css';

export function TrumpCard({
  player,
  statLabels,
  isActiveTurn,
  isRevealed,
  selectedStat,
  isRoundWinner,
  onSelectStat,
}) {
  const topCard = player.hand[0];
  const isEliminated = !topCard;
  const showFace = isActiveTurn || isRevealed;

  return (
    <div
      className={[
        'trump-slot',
        isActiveTurn ? 'trump-slot--active' : '',
        isRoundWinner ? 'trump-slot--winner' : '',
        isEliminated ? 'trump-slot--out' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="trump-slot__header">
        <span className="trump-slot__player">
          {player.name} {isActiveTurn && !isRevealed ? '⚡ TURN' : ''}
        </span>
        <span className="trump-slot__count">
          {player.hand.length} {player.hand.length === 1 ? 'Card' : 'Cards'}
        </span>
      </div>

      {isEliminated ? (
        <div className="trump-card trump-card--eliminated">
          <span className="trump-card__out-text">ELIMINATED</span>
        </div>
      ) : !showFace ? (
        <div className="trump-card trump-card--back">
          <div className="trump-card__back-logo">CLASHVERSE</div>
          <p className="trump-card__back-sub">Waiting for stat pick...</p>
        </div>
      ) : (
        <div className={`trump-card trump-card--${topCard.rarity.toLowerCase()}`}>
          <div className="trump-card__top">
            <span className="trump-card__rarity">{topCard.rarity}</span>
            <span className="trump-card__emoji">{topCard.emoji}</span>
          </div>

          <h3 className="trump-card__name">{topCard.name}</h3>
          <p className="trump-card__title">{topCard.title}</p>

          <div className="trump-card__stats">
            {Object.entries(statLabels).map(([statKey, label]) => {
              const value = topCard.stats[statKey];
              const isPicked = selectedStat === statKey;
              const canClick = isActiveTurn && !isRevealed;

              return (
                <button
                  key={statKey}
                  type="button"
                  disabled={!canClick}
                  onClick={() => canClick && onSelectStat(statKey)}
                  className={[
                    'stat-row',
                    canClick ? 'stat-row--clickable' : '',
                    isPicked ? 'stat-row--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="stat-row__label">{label}</span>
                  <span className="stat-row__value">{value}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
