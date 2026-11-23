export function shuffleDeck(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createInitialPlayers(playerCount, deckCards) {
  const shuffled = shuffleDeck(deckCards);
  const cardsPerPlayer = Math.floor(shuffled.length / playerCount);

  return Array.from({ length: playerCount }, (_, index) => ({
    id: index + 1,
    name: `Player ${index + 1}`,
    hand: shuffled.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer),
    roundsWon: 0,
  }));
}

export function evaluateRound(players, selectedStat) {
  const activePlayers = players.filter((p) => p.hand.length > 0);
  let highestValue = -1;
  let winners = [];

  activePlayers.forEach((player) => {
    const topCard = player.hand[0];
    const value = topCard.stats[selectedStat];

    if (value > highestValue) {
      highestValue = value;
      winners = [player.id];
    } else if (value === highestValue) {
      winners.push(player.id);
    }
  });

  return {
    isTie: winners.length > 1,
    winnerId: winners.length === 1 ? winners[0] : null,
    tiedPlayerIds: winners.length > 1 ? winners : [],
    highestValue,
  };
}
