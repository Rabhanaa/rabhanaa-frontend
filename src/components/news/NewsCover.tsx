import { cn } from '@/lib/utils';

// Shows a cover in full, whatever its shape. A fixed frame with object-cover
// cut logos and tall photos in half; here the image is contained and the
// spare space is filled with a blurred copy of itself.
export function NewsCover({ src, className, rounded }: { src: string; className?: string; rounded?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-gray-900', rounded, className)}>
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl" />
      <img src={src} alt="" className="relative size-full object-contain" loading="lazy" />
    </div>
  );
}
