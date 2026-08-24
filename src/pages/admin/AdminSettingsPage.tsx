import { useEffect, useState } from 'react';
import { Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface SettingsResponse {
  settings: Record<string, string>;
  // The server sends the permitted values rather than the UI hardcoding them,
  // so the two cannot drift apart.
  options: Record<string, string[]>;
}

const CARRIER_QUOTE_STAGE = 'carrier_quote_stage';

const stageLabel: Record<string, string> = {
  order: 'بعد إتمام الصفقة فقط',
  post: 'على المنشورات المعروضة',
  both: 'على الاثنين',
};

const stageHelp: Record<string, string> = {
  order:
    'شركات الشحن ترى الصفقات المكتملة فقط — البائع والمشتري معروفان، فالسعر نهائي. هذا هو الوضع الافتراضي.',
  post:
    'شركات الشحن ترى المنشورات المعروضة. المشتري لم يُحدد بعد، فجهة الوصول غير معروفة والسعر تقديري.',
  both:
    'شركات الشحن ترى المنشورات والصفقات المكتملة معاً.',
};

export function AdminSettingsPage() {
  const { handleError } = useApiError();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SettingsResponse>('/admin/settings')
      .then((d) => {
        setSettings(d.settings || {});
        setOptions(d.options || {});
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const update = async (key: string, value: string) => {
    setSaving(key);
    try {
      const d = await api.patch<{ settings: Record<string, string> }>('/admin/settings', { key, value });
      setSettings(d.settings);
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stage = settings[CARRIER_QUOTE_STAGE];
  const stageOptions = options[CARRIER_QUOTE_STAGE] || [];

  return (
    <div className="space-y-6" dir="rtl">
      <AdminPageHeader title="الإعدادات" />

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">مرحلة عروض الشحن</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          في أي مرحلة تستطيع شركات الشحن تقديم سعر النقل.
        </p>

        <div className="space-y-2">
          {stageOptions.map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                stage === value ? 'border-primary bg-primary/5' : 'hover:bg-accent'
              }`}
            >
              <input
                type="radio"
                name={CARRIER_QUOTE_STAGE}
                checked={stage === value}
                disabled={saving === CARRIER_QUOTE_STAGE}
                onChange={() => update(CARRIER_QUOTE_STAGE, value)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{stageLabel[value] || value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stageHelp[value]}</p>
              </div>
            </label>
          ))}
        </div>

        {saving === CARRIER_QUOTE_STAGE && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> جاري الحفظ...
          </div>
        )}

        <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          التغيير يسري على الفور. العروض المقدمة بالفعل تبقى كما هي — يمكن للتجار الرد عليها
          في كل الأحوال.
        </p>
      </div>
    </div>
  );
}
