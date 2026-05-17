import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { API_CONFIG } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

export function SetLocationPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detected, setDetected] = useState(false);

  const handleDetectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      handleError(new Error('المتصفح لا يدعم تحديد الموقع'));
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setDetecting(false);
        setDetected(true);
        setTimeout(() => submitLocation(position.coords.latitude, position.coords.longitude), 1500);
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) handleError(new Error('تم رفض إذن الموقع'));
        else if (err.code === err.POSITION_UNAVAILABLE) handleError(new Error('معلومات الموقع غير متاحة'));
        else if (err.code === err.TIMEOUT) handleError(new Error('انتهت مهلة طلب الموقع'));
        else handleError(new Error('لم نتمكن من تحديد موقعك — حاول مرة أخرى'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const submitLocation = async (latitude: number, longitude: number) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_CONFIG.FULL_URL}/auth/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
      navigate('/documents');
    } catch (err) {
      handleError(err);
      setDetected(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Green gradient header */}
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-6 pt-14 pb-12 text-center rounded-b-[40px] shadow-xl">
        <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 shadow-lg">
          {detected
            ? <CheckCircle2 size={40} className="text-white" />
            : <MapPin size={40} className="text-white" />
          }
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">تحديد موقعك</h1>
        <p className="text-green-100 text-sm">نحتاج إلى موقعك لإظهار المزادات القريبة منك</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 pt-8 gap-4">
        {!detected && !submitting && (
          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full max-w-sm h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {detecting
              ? <><Loader2 className="h-5 w-5 animate-spin" />جاري تحديد الموقع...</>
              : <><MapPin size={18} />تحديد موقعي</>
            }
          </button>
        )}

        {submitting && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-sm font-bold text-gray-600">جاري حفظ موقعك...</p>
          </div>
        )}

        {detected && !submitting && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-green-600" />
            <p className="font-bold text-green-700">تم تحديد موقعك!</p>
          </div>
        )}
      </div>
    </div>
  );
}
