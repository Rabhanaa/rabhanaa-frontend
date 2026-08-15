import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, isRetailer } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, X, Camera } from 'lucide-react';
import { API_CONFIG, api } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApiError } from '@/hooks/useApiError';
import { SubscriptionContactDialog } from '@/components/SubscriptionContactDialog';
import { PendingReviewDialog } from '@/components/PendingReviewDialog';
import { isSubscriptionError, isPendingReviewError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Region {
  id: number;
  name_ar: string;
  is_active: boolean;
}

interface Interest {
  id: number;
  name_ar: string;
  is_active: boolean;
}

interface Config {
  units: string[];
}

export function CreateAuctionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const config = useConfigStore((state) => state.config);
  const { handleError } = useApiError();

  // The API rejects a sell post from a retailer, so don't offer the choice —
  // a form that can submit something guaranteed to fail is just a trap.
  const retailer = isRetailer(user);
  const [type, setType] = useState<'sell' | 'buy'>(retailer ? 'buy' : 'sell');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interest_id: '',
    region_id: '',
    quantity: '',
    unit: 'kg',
    unit_price: '',
    buy_all_from_one: false,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [pendingReviewDialogOpen, setPendingReviewDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsRes, interestsRes, configRes] = await Promise.all([
          fetch(`${API_CONFIG.FULL_URL}/regions`),
          fetch(`${API_CONFIG.FULL_URL}/interests`),
          fetch(`${API_CONFIG.FULL_URL}/config`),
        ]);
        if (regionsRes.ok) {
          const d = await regionsRes.json();
          setRegions(d.regions || []);
        }
        if (interestsRes.ok) {
          const d = await interestsRes.json();
          setInterests(d.interests || []);
        }
        if (configRes.ok) {
          const d = await configRes.json();
          setConfigStore(d);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        handleError(new Error('فشل تحميل البيانات'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      handleError(new Error('يرجى اختيار ملف صورة'));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (user?.status === 'pending_review' || user?.status === 'inactive') {
      setPendingReviewDialogOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const uploadRes = await fetch(`${API_CONFIG.FULL_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: uploadFormData,
        });
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          throw new Error(d.error || d.message || 'Upload failed');
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }
      const payload: Record<string, unknown> = {
        interest_id: parseInt(formData.interest_id),
        region_id: parseInt(formData.region_id),
        title: formData.title,
        description: formData.description || undefined,
        unit: formData.unit,
        quantity: parseFloat(formData.quantity),
        image_url: imageUrl || undefined,
      };
      if (type === 'sell') payload.unit_price = parseFloat(formData.unit_price);
      else payload.buy_all_from_one = formData.buy_all_from_one;

      const path = type === 'sell' ? '/sell-auctions' : '/buy-requests';
      await api.post(path, payload);
      // With moderation on the post is not live yet — say so, or the merchant
      // goes looking for it in the feed and thinks publishing failed.
      if (config?.post_approval_enabled) {
        toast.info('تم إرسال منشورك للمراجعة', {
          description: 'سيظهر للجميع بعد موافقة الإدارة.',
        });
      }
      navigate('/my-auctions');
    } catch (err) {
      if (isSubscriptionError(err)) {
        setSubscriptionDialogOpen(true);
      } else if (isPendingReviewError(err)) {
        setPendingReviewDialogOpen(true);
      } else {
        handleError(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    const base = formData.title.trim().length >= 5 && formData.interest_id && formData.region_id && formData.quantity;
    return type === 'sell' ? base && !!formData.unit_price : !!base;
  };

  const setConfigStore = (newConfig: Config) => {
    useConfigStore.setState({ config: newConfig as import('@/stores/config').AppConfig });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );

  const units = config?.units || ['kg'];
  const labelClass = 'text-xs font-bold text-gray-700 mb-1.5 block';
  const inputClass =
    'w-full h-14 border border-gray-200 rounded-xl px-4 font-bold text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white transition-all';

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 pb-32" dir="rtl">
      {/* 7.1 — ScreenHeader */}
      <ScreenHeader title="إضافة جديد" onBack={() => navigate(-1)} />

      {/* 7.2 — Mode toggle */}
      {!retailer && (
      <div className="flex p-1 bg-white rounded-2xl border border-gray-200 mb-6">
        <button
          onClick={() => setType('buy')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            type === 'buy' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500'
          }`}
        >
          طلب شراء
        </button>
        <button
          onClick={() => setType('sell')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            type === 'sell' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'
          }`}
        >
          عرض بيع
        </button>
      </div>
      )}

      {/* 7.3 — White card form */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
        {/* 7.5 — Image upload */}
        <div>
          <label className={labelClass}>صورة المنتج</label>
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Product" className="w-full aspect-video object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 end-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors bg-white"
            >
              <Camera className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-bold text-gray-500">اضغط لاختيار صورة</span>
              <input
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={submitting}
              />
            </label>
          )}
        </div>

        {/* 7.4 — All inputs */}
        <div>
          <label className={labelClass}>العنوان *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={cn(
              inputClass,
              formData.title.length > 0 && formData.title.trim().length <= 3 &&
                'border-red-400 focus:border-red-500 focus:ring-red-100',
            )}
            placeholder="مثال: طماطم بلدي درجة أولى"
            minLength={4}
            required
            disabled={submitting}
          />
          {formData.title.length > 0 && formData.title.trim().length < 5 ? (
            <p className="mt-1.5 text-xs font-bold text-red-500">
              العنوان يجب أن يكون 5 أحرف على الأقل
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">
              اكتب عنواناً واضحاً يصف المنتج (النوع، الصنف، الجودة) ليصل لأكبر عدد من المهتمين
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>الوصف (اختياري)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full h-24 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white resize-none transition-all"
            placeholder="أدخل وصف المنتج"
            disabled={submitting}
          />
        </div>

        <div>
          <label className={labelClass}>الفئة *</label>
          <Select
            value={formData.interest_id}
            onValueChange={(v) => setFormData({ ...formData, interest_id: v })}
            required
          >
            <SelectTrigger className="h-14 rounded-xl border-gray-200 font-bold text-base focus:border-green-500">
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              {interests
                .filter((i) => i.is_active)
                .map((i) => (
                  <SelectItem key={i.id} value={i.id.toString()}>
                    {i.name_ar}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelClass}>المنطقة *</label>
          <Select
            value={formData.region_id}
            onValueChange={(v) => setFormData({ ...formData, region_id: v })}
            required
          >
            <SelectTrigger className="h-14 rounded-xl border-gray-200 font-bold text-base focus:border-green-500">
              <SelectValue placeholder="اختر المنطقة" />
            </SelectTrigger>
            <SelectContent>
              {regions
                .filter((r) => r.is_active)
                .map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name_ar}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>الكمية *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={inputClass}
              placeholder="0"
              step="0.01"
              min="0"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label className={labelClass}>الوحدة *</label>
            <Select
              value={formData.unit}
              onValueChange={(v) => setFormData({ ...formData, unit: v })}
              required
            >
              <SelectTrigger className="h-14 rounded-xl border-gray-200 font-bold text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {type === 'sell' && (
          <div>
            <label className={labelClass}>السعر للوحدة *</label>
            <input
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              className={inputClass}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              disabled={submitting}
            />
          </div>
        )}

        {type === 'buy' && (
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
            <label
              htmlFor="buy_all_from_one"
              className="text-sm font-bold text-gray-700 cursor-pointer"
            >
              الشراء من مورد واحد
            </label>
            <button
              type="button"
              id="buy_all_from_one"
              onClick={() =>
                setFormData({ ...formData, buy_all_from_one: !formData.buy_all_from_one })
              }
              className={`w-12 h-7 rounded-full p-1 transition-colors relative ${
                formData.buy_all_from_one ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 absolute top-1 ${
                  formData.buy_all_from_one ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* 7.6 — Submit button */}
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!isFormValid() || submitting}
          className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'إنشاء'}
        </button>
      </div>

      {/* 7.7 — Confirm dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">تأكيد الإنشاء</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              ننصحك بتقديم أسعار تنافسية لجذب المزيد من العروض
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-green-600 hover:bg-green-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SubscriptionContactDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} />
      <PendingReviewDialog open={pendingReviewDialogOpen} onOpenChange={setPendingReviewDialogOpen} />
    </div>
  );
}
