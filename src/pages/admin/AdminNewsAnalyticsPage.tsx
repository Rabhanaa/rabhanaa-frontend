import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bell, BookOpenCheck, Check, Crown, Eye, Loader2, MousePointerClick, Pencil, RefreshCw, Send, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { type AdminNews, type NewsAnalytics, type NewsViewer, formatNewsDate, percent } from '@/lib/news';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: '', label: 'الكل' },
  { key: 'pro', label: 'مشتركو برو' },
  { key: 'free', label: 'غير المشتركين' },
  { key: 'push', label: 'فتحوا من الإشعار' },
  { key: 'upgrade', label: 'ضغطوا «اشترك»' },
];

const PAGE_SIZE = 20;

interface ViewerList {
  viewers: NewsViewer[];
  total: number;
  page: number;
}

export function AdminNewsAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [news, setNews] = useState<AdminNews | null>(null);
  const [stats, setStats] = useState<NewsAnalytics | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewers, setViewers] = useState<{ query: string; data: ViewerList } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<{ news: AdminNews }>(`/admin/news/${id}`),
      api.get<NewsAnalytics>(`/admin/news/${id}/analytics`),
    ])
      .then(([n, a]) => {
        if (cancelled) return;
        setNews(n.news);
        setStats(a);
      })
      .catch((err) => {
        handleError(err);
        navigate('/admin/news', { replace: true });
      })
      .finally(() => !cancelled && setRefreshing(false));
    return () => { cancelled = true; };
  }, [id, tick]);

  const query = `filter=${filter}&page=${page}&page_size=${PAGE_SIZE}&t=${tick}`;
  useEffect(() => {
    let cancelled = false;
    api
      .get<ViewerList>(`/admin/news/${id}/viewers?${query}`)
      .then((d) => !cancelled && setViewers({ query, data: d }))
      .catch(handleError);
    return () => { cancelled = true; };
  }, [id, query]);

  const refresh = () => {
    setRefreshing(true);
    setTick((t) => t + 1);
  };

  if (!news || !stats) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const s = stats;
  const readers = s.viewers_pro + s.converted;
  const fromApp = s.viewers - s.push_opens;
  const list = viewers?.query === query ? viewers.data : null;
  const pages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6" dir="rtl">
      <AdminPageHeader
        title="تحليلات الخبر"
        breadcrumbs={[
          { label: 'الأخبار', to: '/admin/news' },
          { label: news.title, to: `/admin/news/${news.public_id}` },
          { label: 'التحليلات' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />} تحديث
            </Button>
            <Button variant="outline" onClick={() => navigate(`/admin/news/${news.public_id}`)}>
              <Pencil /> تعديل الخبر
            </Button>
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        {news.published_at ? `نُشر ${formatNewsDate(news.published_at)}` : 'غير منشور'}
        {' · '}
        {s.notified_at ? `أُرسل الإشعار ${formatNewsDate(s.notified_at)}` : 'لم يُرسل إشعار لهذا الخبر'}
      </p>

      {/* Headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatTile icon={Users} label="المستهدفون بالإشعار" value={s.recipients}
          note={`${s.recipients_pro} برو · ${s.recipients_free} غير مشترك`} />
        <StatTile icon={Send} label="وصلهم الإشعار" value={s.delivered}
          note={ratio(s.delivered, s.recipients, 'من المستهدفين', 'لم يُرسل إشعار')} />
        <StatTile icon={Bell} label="فتحوا الإشعار" value={s.push_opens}
          note={ratio(s.push_opens, s.delivered, 'ممن وصلهم', 'لا توجد بيانات توصيل بعد')} />
        <StatTile icon={Eye} label="شاهدوا الخبر" value={s.viewers}
          note={`${s.push_opens} من الإشعار · ${fromApp} من التطبيق`} />
        <StatTile icon={BookOpenCheck} label="قرأوه حتى النهاية" value={s.read_to_end}
          note={ratio(s.read_to_end, readers, 'من قرّائه', 'لم يقرأه مشترك بعد')} />
        <StatTile icon={MousePointerClick} label="ضغطوا «اشترك»" value={s.upgrade_clicks}
          note={ratio(s.upgrade_clicks, s.viewers_free, 'ممن رأوا دعوة الاشتراك', 'لم يفتحه غير مشترك بعد')} />
      </div>

      {/* Pro and non-Pro, each as its own funnel */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel
          title="مشتركو برو"
          icon={<Crown className="h-4 w-4 text-amber-500" />}
          steps={[
            { label: 'المستهدفون', value: s.recipients_pro },
            { label: 'وصلهم الإشعار', value: s.delivered_pro },
            { label: 'فتحوا الإشعار', value: s.push_opens_pro },
            { label: 'قرأوا الخبر', value: s.viewers_pro, hint: 'من الإشعار أو من التطبيق' },
          ]}
        />
        <Funnel
          title="غير المشتركين"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          steps={[
            { label: 'المستهدفون', value: s.recipients_free },
            { label: 'وصلهم الإشعار', value: s.delivered_free },
            { label: 'فتحوا الإشعار', value: s.push_opens_free },
            { label: 'رأوا دعوة الاشتراك', value: s.viewers_free, hint: 'من الإشعار أو من التطبيق' },
            { label: 'ضغطوا «اشترك»', value: s.upgrade_clicks },
            { label: 'اشتركوا وقرأوه', value: s.converted },
          ]}
        />
      </div>

      <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
        «وصلهم الإشعار» يعني أن خدمة الإشعارات استلمته لجهاز واحد على الأقل للعميل؛ من لم يفعّل الإشعارات على جهازه لا يصله.
        «قرأوه حتى النهاية» تُحسب عند الوصول لآخر نص الخبر.
      </p>

      {/* Who */}
      <section className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <h3 className="me-2 font-semibold">من فتح الخبر</h3>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === f.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {f.label}
            </button>
          ))}
          {list && <span className="ms-auto text-xs text-muted-foreground">{list.total} عميل</span>}
        </div>

        {!list ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : list.viewers.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا يوجد عملاء في هذا التصنيف بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-start font-medium">العميل</th>
                  <th className="px-4 py-2.5 text-start font-medium">الاشتراك</th>
                  <th className="px-4 py-2.5 text-center font-medium">من الإشعار</th>
                  <th className="px-4 py-2.5 text-center font-medium">أكمل القراءة</th>
                  <th className="px-4 py-2.5 text-center font-medium">ضغط «اشترك»</th>
                  <th className="px-4 py-2.5 text-center font-medium">مرات الفتح</th>
                  <th className="px-4 py-2.5 text-start font-medium">آخر فتح</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.viewers.map((v) => (
                  <tr key={v.public_id} className="hover:bg-accent/30">
                    <td className="px-4 py-2.5">
                      <Link to={`/admin/users/${v.public_id}`} className="font-medium hover:underline">{v.name}</Link>
                      <p className="text-xs text-muted-foreground" dir="ltr">{v.phone || v.email}</p>
                    </td>
                    <td className="px-4 py-2.5"><PlanBadge viewer={v} /></td>
                    <td className="px-4 py-2.5 text-center"><Flag on={v.from_push} label="فتح من الإشعار" /></td>
                    <td className="px-4 py-2.5 text-center"><Flag on={v.read_to_end} label="أكمل القراءة" /></td>
                    <td className="px-4 py-2.5 text-center"><Flag on={v.upgrade_clicked} label="ضغط اشترك" /></td>
                    <td className="px-4 py-2.5 text-center tabular-nums">{v.view_count}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(v.last_viewed_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t p-3 text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
            <span className="text-muted-foreground">{page} / {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>التالي</Button>
          </div>
        )}
      </section>
    </div>
  );
}

// "45% of …", or a plain sentence when there is nothing to divide by yet.
function ratio(part: number, whole: number, of: string, empty: string): string {
  return whole > 0 ? `${percent(part, whole)} ${of}` : empty;
}

function StatTile({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: number; note: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString('en-US')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

// One group's path from notification to reading, as bars against the group's
// largest step. One hue throughout: the bars show amounts, and the two groups
// are told apart by their titles, not by colour.
function Funnel({ title, icon, steps }: {
  title: string;
  icon: React.ReactNode;
  steps: { label: string; value: number; hint?: string }[];
}) {
  const base = Math.max(1, ...steps.map((s) => s.value));
  const first = steps[0].value;
  return (
    <section className="rounded-lg border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">{icon}{title}</h3>
      <div className="space-y-3.5">
        {steps.map((step, i) => (
          <div key={step.label} title={`${step.label}: ${step.value}${i > 0 ? ` (${percent(step.value, first)} من المستهدفين)` : ''}`}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span>
                {step.label}
                {step.hint && <span className="ms-1.5 text-xs text-muted-foreground">({step.hint})</span>}
              </span>
              <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
                <span className="font-semibold">{step.value}</span>
                {i > 0 && first > 0 && <span className="text-xs text-muted-foreground">({percent(step.value, first)})</span>}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${(step.value / base) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanBadge({ viewer }: { viewer: NewsViewer }) {
  if (viewer.gated && viewer.read_as_pro) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"><Crown className="h-3 w-3" /> اشترك بعدها</span>;
  }
  if (viewer.read_as_pro) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"><Crown className="h-3 w-3" /> برو</span>;
  }
  return <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">غير مشترك</span>;
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return on
    ? <Check className="mx-auto h-4 w-4 text-primary" aria-label={label} />
    : <span className="text-muted-foreground" aria-label={`لم ${label}`}>—</span>;
}
