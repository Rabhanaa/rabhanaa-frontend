import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Clock, Loader2, Lock, Newspaper, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { useApiError } from '@/hooks/useApiError';
import { NewsContent } from '@/components/news/NewsContent';
import { NewsProGate } from '@/components/news/NewsProGate';
import { NewsCover } from '@/components/news/NewsCover';
import { type NewsArticle, type NewsTeaser, formatNewsDate, readingMinutes } from '@/lib/news';

type Result =
  | { id?: string; state: 'ready'; article: NewsArticle }
  | { id?: string; state: 'locked'; teaser?: NewsTeaser }
  | { id?: string; state: 'missing' };

export function NewsArticlePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleError } = useApiError();
  // Keyed by id, so moving to another article shows loading until it arrives.
  const [result, setResult] = useState<Result | null>(null);
  const fromPush = params.get('src') === 'push';

  useEffect(() => {
    let cancelled = false;
    const done = (r: Result) => {
      if (cancelled) return;
      setResult({ ...r, id: publicId });
      // The tap is counted; drop the marker so a refresh is not a second tap.
      if (fromPush) setParams({}, { replace: true });
    };
    api
      .get<{ news: NewsArticle }>(`/news/${publicId}${fromPush ? '?src=push' : ''}`)
      .then((d) => done({ state: 'ready', article: d.news }))
      .catch((err) => {
        if (err instanceof ApiError && err.code === 'PRO_REQUIRED') {
          return done({ state: 'locked', teaser: (err.data as { teaser?: NewsTeaser } | undefined)?.teaser });
        }
        if (!(err instanceof ApiError && err.code === 'NEWS_NOT_FOUND')) handleError(err);
        done({ state: 'missing' });
      });
    return () => { cancelled = true; };
  }, [publicId]);

  const current = result && result.id === publicId ? result : null;

  // Opened from a push the app was not showing, there is no history to go
  // back through; the news list is the sensible parent.
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/news', { replace: true }));

  if (!current) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="size-8 animate-spin text-green-600" /></div>;
  }

  if (current.state === 'missing' || (current.state === 'locked' && !current.teaser)) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
        <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-4 pb-12 pt-12 text-white">
          <div className="flex items-center gap-2">
            <button onClick={back} className="rounded-full bg-white/20 p-1.5" aria-label="رجوع"><ChevronRight size={20} /></button>
            <h1 className="text-lg font-extrabold">أخبار السوق</h1>
          </div>
        </div>
        {current.state === 'locked' ? (
          <NewsProGate newsId={publicId} />
        ) : (
          <div className="mx-4 -mt-6 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <Newspaper className="mx-auto size-10 text-gray-300" />
            <p className="mt-3 font-bold text-gray-800">الخبر غير متاح</p>
            <p className="mt-1 text-sm text-gray-500">ربما حُذف أو أُلغي نشره.</p>
            <button onClick={() => navigate('/news', { replace: true })} className="mt-5 h-11 rounded-2xl bg-green-600 px-6 text-sm font-bold text-white">
              كل الأخبار
            </button>
          </div>
        )}
      </div>
    );
  }

  // Pro members get the story; others get the same top of the page — cover,
  // title, summary — and the upgrade prompt where the body would be.
  const story = current.state === 'ready' ? current.article : current.teaser!;
  const article = current.state === 'ready' ? current.article : null;

  const share = async () => {
    const url = `${window.location.origin}/news/${story.public_id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: story.title, text: story.summary, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('تم نسخ رابط الخبر');
      }
    } catch {
      /* the member closed the share sheet */
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Hero: the cover with floating controls, or the green header without one */}
      {story.cover_image_url ? (
        <div className="relative">
          <NewsCover src={story.cover_image_url} className="aspect-[4/3] w-full sm:aspect-[16/8]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
          <TopControls onBack={back} onShare={share} floating />
        </div>
      ) : (
        <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 pb-14 pt-2">
          <TopControls onBack={back} onShare={share} />
        </div>
      )}

      <article className="relative -mt-8 rounded-t-[32px] bg-white px-5 pb-8 pt-6 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-green-700">
            <span>{formatNewsDate(story.published_at)}</span>
            {article ? (
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="size-3.5" />
                {readingMinutes(article.body_html)} د قراءة
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <Lock className="size-3.5" /> لمشتركي برو
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold leading-[1.45] text-gray-900">{story.title}</h1>

          {article && article.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.interests.map((i) => (
                <span key={i.id} className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">{i.name_ar}</span>
              ))}
            </div>
          )}

          {story.summary && (
            <p className="mt-5 border-s-4 border-green-500 ps-4 text-base font-semibold leading-8 text-gray-700">
              {story.summary}
            </p>
          )}

          {article ? (
            <>
              <NewsContent html={article.body_html} className="mt-6" />
              <ReadToEnd newsId={article.public_id} />
              <button
                onClick={() => navigate('/news')}
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Newspaper className="size-4" /> كل الأخبار
              </button>
            </>
          ) : (
            <>
              {/* Where the body would be: a hint of more text, fading out. */}
              <div aria-hidden className="relative mt-6 space-y-3 overflow-hidden">
                {[100, 92, 97, 85, 94].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
              </div>
              <div className="mt-4">
                <NewsProGate newsId={story.public_id} embedded />
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

// Counts a read once the member scrolls to the end of the body.
function ReadToEnd({ newsId }: { newsId: string }) {
  const marker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = marker.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        api.post(`/news/${newsId}/read`, {}).catch(() => { /* analytics only */ });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [newsId]);
  return <div ref={marker} aria-hidden className="h-px" />;
}

function TopControls({ onBack, onShare, floating }: { onBack: () => void; onShare: () => void; floating?: boolean }) {
  const btn = 'rounded-full p-2 text-white backdrop-blur-sm ' + (floating ? 'bg-black/30' : 'bg-white/20');
  return (
    <div className={(floating ? 'absolute inset-x-0 top-0 ' : '') + 'flex items-center justify-between px-4 pt-10'}>
      <button onClick={onBack} className={btn} aria-label="رجوع"><ChevronRight size={20} /></button>
      <button onClick={onShare} className={btn} aria-label="مشاركة"><Share2 size={18} /></button>
    </div>
  );
}
