import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2, Newspaper, Bell, ImageOff, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type AdminNews, formatNewsDate, customersLabel } from '@/lib/news';
import { NewsCover } from '@/components/news/NewsCover';
import { cn } from '@/lib/utils';

interface ListResponse {
  news: AdminNews[];
  total: number;
  page: number;
}

const TABS = [
  { key: '', label: 'الكل' },
  { key: 'draft', label: 'مسودات' },
  { key: 'published', label: 'منشورة' },
];

const PAGE_SIZE = 20;

export function AdminNewsPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  // Tagged with the query it answers, so a tab change shows loading until
  // that tab's results arrive.
  const query = `status=${status}&page=${page}&page_size=${PAGE_SIZE}`;
  const [result, setResult] = useState<{ query: string; data: ListResponse | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ListResponse>(`/admin/news?${query}`)
      .then((d) => !cancelled && setResult({ query, data: d }))
      .catch((err) => {
        handleError(err);
        if (!cancelled) setResult({ query, data: null });
      });
    return () => { cancelled = true; };
  }, [query]);

  const loading = result?.query !== query;
  const data = loading ? null : result?.data ?? null;

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6" dir="rtl">
      <AdminPageHeader
        title="الأخبار"
        actions={
          <Button onClick={() => navigate('/admin/news/new')}>
            <Plus /> خبر جديد
          </Button>
        }
      />

      <div className="flex gap-1 rounded-lg border bg-card p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setStatus(t.key); setPage(1); }}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              status === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !data || data.news.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center">
          <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">لا توجد أخبار بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">الصق رابط خبر ودع الذكاء الاصطناعي يكتب المسودة.</p>
          <Button className="mt-4" onClick={() => navigate('/admin/news/new')}><Plus /> خبر جديد</Button>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {data.news.map((n) => (
            <Link key={n.public_id} to={`/admin/news/${n.public_id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/40">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {n.cover_image_url ? (
                  <NewsCover src={n.cover_image_url} className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageOff className="h-5 w-5" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {n.status === 'published' ? (
                    <Badge className="bg-green-600 hover:bg-green-600">منشور</Badge>
                  ) : (
                    <Badge variant="secondary">مسودة</Badge>
                  )}
                  {(n.interests ?? []).map((i) => (
                    <Badge key={i.id} variant="outline" className="text-xs font-normal">{i.name_ar}</Badge>
                  ))}
                </div>
                <p className="mt-1.5 truncate font-semibold">{n.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span>
                    {n.status === 'published' ? `نُشر ${formatNewsDate(n.published_at)}` : `آخر تعديل ${formatNewsDate(n.updated_at)}`}
                  </span>
                  {n.source_name && <span>المصدر: {n.source_name}</span>}
                  {n.notified_at && (
                    <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> أُرسل إلى {customersLabel(n.notified_count)}</span>
                  )}
                  {n.viewers > 0 && (
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> شاهده {customersLabel(n.viewers)}</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
          <span className="text-muted-foreground">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>التالي</Button>
        </div>
      )}
    </div>
  );
}
