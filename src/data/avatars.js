export const STARTER_AVATARS = [
  { id: 'red-striker', label: 'Red Striker', symbol: '⚡', accent: '#e51937' },
  { id: 'cyber-ranger', label: 'Cyber Ranger', symbol: '🛡️', accent: '#00e5ff' },
  { id: 'venom-spark', label: 'Venom Spark', symbol: '🐉', accent: '#00ff88' },
  { id: 'shadow-titan', label: 'Shadow Titan', symbol: '💀', accent: '#b84dff' },
  { id: 'golden-champ', label: 'Golden Champ', symbol: '👑', accent: '#f5b942' },
  { id: 'nova-brawler', label: 'Nova Brawler', symbol: '🔥', accent: '#ff6b2b' },
];

export function getAvatarById(avatarId) {
  return STARTER_AVATARS.find((avatar) => avatar.id === avatarId) || STARTER_AVATARS[0];
}
