const PALETTE = [
  "#FF5C5C", "#5C9EFF", "#5CFFA1", "#FFD15C",
  "#C45CFF", "#FF5CD1", "#5CFFEC", "#FF935C",
];

export function colorForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
