import { useEffect, useState } from 'react';
import { formatTimeLeft, EXPIRED } from '@/lib/countdown';

// Ticking countdown label for a deadline. Pass withSeconds on surfaces showing a
// single countdown; see the note in lib/countdown.ts for why feed cards do not.
//
// endTime may be undefined while the post is still loading, which yields ''.
export function useCountdown(endTime: string | undefined, withSeconds = false) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endTime) {
      setTimeLeft('');
      return;
    }
    const update = () => setTimeLeft(formatTimeLeft(endTime, withSeconds));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime, withSeconds]);

  return { timeLeft, isExpired: timeLeft === EXPIRED };
}
