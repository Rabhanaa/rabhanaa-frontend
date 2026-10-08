import { useMemo } from 'react';
import { sanitizeNewsHtml } from '@/lib/news';
import { cn } from '@/lib/utils';

// Renders an article body. Shared by the member article page and the admin
// preview, so what the admin approves is exactly what members see.
export function NewsContent({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => sanitizeNewsHtml(html), [html]);
  return <div className={cn('news-content', className)} dir="rtl" dangerouslySetInnerHTML={{ __html: clean }} />;
}
