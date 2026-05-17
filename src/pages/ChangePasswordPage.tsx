import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
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

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pwRules = validatePassword(newPassword);
  const pwValid = Object.values(pwRules).every(Boolean);
  const confirmError = confirmPassword.length > 0 && confirmPassword !== newPassword
    ? 'كلمة المرور غير متطابقة' : '';
  const canSubmit = pwValid && !confirmError && currentPassword.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-base font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all";
  const labelClass = "block text-xs font-bold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 text-white pt-14 pb-10 px-6 rounded-b-[40px] shadow-2xl text-center">
        <h1 className="text-3xl font-extrabold text-white mb-1">تغيير كلمة المرور</h1>
        <p className="text-green-100 text-sm">أدخل كلمة المرور الحالية والجديدة</p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-10">
        {success ? (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="font-bold text-green-700 text-lg">تم تغيير كلمة المرور بنجاح</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 w-full h-14 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg"
            >
              رجوع
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className={labelClass}>كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className={labelClass}>كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
              />
              {newPassword.length > 0 && (
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

            <div>
              <label className={labelClass}>تأكيد كلمة المرور الجديدة</label>
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
              disabled={loading || !canSubmit}
              className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full h-12 border-2 border-gray-200 rounded-2xl font-bold text-gray-500 text-sm"
            >
              إلغاء
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
