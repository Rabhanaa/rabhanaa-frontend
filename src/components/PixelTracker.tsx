import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initPixel, trackPixel } from '@/lib/pixel';

// Must live inside the Router — useLocation needs the router context.
export function PixelTracker() {
  const location = useLocation();

  useEffect(() => {
    initPixel();
  }, []);

  useEffect(() => {
    trackPixel('PageView');
  }, [location.pathname]);

  return null;
}
