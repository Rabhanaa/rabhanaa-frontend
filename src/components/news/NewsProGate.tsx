import { useState } from 'react';
import { Crown, MessageCircle, Newspaper, Bell, TrendingUp } from 'lucide-react';
import { SubscriptionContactDialog } from '@/components/SubscriptionContactDialog';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// The upgrade prompt non-Pro members get instead of the news. On a story
// (newsId set) it sits under the story's teaser, and the "subscribe" tap is
// counted in that story's analytics.
export function NewsProGate({ newsId, embedded }: { newsId?: string; embedded?: boolean }) {
  const [contactOpen, setContactOpen] = useState(false);

  const subscribe = () => {
    if (newsId) api.post(`/news/${newsId}/upgrade-click`, {}).catch(() => { /* analytics only */ });
    setContactOpen(true);
  };

  return (
    <div className={cn('rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm', !embedded && 'mx-4 -mt-6')}>
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-50">
        <Crown className="size-8 text-amber-500" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold text-gray-900">
        {embedded ? 'اقرأ الخبر كاملًا مع برو' : 'الأخبار حصرية لمشتركي برو'}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-gray-500">
        تابع أخبار السوق والأسعار أولًا بأول، مكتوبة خصيصًا لتجار ربحانة.
      </p>
      <ul className="mt-5 space-y-3 text-start text-sm text-gray-700">
        <Benefit icon={TrendingUp} text="أخبار الأسعار والمعروض في السوق المصري" />
        <Benefit icon={Bell} text="إشعار فوري عند نشر خبر يهمك" />
        <Benefit icon={Newspaper} text="ملخصات واضحة من مصادر موثوقة" />
      </ul>
      <button
        onClick={subscribe}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 font-bold text-white transition-colors hover:bg-green-700"
      >
        <MessageCircle className="size-5" />
        اشترك في برو
      </button>
      <SubscriptionContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}

function Benefit({ icon: Icon, text }: { icon: typeof Bell; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
        <Icon className="size-4 text-green-600" />
      </span>
      {text}
    </li>
  );
}
