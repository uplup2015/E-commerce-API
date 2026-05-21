export const testPassword = 'secret123';

export function uniqueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
