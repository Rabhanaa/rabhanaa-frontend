import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Newspaper } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { useApiError } from '@/hooks/useApiError';
import { NewsProGate } from '@/components/news/NewsProGate';
import { NewsCover } from '@/components/news/NewsCover';
import { type NewsListItem, formatNewsDate } from '@/lib/news';

interface ListResponse {
  news: NewsListItem[];
  total: number;
  page: number;
}

const PAGE_SIZE = 10;

export function NewsListPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [items, setItems] = useState<NewsListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    api
      .get<ListResponse>(`/news?page=1&page_size=${PAGE_SIZE}`)
      .then((d) => {
        setItems(d.news);
        setTotal(d.total);
        // Opening the list is what clears the unread badge on the profile.
        // The "جديد" marks on this screen were computed before this call.
        api.post('/news/seen', {}).catch(() => {});
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'PRO_REQUIRED') setLocked(true);
        else handleError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const d = await api.get<ListResponse>(`/news?page=${page + 1}&page_size=${PAGE_SIZE}`);
      setItems((prev) => [...prev, ...d.news]);
      setTotal(d.total);
      setPage(page + 1);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const [featured, ...rest] = items;

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-4 pb-12 pt-12 text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded-full bg-white/20 p-1.5" aria-label="رجوع">
            <ChevronRight size={20} />
          </button>
          <h1 className="text-lg font-extrabold">أخبار السوق</h1>
        </div>
        <p className="mt-3 text-sm text-white/80">آخر أخبار الأسعار والأسواق، حصريًا لمشتركي برو</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-green-600" /></div>
      ) : locked ? (
        <NewsProGate />
      ) : items.length === 0 ? (
        <div className="mx-4 -mt-6 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <Newspaper className="mx-auto size-10 text-gray-300" />
          <p className="mt-3 font-bold text-gray-800">لا توجد أخبار بعد</p>
          <p className="mt-1 text-sm text-gray-500">سنرسل لك إشعارًا فور نشر أول خبر.</p>
        </div>
      ) : (
        <div className="-mt-6 space-y-3 px-4">
          {featured && <FeaturedCard item={featured} />}
          {rest.map((item) => <NewsRow key={item.public_id} item={item} />)}

          {items.length < total && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex h-12 w-full items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingMore ? <Loader2 className="size-5 animate-spin" /> : 'عرض المزيد'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NewBadge() {
  return <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">جديد</span>;
}

function Meta({ item }: { item: NewsListItem }) {
  return (
    <p className="text-[11px] text-gray-400">
      {formatNewsDate(item.published_at)}
    </p>
  );
}

function FeaturedCard({ item }: { item: NewsListItem }) {
  return (
    <Link
      to={`/news/${item.public_id}`}
      className="block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-transform active:scale-[0.99]"
    >
      {/* Title under the image rather than over it: the whole cover stays
          visible, and the title stays readable on any photo. */}
      {item.cover_image_url && <NewsCover src={item.cover_image_url} className="aspect-[16/10] w-full" />}
      <div className="space-y-1.5 px-4 pt-4">
        {item.is_new && <NewBadge />}
        <h2 className="text-lg font-extrabold leading-snug text-gray-900">{item.title}</h2>
        <Meta item={item} />
      </div>
      {item.summary ? (
        <p className="line-clamp-2 px-4 pb-4 pt-2 text-sm leading-6 text-gray-600">{item.summary}</p>
      ) : (
        <div className="pb-4" />
      )}
    </Link>
  );
}

function NewsRow({ item }: { item: NewsListItem }) {
  return (
    <Link
      to={`/news/${item.public_id}`}
      className="flex gap-3 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-green-50">
        {item.cover_image_url ? (
          <NewsCover src={item.cover_image_url} className="size-full" />
        ) : (
          <div className="flex size-full items-center justify-center"><Newspaper className="size-7 text-green-300" /></div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        {item.is_new && <NewBadge />}
        <h3 className="line-clamp-2 text-sm font-bold leading-6 text-gray-900">{item.title}</h3>
        {item.summary && <p className="line-clamp-1 text-xs text-gray-500">{item.summary}</p>}
        <Meta item={item} />
      </div>
    </Link>
  );
}
