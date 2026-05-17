export function isRequired(value: unknown) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
