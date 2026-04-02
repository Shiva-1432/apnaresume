const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export function validateId(id: string): boolean {
  const normalized = String(id || '').trim();
  return ID_PATTERN.test(normalized);
}
