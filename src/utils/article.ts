export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// ~230 words a minute, ignoring markdown image/link syntax.
export const readingMinutes = (body: string) => {
  const words = body.replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
};
