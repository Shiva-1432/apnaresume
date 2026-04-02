export function formatDate(value?: string | Date | null, locale = 'en-US'): string {
  if (!value) {
    return 'Recently';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently';
  }

  return parsed.toLocaleDateString(locale);
}

export function formatRelativeDate(
  value?: string | Date | null,
  nowInput?: string | Date
): string {
  if (!value) {
    return 'Recently';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently';
  }

  const now = nowInput ? new Date(nowInput) : new Date();
  if (Number.isNaN(now.getTime())) {
    return 'Recently';
  }

  const msInDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - parsed.getTime()) / msInDay);

  if (diffDays <= 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  return `${diffDays} days ago`;
}