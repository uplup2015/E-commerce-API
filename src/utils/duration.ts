export function parseDurationMs(value: string) {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration value: ${value}`);

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit as keyof typeof multipliers];
}
