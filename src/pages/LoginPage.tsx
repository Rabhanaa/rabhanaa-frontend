import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApiError } from '@/hooks/useApiError';
import { registerPushToken } from '@/lib/notifications';
import { Banknote, Zap, Clock, ShieldCheck } from 'lucide-react';

const benefits = [
  { icon: Banknote, title: 'سيولة كاش فورية', desc: 'بيع بضاعتك وحصّل فلوسك كاش بدون تأخير.' },
  { icon: Zap, title: 'سرعة في التنفيذ', desc: 'صفقات بتخلص في 90 دقيقة بس.' },
  { icon: Clock, title: 'توفير وقت وجهد', desc: 'ولا مشاوير ولا تفاوض، كله من موبايلك.' },
  { icon: ShieldCheck, title: 'شبكة موثوقة', desc: 'تجار وموردين تم التحقق من هويتهم.' },
];

interface LoginResponse {
  access_token: string;
  user: {
    public_id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    is_admin: boolean;
    region_name: string;
    job_name: string;
    subscribed: boolean;
    in_trial: boolean;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { handleError } = useApiError();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((prev) => (prev + 1) % benefits.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post<LoginResponse>('/auth/login', { email, password });
      setAuth(data.access_token, data.user);
      registerPushToken().catch((err) => console.error('[push] Token registration failed:', err))
      navigate(data.user.is_admin ? '/admin/users' : '/auctions');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const ActiveIcon = benefits[activeSlide].icon;

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 text-white pt-14 pb-10 px-6 rounded-b-[40px] shadow-2xl flex flex-col items-center justify-center min-h-[42vh] relative overflow-hidden">
        <img src="/brand/icon-ar-white.png" alt="ربحانة" className="h-20 w-auto mb-2" />
        <p className="text-green-100 text-sm mb-8">مع ربحانة دايما ربحانة</p>

        <div className="flex flex-col items-center gap-3 transition-all duration-500">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <ActiveIcon size={32} className="text-white" />
          </div>
          <p className="text-lg font-bold text-white text-center">{benefits[activeSlide].title}</p>
          <p className="text-green-100 text-sm text-center max-w-xs">{benefits[activeSlide].desc}</p>
        </div>

        <div className="flex gap-1.5 mt-6">
          {benefits.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pt-10 pb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">تسجيل الدخول</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-base font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1.5">
              كلمة المرور
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-base font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">ليس لديك حساب؟ </span>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-green-600 font-bold hover:underline"
          >
            سجل الآن
          </button>
        </div>
      </div>
    </div>
  );
}
