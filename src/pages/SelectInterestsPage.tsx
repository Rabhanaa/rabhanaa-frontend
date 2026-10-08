import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { useConfigStore } from '@/stores/config';

interface Interest {
  id: number;
  name_ar: string;
  is_active: boolean;
}

interface SelectInterestsPageProps {
  // 'onboarding' is the registration step and carries on to the location step.
  // 'edit' is reached from the profile: it starts from the member's current
  // interests and goes back when saved.
  mode?: 'onboarding' | 'edit';
}

export function SelectInterestsPage({ mode = 'onboarding' }: SelectInterestsPageProps) {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const config = useConfigStore((s) => s.config);
  const min = config?.min_interests_at_registration ?? 1;
  const isEdit = mode === 'edit';

  useEffect(() => {
    const load = async () => {
      try {
        const [list, me] = await Promise.all([
          api.get<{ interests: Interest[] }>('/interests'),
          isEdit ? api.get<{ interests?: number[] }>('/auth/me') : Promise.resolve(null),
        ]);
        const all = list.interests || [];
        setInterests(all);
        if (me) {
          // Only what the picker can show: an interest deactivated since the
          // member chose it has no tile, and would otherwise inflate the
          // counter with something they cannot untick.
          const activeIds = new Set(all.filter((i) => i.is_active).map((i) => i.id));
          setSelectedIds((me.interests || []).filter((id) => activeIds.has(id)));
        }
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit]);

  const activeInterests = interests.filter((i) => i.is_active);

  const toggleInterest = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (selectedIds.length < min) return;
    setSubmitting(true);
    try {
      await api.post('/auth/interests', { interest_ids: selectedIds });
      if (isEdit) {
        toast.success('تم حفظ اهتماماتك');
        navigate(-1);
      } else {
        navigate('/set-location');
      }
    } catch (err) { handleError(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  const minHint = min === 1 ? 'اهتمامًا واحدًا على الأقل' : `${min} اهتمامات على الأقل`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* 15.1 — Green gradient header */}
      <div className="relative bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-6 pt-14 pb-10 text-center rounded-b-[40px] shadow-xl">
        {isEdit && (
          <button
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="absolute top-12 start-4 rounded-full bg-white/20 p-1.5 text-white"
          >
            <ChevronRight size={20} />
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-white mb-1">{isEdit ? 'تعديل اهتماماتك' : 'اختر اهتماماتك'}</h1>
        <p className="text-green-100 text-sm">
          {isEdit
            ? `ستصلك إشعارات الصفقات الجديدة في الاهتمامات التي تختارها — اختر ${minHint}`
            : `اختر ${minHint} للبدء`}
        </p>
        {/* 15.2 — Counter bubble */}
        <div className="mt-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-green-700 font-extrabold text-xl shadow-lg border-4 border-green-400">
          {selectedIds.length}/{activeInterests.length}
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-32">
        {/* 15.3 — Interest grid */}
        <div className="grid grid-cols-2 gap-3">
          {activeInterests.map((interest) => {
            const isSelected = selectedIds.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                className={`
                  relative p-4 rounded-2xl border-2 font-bold text-sm transition-all text-center
                  ${isSelected
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50'
                  }
                `}
              >
                {isSelected && (
                  <CheckCircle2 size={14} className="absolute top-2 end-2 text-green-600" />
                )}
                {interest.name_ar}
              </button>
            );
          })}
        </div>

      </div>

      {/* 15.4 — Fixed bottom submit */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gray-50/90 backdrop-blur-sm">
        <button
          onClick={handleSubmit}
          disabled={selectedIds.length < min || submitting}
          className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg transition-all disabled:opacity-50"
        >
          {submitting
            ? <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            : `${isEdit ? 'حفظ' : 'متابعة'} (${selectedIds.length}/${activeInterests.length})`}
        </button>
      </div>
    </div>
  );
}
