import { useState, useEffect, type FormEvent } from 'react';
import { useApiError } from '@/hooks/useApiError';

function validatePassword(p: string) {
  return {
    length:    p.length >= 8 && p.length <= 16,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    digit:     /[0-9]/.test(p),
    special:   /[^A-Za-z0-9]/.test(p),
  };
}
import { useNavigate } from 'react-router-dom';
import { useAuthStore, CARRIER_ROLE } from '@/stores/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_CONFIG } from '@/lib/api';
import { trackPixel } from '@/lib/pixel';

interface Region {
  id: number;
  name_ar: string;
  is_active: boolean;
}

interface Job {
  id: number;
  key: string;
  name_ar: string;
  is_active: boolean;
}

// Roles the client asked to be offered the retail-supply question. A plain
// trader or company is not asked.
const SUPPLY_SIDE_ROLES = ['importer', 'wholesaler', 'distributor', 'processor', 'supplier'];

const SIGNUP_SOURCES: { value: string; label: string }[] = [
  { value: 'facebook',  label: 'فيسبوك' },
  { value: 'google',    label: 'جوجل' },
  { value: 'instagram', label: 'إنستجرام' },
  { value: 'tiktok',    label: 'تيك توك' },
  { value: 'x',         label: 'إكس (تويتر)' },
  { value: 'snapchat',  label: 'سناب شات' },
  { value: 'friend',    label: 'صديق' },
  { value: 'app_store', label: 'متجر التطبيقات' },
  { value: 'search',    label: 'بحث' },
  { value: 'other',     label: 'أخرى' },
  { value: 'direct',    label: 'مباشرة' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { handleError } = useApiError();

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', region_id: '', job_id: '', signup_source: '',
  });
  const [suppliesToRetail, setSuppliesToRetail] = useState(false);
  // A carrier picks the governorates it serves where a merchant picks interests:
  // coverage is what decides which jobs it is ever shown, so registration cannot
  // complete without at least one. The backend refuses an empty set too.
  const [carrierRegionIDs, setCarrierRegionIDs] = useState<number[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const selectedJob = jobs.find((j) => j.id.toString() === formData.job_id);
  const isSupplySideRole = !!selectedJob && SUPPLY_SIDE_ROLES.includes(selectedJob.key);
  const isCarrierRole = selectedJob?.key === CARRIER_ROLE;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsRes, jobsRes] = await Promise.all([
          fetch(`${API_CONFIG.FULL_URL}/regions`),
          fetch(`${API_CONFIG.FULL_URL}/jobs`),
        ]);
        if (regionsRes.ok && jobsRes.ok) {
          const regionsData = await regionsRes.json();
          const jobsData = await jobsRes.json();
          setRegions(regionsData.regions || []);
          setJobs(jobsData.jobs || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneValid || !pwValid || !formData.signup_source) return;
    if (isCarrierRole && carrierRegionIDs.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.FULL_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          region_id: parseInt(formData.region_id),
          job_id: parseInt(formData.job_id),
          supplies_to_retail: suppliesToRetail,
          carrier_region_ids: isCarrierRole ? carrierRegionIDs : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Registration failed');
      }
      const data = await response.json();
      setAuth(data.access_token, data.user);
      trackPixel('CompleteRegistration');
      // Carriers have no interests to pick and no location step — they wait for
      // an admin, and their own screens are all they can use meanwhile.
      navigate(isCarrierRole ? '/carrier/jobs' : '/select-interests');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-500 font-bold">جاري التحميل...</div>
      </div>
    );
  }

  const phoneError = phoneTouched && !/^01\d{9}$/.test(formData.phone)
    ? 'رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقماً'
    : '';
  const pwRules = validatePassword(formData.password);
  const pwValid = Object.values(pwRules).every(Boolean);
  const phoneValid = /^01\d{9}$/.test(formData.phone);

  const baseInputClass = "w-full h-14 rounded-2xl px-4 text-base font-bold outline-none transition-all";
  const phoneInputClass = !phoneTouched
    ? `${baseInputClass} bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100`
    : phoneValid
    ? `${baseInputClass} bg-gray-50 border border-green-500 ring-2 ring-green-100 focus:border-green-500 focus:ring-2 focus:ring-green-100`
    : `${baseInputClass} bg-red-50 border border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-2 focus:ring-red-100`;
  const passwordInputClass = !passwordTouched
    ? `${baseInputClass} bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100`
    : pwValid
    ? `${baseInputClass} bg-gray-50 border border-green-500 ring-2 ring-green-100 focus:border-green-500 focus:ring-2 focus:ring-green-100`
    : `${baseInputClass} bg-red-50 border border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-2 focus:ring-red-100`;
  const labelClass = "block text-xs font-bold text-gray-700 mb-1.5";
  const defaultInputClass = `${baseInputClass} bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100`;

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      {/* 5.1 — Green gradient header */}
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 text-white pt-14 pb-10 px-6 rounded-b-[40px] shadow-2xl text-center">
        <h1 className="text-3xl font-extrabold text-white mb-1">ربحانة</h1>
        <p className="text-green-100 text-sm">إنشاء حساب جديد</p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-10">
        {/* 5.2 — White rounded card */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">

          {/* 5.3 — All inputs restyled */}
          <div>
            <label className={labelClass}>الاسم</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={defaultInputClass}
              placeholder="الاسم التجاري"
              required
            />
          </div>
          <div>
            <label className={labelClass}>البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={defaultInputClass}
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className={labelClass}>رقم الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                if (!phoneTouched) setPhoneTouched(true);
                setFormData({ ...formData, phone: e.target.value });
              }}
              className={phoneInputClass}
              placeholder="01xxxxxxxxx"
              maxLength={11}
              inputMode="numeric"
              required
            />
            {phoneError && (
              <p className="text-xs text-red-600 font-bold mt-1">{phoneError}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>كلمة المرور</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                if (!passwordTouched) setPasswordTouched(true);
                setFormData({ ...formData, password: e.target.value });
              }}
              className={passwordInputClass}
              placeholder="••••••••"
              required
            />
            {passwordTouched && (
              <ul className="mt-2 space-y-1 text-xs font-bold">
                {[
                  { key: 'length',    label: '8 إلى 16 حرفاً' },
                  { key: 'uppercase', label: 'حرف كبير (A-Z)' },
                  { key: 'lowercase', label: 'حرف صغير (a-z)' },
                  { key: 'digit',     label: 'رقم (0-9)' },
                  { key: 'special',   label: 'رمز خاص (!@#$...)' },
                ].map(({ key, label }) => (
                  <li key={key} className={pwRules[key as keyof typeof pwRules] ? 'text-green-600' : 'text-gray-400'}>
                    {pwRules[key as keyof typeof pwRules] ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 5.4 — Select dropdowns restyled */}
          <div>
            <label className={labelClass}>المنطقة</label>
            <Select value={formData.region_id} onValueChange={(v) => setFormData({ ...formData, region_id: v })} required>
              <SelectTrigger className="h-14 rounded-2xl border-gray-200 bg-gray-50 font-bold text-base focus:border-green-500 focus:ring-2 focus:ring-green-100">
                <SelectValue placeholder="اختر المنطقة" />
              </SelectTrigger>
              <SelectContent>
                {regions.filter((r) => r.is_active).map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>{r.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelClass}>المهنة</label>
            <Select value={formData.job_id} onValueChange={(v) => setFormData({ ...formData, job_id: v })} required>
              <SelectTrigger className="h-14 rounded-2xl border-gray-200 bg-gray-50 font-bold text-base focus:border-green-500 focus:ring-2 focus:ring-green-100">
                <SelectValue placeholder="اختر المهنة" />
              </SelectTrigger>
              <SelectContent>
                {jobs.filter((j) => j.is_active).map((j) => (
                  <SelectItem key={j.id} value={j.id.toString()}>{j.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCarrierRole && (
            <div>
              <label className={labelClass}>المحافظات التي تشحن إليها *</label>
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {regions
                    .filter((r) => r.is_active)
                    .map((r) => {
                      const checked = carrierRegionIDs.includes(r.id);
                      return (
                        <label key={r.id} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setCarrierRegionIDs((prev) =>
                                checked ? prev.filter((id) => id !== r.id) : [...prev, r.id],
                              )
                            }
                            className="size-4 shrink-0 accent-green-600"
                          />
                          {r.name_ar}
                        </label>
                      );
                    })}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {carrierRegionIDs.length > 0
                  ? `اخترت ${carrierRegionIDs.length} محافظة — ستظهر لك الشحنات في هذه المحافظات فقط`
                  : 'اختر محافظة واحدة على الأقل — لن تظهر لك أي شحنات بدونها'}
              </p>
            </div>
          )}

          {isSupplySideRole && (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                checked={suppliesToRetail}
                onChange={(e) => setSuppliesToRetail(e.target.checked)}
                className="size-5 shrink-0 accent-green-600"
              />
              <span className="text-sm font-bold text-gray-700">أقوم بالتوريد للتجزئة</span>
            </label>
          )}

          <div>
            <label className={labelClass}>كيف عرفت عن ربحانة؟</label>
            <Select
              value={formData.signup_source}
              onValueChange={(v) => setFormData({ ...formData, signup_source: v })}
              required
            >
              <SelectTrigger className="h-14 rounded-2xl border-gray-200 bg-gray-50 font-bold text-base focus:border-green-500 focus:ring-2 focus:ring-green-100">
                <SelectValue placeholder="اختر المصدر" />
              </SelectTrigger>
              <SelectContent>
                {SIGNUP_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5.5 — Submit button */}
          <button
            type="submit"
            disabled={
              loading || !pwValid || !phoneValid || !formData.signup_source ||
              (isCarrierRole && carrierRegionIDs.length === 0)
            }
            className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
          </button>
        </form>

        {/* 5.6 — Login link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">لديك حساب بالفعل؟ </span>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-green-600 font-bold hover:underline"
          >
            سجل دخول
          </button>
        </div>
      </div>
    </div>
  );
}
