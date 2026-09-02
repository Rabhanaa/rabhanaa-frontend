// The countdown label shown on cards and post detail pages.
//
// This lives in one place because three copies of it had already drifted apart,
// the same way the status labels in postStatus.ts did. Keep it single-sourced.
export const EXPIRED = 'منتهي';

// withSeconds is for a surface showing ONE countdown — the post detail pages —
// where a visibly ticking clock reassures the viewer the deadline is live.
//
// Feed cards deliberately leave it off. Above an hour the label then changes
// only once a minute, so setState is handed an identical string on the other 59
// ticks and React skips the re-render. Turning seconds on for the feed would
// re-render every visible card once a second, which is felt on mobile.
//
// Deals ran for 1 hour before #1 raised them to 24, which is why every card
// used to tick: they all sat in the minutes branch. They now sit in the hours
// branch for their first 23 hours.
export function formatTimeLeft(endTime: string, withSeconds = false): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return EXPIRED;

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (hours > 24) return `${Math.floor(hours / 24)} يوم`;
  if (hours > 0) {
    return withSeconds ? `${hours}س ${minutes}د ${seconds}ث` : `${hours}س ${minutes}د`;
  }
  // Under an hour every surface shows seconds — this is when they matter.
  if (minutes > 0) return `${minutes}د ${seconds}ث`;
  return `${seconds}ث`;
}
