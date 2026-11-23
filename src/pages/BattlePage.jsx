import { Button } from '../components/Button/Button';
import { getAvatarById } from '../data/avatars';
import './BattlePage.css';

function getOverallRating(stats) {
  const values = Object.values(stats);
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

// Square avatar with the player's emblem and colour.
function SeatAvatar({ avatarId, isMe, offline }) {
  const avatar = getAvatarById(avatarId);
  return (
    <div
      className={[
        'avatar-square',
        isMe ? 'avatar-square--me' : '',
        offline ? 'avatar-square--offline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ borderColor: avatar.accent }}
      title={avatar.label}
    >
      <span aria-hidden="true">{avatar.symbol}</span>
    </div>
  );
}

// The two best stats of a card, so the hand works for any deck.
function getTopStats(card, statLabels, count = 2) {
  return Object.keys(statLabels)
    .map((key) => ({ key, label: statLabels[key], value: card.stats[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

export function BattlePage({
  roomState,
  error,
  onPickCard,
  onPickStat,
  onRematch,
  onLeave,
}) {
  const me = roomState.players.find((p) => p.id === roomState.myPlayerId);
  const opponents = roomState.players.filter((p) => p.id !== roomState.myPlayerId);
  const activePlayer = roomState.players.find(
    (p) => p.id === roomState.activePlayerId
  );
  const isMyStatTurn =
    roomState.phase === 'pick_stat' &&
    roomState.activePlayerId === roomState.myPlayerId;

  if (roomState.phase === 'finished') {
    const winner = roomState.matchWinner;
    const standings = [...roomState.players].sort((a, b) => b.points - a.points);

    return (
      <div className="room-floor">
        <section className="table-winner-modal">
          <p className="table-winner-modal__tag">MATCH COMPLETE</p>
          <h2 className="table-winner-modal__title">
            {winner?.isDraw ? "It's a Draw!" : `${winner?.name || 'Champion'} Wins!`}
          </h2>

          <ol className="standings">
            {standings.map((p, idx) => (
              <li
                key={p.id}
                className={`standings__row ${
                  p.id === roomState.myPlayerId ? 'standings__row--me' : ''
                }`}
              >
                <span className="standings__rank">{idx + 1}</span>
                <span className="standings__icon">
                  {getAvatarById(p.avatarId).symbol}
                </span>
                <span className="standings__name">
                  {p.id === roomState.myPlayerId ? `${p.name} (You)` : p.name}
                  {!p.connected && ' • offline'}
                </span>
                <span className="standings__wins">{p.roundsWon} rounds</span>
                <span className="standings__bp">{p.points} BP</span>
              </li>
            ))}
          </ol>

          {!roomState.canRematch && (
            <p className="table-winner-modal__note">
              A player is offline. Rematch opens when everyone is back.
            </p>
          )}
          {error && <p className="table-winner-modal__note">{error}</p>}

          <Button variant="primary" onClick={onRematch} disabled={!roomState.canRematch}>
            Deal New Match
          </Button>
          <Button variant="secondary" onClick={onLeave}>
            Leave Room
          </Button>
        </section>
      </div>
    );
  }

  // Assign opponent seats around the round table: top, left, right
  const seatPositions =
    opponents.length === 1
      ? ['seat--top']
      : opponents.length === 2
      ? ['seat--left', 'seat--right']
      : ['seat--left', 'seat--top', 'seat--right'];

  return (
    <div className="room-floor">
      {/* Top-Left Round Info */}
      <div className="table-topbar">
        <span className="wood-badge">
          {roomState.deckName} • Round {roomState.roundNumber}
        </span>
        <button type="button" className="leave-btn" onClick={onLeave}>
          Leave
        </button>
      </div>
      {error && <div className="table-error">{error}</div>}

      {/* Wooden Circular Table */}
      <div className="wood-table">
        <div className="wood-table__watermark">CLASHVERSE</div>

        {/* Opponents Seated Around the Table */}
        {opponents.map((opp, idx) => (
          <div key={opp.id} className={`table-seat ${seatPositions[idx]}`}>
            <div className="player-avatar-card">
              <SeatAvatar avatarId={opp.avatarId} offline={!opp.connected} />
              <div
                className={`name-pill ${
                  idx % 2 === 0 ? 'name-pill--blue' : 'name-pill--orange'
                }`}
              >
                {opp.name}
                {!opp.connected && ' (offline)'}
              </div>
              <span className="bp-chip">{opp.points || 0} BP</span>
            </div>

            {/* 3D Physical Card Stack */}
            <div className="deck-stack" title={`${opp.handCount} cards left`}>
              <div className="deck-stack__card">
                <div className="deck-stack__oval">
                  <span>CLASH</span>
                </div>
              </div>
              <span className="deck-stack__count">{opp.handCount}</span>
            </div>
          </div>
        ))}

        {/* Center Clash Zone */}
        <div className="table-center">
          {roomState.phase === 'reveal' && roomState.roundResult && (
            <div className="reveal-toast">
              {roomState.roundResult.isTie
                ? 'DRAW ROUND!'
                : `${
                    roomState.players.find(
                      (p) => p.id === roomState.roundResult.winnerId
                    )?.name
                  } WINS +3 BP (${roomState.statLabels[roomState.selectedStat]}: ${
                    roomState.roundResult.highestValue
                  })`}
            </div>
          )}

          <div className="center-clash-row">
            {roomState.players.map((p) => {
              const card = p.selectedCard;
              const isWinner =
                roomState.phase === 'reveal' &&
                roomState.roundResult?.winnerId === p.id;
              const canPickStat = isMyStatTurn && p.id === roomState.myPlayerId;

              return (
                <div
                  key={p.id}
                  className={`table-card-slot ${
                    isWinner ? 'table-card-slot--winner' : ''
                  }`}
                >
                  <span className="table-card-slot__who">
                    {p.id === roomState.myPlayerId ? 'You' : p.name}
                  </span>

                  {!p.hasPickedCard ? (
                    <div className="physical-card physical-card--empty">
                      <span>PICKING...</span>
                    </div>
                  ) : !card ? (
                    <div className="physical-card physical-card--back">
                      <div className="deck-stack__oval deck-stack__oval--lg">
                        <span>CLASH</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`physical-card physical-card--face physical-card--${card.rarity.toLowerCase()}`}
                    >
                      <div className="physical-card__header">
                        <span className="physical-card__ovr">
                          {getOverallRating(card.stats)}
                        </span>
                        <span className="physical-card__rarity">{card.rarity}</span>
                      </div>

                      <div className="physical-card__nameplate">
                        <h3>{card.name}</h3>
                        <p>{card.title}</p>
                      </div>

                      <div className="physical-card__stats">
                        {Object.entries(roomState.statLabels).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            disabled={!canPickStat}
                            onClick={() => canPickStat && onPickStat(key)}
                            className={[
                              'card-stat-btn',
                              canPickStat ? 'card-stat-btn--active' : '',
                              roomState.selectedStat === key
                                ? 'card-stat-btn--picked'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span>{label}</span>
                            <strong>{card.stats[key]}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom-Left: Your Avatar & Name Pill */}
        <div className="my-seat-corner">
          <SeatAvatar avatarId={me?.avatarId} isMe />
          <div className="name-pill name-pill--orange">{me?.name}</div>
          <span className="bp-chip">{me?.points || 0} BP</span>
        </div>

        {/* Bottom-Right: Tactile 3D Arcade Timer Button */}
        <div className="arcade-status-corner">
          <div
            className={`arcade-button ${
              roomState.timeLeft <= 10 && roomState.phase !== 'reveal'
                ? 'arcade-button--urgent'
                : ''
            }`}
          >
            <span className="arcade-button__top">
              {roomState.phase === 'pick_card'
                ? 'PICK CARD'
                : roomState.phase === 'pick_stat'
                ? isMyStatTurn
                  ? 'PICK STAT'
                  : 'WAIT TURN'
                : 'REVEAL'}
            </span>
            <span className="arcade-button__time">
              {roomState.phase === 'reveal' ? 'CLASH!' : `${roomState.timeLeft}s`}
            </span>
          </div>
          {roomState.phase === 'pick_stat' && !isMyStatTurn && (
            <span className="arcade-sub">{activePlayer?.name}'s turn</span>
          )}
        </div>
      </div>

      {/* Bottom Center: Your Fanned Physical Hand */}
      <section className="my-hand-tray">
        <div className="my-hand-fan">
          {me?.hand.map((card) => {
            const canPlay =
              roomState.phase === 'pick_card' && !me.hasPickedCard;
            const ovr = getOverallRating(card.stats);

            return (
              <button
                key={card.id}
                type="button"
                disabled={!canPlay}
                onClick={() => canPlay && onPickCard(card.id)}
                className={[
                  'hand-physical-card',
                  `hand-physical-card--${card.rarity.toLowerCase()}`,
                  canPlay ? 'hand-physical-card--playable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="hand-physical-card__top">
                  <span className="hand-physical-card__ovr">{ovr}</span>
                  <span className="hand-physical-card__tag">
                    {card.rarity.slice(0, 3)}
                  </span>
                </div>
                <div className="hand-physical-card__title">{card.name}</div>
                <div className="hand-physical-card__mini">
                  {getTopStats(card, roomState.statLabels).map((stat) => (
                    <span key={stat.key}>
                      {stat.label.slice(0, 3).toUpperCase()} {stat.value}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
