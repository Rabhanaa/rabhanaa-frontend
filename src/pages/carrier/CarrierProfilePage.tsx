import { useEffect, useState } from 'react';
import { Loader2, Truck, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api, API_CONFIG } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { useAuthStore } from '@/stores/auth';

interface Region {
  id: number;
  name_ar: string;
  is_active: boolean;
}

interface CarrierProfile {
  name: string;
  phone: string;
  logo_url?: string;
  notes?: string;
  region_ids: number[];
  regions: string[];
}

export function CarrierProfilePage() {
  const { handleError } = useApiError();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<CarrierProfile>('/carrier/profile'),
      fetch(`${API_CONFIG.FULL_URL}/regions`).then((r) => r.json()),
    ])
      .then(([profile, regionsData]) => {
        setSelected(profile.region_ids || []);
        setNotes(profile.notes || '');
        setRegions(regionsData.regions || []);
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await api.patch('/carrier/profile', {
        region_ids: selected,
        notes: notes.trim() || undefined,
      });
      toast.success('تم تحديث بيانات الشحن');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-5 pb-10 pt-12 text-center rounded-b-[32px] shadow-xl">
        <div className="mx-auto mb-3 grid size-20 place-items-center rounded-full border-4 border-white/30 bg-white/20">
          <Truck size={36} className="text-white" />
        </div>
        <h1 className="text-xl font-extrabold text-white">{user?.name}</h1>
        <span className="mt-2 inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-green-700">
          {user?.status === 'pending_review' ? 'قيد المراجعة' : 'شركة شحن'}
        </span>
      </div>

      <div className="space-y-4 px-4 pt-5">
        <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3 p-4">
            <Mail size={16} className="text-green-600" />
            <span className="text-sm font-bold text-gray-900" dir="ltr">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone size={16} className="text-green-600" />
            <span className="text-sm font-bold text-gray-900" dir="ltr">{user?.phone}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-bold text-gray-900">
            المحافظات التي تشحن إليها
          </label>
          {/* Coverage is the whole filter: clear it and the job list empties, so
              the API requires at least one and so does this form. */}
          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-2">
              {regions
                .filter((r) => r.is_active)
                .map((r) => {
                  const checked = selected.includes(r.id);
                  return (
                    <label key={r.id} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelected((prev) =>
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

          <label className="mb-1.5 mt-4 block text-sm font-bold text-gray-900">
            ملاحظات تظهر للتجار
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            placeholder="مبردات، نقل مجمدات، تغطية 24 ساعة..."
          />

          <button
            onClick={save}
            disabled={saving || selected.length === 0}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-green-600 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ'}
          </button>
          {selected.length === 0 && (
            <p className="mt-2 text-xs font-bold text-red-600">
              اختر محافظة واحدة على الأقل
            </p>
          )}
        </div>

        <button
          onClick={() => logout()}
          className="w-full rounded-2xl border border-red-100 bg-red-50 py-4 text-sm font-bold text-red-600"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
