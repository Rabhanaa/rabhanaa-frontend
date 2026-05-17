import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Loader2, Upload, X, CheckCircle, Camera } from 'lucide-react';
import { API_CONFIG } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

interface DocumentSlot {
  type: string; label: string; file: File | null;
  preview: string | null; uploading: boolean; uploaded: boolean;
}

export function UploadDocumentsPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { handleError } = useApiError();

  const [documents, setDocuments] = useState<DocumentSlot[]>([
    { type: 'business_license', label: 'السجل التجاري', file: null, preview: null, uploading: false, uploaded: false },
    { type: 'national_id', label: 'البطاقة الشخصية', file: null, preview: null, uploading: false, uploaded: false },
    { type: 'tax_card', label: 'البطاقة الضريبية', file: null, preview: null, uploading: false, uploaded: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) { handleError(new Error('يرجى اختيار ملف صورة')); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], file, preview: reader.result as string };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (index: number) => {
    setDocuments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], file: null, preview: null, uploading: false, uploaded: false };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!documents.every((d) => d.file)) return;
    setSubmitting(true);
    try {
      setDocuments((prev) => prev.map((d) => ({ ...d, uploading: true })));

      const formData = new FormData();
      for (const doc of documents) {
        formData.append(doc.type, doc.file!);
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_CONFIG.FULL_URL}/auth/documents`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || d.message || 'Failed to submit documents'); }

      setDocuments((prev) => prev.map((d) => ({ ...d, uploading: false, uploaded: true })));

      const meRes = await fetch(`${API_CONFIG.FULL_URL}/auth/me`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (meRes.ok) { const userData = await meRes.json(); setUser(userData.user); }
      navigate('/auctions?welcome=true');
    } catch (err) {
      handleError(err);
      setDocuments((prev) => prev.map((d) => ({ ...d, uploading: false, uploaded: false })));
    } finally { setSubmitting(false); }
  };

  const allFilled = documents.every((d) => d.file !== null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* 17.1 — Green gradient header */}
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-6 pt-14 pb-10 text-center rounded-b-[40px] shadow-xl">
        <h1 className="text-2xl font-extrabold text-white mb-1">رفع المستندات</h1>
        <p className="text-green-100 text-sm">يرجى رفع المستندات المطلوبة لإكمال التسجيل</p>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {documents.map((doc) => (
            <div key={doc.type} className={`w-3 h-3 rounded-full transition-all ${doc.file ? 'bg-white scale-110' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-32 space-y-4">
        {/* 17.2 — Document upload slots */}
        {documents.map((doc, index) => (
          <div key={doc.type} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{doc.label}</span>
              {doc.uploaded && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle size={10} />تم الرفع
                </span>
              )}
            </div>

            {doc.preview ? (
              <div className="relative">
                <img src={doc.preview} alt={doc.label} className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={submitting}
                  className="absolute top-2 end-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
                {doc.uploaded && (
                  <div className="absolute bottom-2 end-2 p-2 bg-green-500 rounded-full text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor={`doc-${doc.type}`}
                className={`flex flex-col items-center justify-center h-36 cursor-pointer transition-colors ${doc.uploading ? 'bg-green-50' : 'bg-gray-50 hover:bg-green-50'}`}
              >
                {doc.uploading
                  ? <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  : <>
                      <Camera className="h-8 w-8 text-green-600 mb-2" />
                      <span className="text-sm font-bold text-gray-500">اضغط لاختيار صورة</span>
                    </>
                }
                <input
                  id={`doc-${doc.type}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(index, f); }}
                  disabled={submitting || doc.uploading}
                />
              </label>
            )}
          </div>
        ))}

      </div>

      {/* 17.3 — Fixed bottom submit */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gray-50/90 backdrop-blur-sm">
        <button
          onClick={handleSubmit}
          disabled={!allFilled || submitting}
          className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 className="h-5 w-5 animate-spin" />جاري الرفع...</>
            : <><Upload size={18} />تم</>
          }
        </button>
      </div>
    </div>
  );
}
