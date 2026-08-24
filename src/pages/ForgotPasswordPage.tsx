import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError, getArabicMessage } from '@/lib/errors';
import { useApiError } from '@/hooks/useApiError';

// Mirrors ValidatePassword in the Go service — 8-16 chars with an upper, a
// lower, a digit and a symbol. Kept in sync deliberately; the server rejects
// anything that slips through.
function validatePassword(p: string) {
  return {
    length: p.length >= 8 && p.length <= 16,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    digit: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

const RESEND_COOLDOWN = 60; // matches the server's 60-second throttle

type Step = 'email' | 'code' | 'password';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // A toast fades after a few seconds; a wrong code needs an answer that stays
  // on screen next to the field being corrected.
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const pwRules = validatePassword(password);
  const pwValid = Object.values(pwRules).every(Boolean);
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password ? 'كلمة المرور غير متطابقة' : '';

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      // The server answers identically whether or not the address exists, so
      // there is nothing to branch on here.
      toast.success('إذا كان هذا البريد مسجلاً لدينا فسيصلك رمز');
      setStep('code');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCodeError('');
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      setStep('password');
    } catch (err) {
      setCodeError(
        err instanceof ApiError && err.code === 'INVALID_RESET_CODE'
          ? 'الرمز غير صحيح أو منتهي الصلاحية'
          : getArabicMessage(err instanceof ApiError ? err.code : '', err instanceof Error ? err.message : '')
      );
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, new_password: password });
      // Deliberately not auto-logged-in: the reset just signed this account out
      // everywhere, and typing the new password once confirms it took.
      toast.success('تم تغيير كلمة المرور — سجّل الدخول بكلمة المرور الجديدة');
      navigate('/login');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-base font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all';
  const labelClass = 'block text-xs font-bold text-gray-700 mb-1.5';
  const buttonClass =
    'w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2';

  const subtitle =
    step === 'email'
      ? 'أدخل بريدك الإلكتروني وسنرسل لك رمزاً'
      : step === 'code'
        ? `أدخل الرمز المرسل إلى ${email}`
        : 'اختر كلمة مرور جديدة';

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 text-white pt-14 pb-10 px-6 rounded-b-[40px] shadow-2xl text-center">
        <h1 className="text-3xl font-extrabold text-white mb-1">نسيت كلمة المرور</h1>
        <p className="text-green-100 text-sm">{subtitle}</p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-10">
        {step === 'email' && (
          <form
            onSubmit={requestCode}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
          >
            <div>
              <label className={labelClass}>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                dir="ltr"
                required
              />
            </div>
            <button type="submit" disabled={loading || !email} className={buttonClass}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إرسال الرمز'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form
            onSubmit={verifyCode}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
          >
            <div>
              <label className={labelClass}>رمز التحقق</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
                className={`${inputClass} text-center tracking-[0.5em] text-2xl ${
                  codeError ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
                }`}
                placeholder="000000"
                dir="ltr"
                required
              />
              {codeError && (
                <p className="mt-2 text-xs font-bold text-red-600">{codeError}</p>
              )}
            </div>
            <button type="submit" disabled={loading || code.length !== 6} className={buttonClass}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تأكيد الرمز'}
            </button>
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={cooldown > 0 || loading}
              className="w-full h-12 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60"
            >
              {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'إعادة إرسال الرمز'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form
            onSubmit={submitPassword}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
          >
            <div>
              <label className={labelClass}>كلمة المرور الجديدة</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
              {password.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs font-bold">
                  {[
                    { key: 'length', label: '8 إلى 16 حرفاً' },
                    { key: 'uppercase', label: 'حرف كبير (A-Z)' },
                    { key: 'lowercase', label: 'حرف صغير (a-z)' },
                    { key: 'digit', label: 'رقم (0-9)' },
                    { key: 'special', label: 'رمز خاص (!@#$...)' },
                  ].map(({ key, label }) => (
                    <li
                      key={key}
                      className={
                        pwRules[key as keyof typeof pwRules] ? 'text-green-600' : 'text-gray-400'
                      }
                    >
                      {pwRules[key as keyof typeof pwRules] ? '✓' : '○'} {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className={labelClass}>تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
              {confirmError && (
                <p className="text-xs text-red-600 font-bold mt-1">{confirmError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !pwValid || !!confirmError}
              className={buttonClass}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تغيير كلمة المرور'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full h-12 mt-3 rounded-2xl font-bold text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}
