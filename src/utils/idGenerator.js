const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomBlock(length) {
  let block = '';
  const values = new Uint32Array(length);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i += 1) {
      block += ALPHANUMERIC[values[i] % ALPHANUMERIC.length];
    }
    return block;
  }

  for (let i = 0; i < length; i += 1) {
    block += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return block;
}

export function generatePlayerId() {
  return `CLV-${randomBlock(4)}-${randomBlock(4)}`;
}
