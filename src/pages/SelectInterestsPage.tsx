import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { API_CONFIG } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { useConfigStore } from '@/stores/config';

interface Interest {
  id: number;
  name_ar: string;
  is_active: boolean;
}

export function SelectInterestsPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const config = useConfigStore((s) => s.config);
  const min = config?.min_interests_at_registration ?? 1;

  useEffect(() => {
    fetch(`${API_CONFIG.FULL_URL}/interests`)
      .then((r) => r.json())
      .then((d) => setInterests(d.interests || []))
      .catch(() => handleError(new Error('فشل تحميل الاهتمامات')))
      .finally(() => setLoading(false));
  }, []);

  const activeInterests = interests.filter((i) => i.is_active);

  const toggleInterest = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= activeInterests.length) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.length < min) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_CONFIG.FULL_URL}/auth/interests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ interest_ids: selectedIds }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
      navigate('/set-location');
    } catch (err) { handleError(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* 15.1 — Green gradient header */}
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-6 pt-14 pb-10 text-center rounded-b-[40px] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white mb-1">اختر اهتماماتك</h1>
        <p className="text-green-100 text-sm">اختر {min === 1 ? 'اهتمامًا واحدًا على الأقل' : `${min} اهتمامات على الأقل`} للبدء</p>
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
            const isDisabled = !isSelected && selectedIds.length >= activeInterests.length;
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                disabled={isDisabled}
                className={`
                  relative p-4 rounded-2xl border-2 font-bold text-sm transition-all text-center
                  ${isSelected
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-md'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed'
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
          {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `متابعة (${selectedIds.length}/${activeInterests.length})`}
        </button>
      </div>
    </div>
  );
}
