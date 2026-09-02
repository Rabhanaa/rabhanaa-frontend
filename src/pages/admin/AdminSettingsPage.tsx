import { useEffect, useState } from 'react';
import { Loader2, Settings, Percent } from 'lucide-react';
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
const COMMISSION_RATE = 'commission_rate_percent';
const COMMISSION_CLOSE_DAY = 'commission_week_close_day';
const COMMISSION_GRACE_DAYS = 'commission_grace_days';
const COMMISSION_REMINDER_DAYS = 'commission_reminder_days';
const COMMISSION_START_DATE = 'commission_start_date';

const dayLabel: Record<string, string> = {
  saturday: 'السبت', sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة',
};

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

// Saved by an explicit button rather than on change: these are billing numbers,
// and a half-typed rate must never reach the server.
function NumericSetting({
  label, help, suffix, value, saving, onSave,
}: {
  label: string;
  help: string;
  suffix: string;
  value: string;
  saving: boolean;
  onSave: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      <p className="mb-2 text-xs text-muted-foreground">{help}</p>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          inputMode="decimal"
          className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm"
        />
        <span className="text-sm text-muted-foreground">{suffix}</span>
        <button
          onClick={() => onSave(draft.trim())}
          disabled={saving || draft.trim() === value}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
        </button>
      </div>
    </div>
  );
}

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

      {/* Platform commission (#13) */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">عمولة المنصة</h3>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          نسبة المنصة من كل صفقة مكتملة، وموعد إصدار الفواتير الأسبوعية.
        </p>

        <div className="space-y-6">
          <NumericSetting
            label="نسبة العمولة"
            help="تُحسب على قيمة الصفقة كاملة (سعر الوحدة × الكمية)."
            suffix="%"
            value={settings[COMMISSION_RATE] ?? ''}
            saving={saving === COMMISSION_RATE}
            onSave={(v) => update(COMMISSION_RATE, v)}
          />

          <div>
            <label className="mb-1 block text-sm font-semibold">يوم إصدار الفواتير</label>
            <p className="mb-2 text-xs text-muted-foreground">
              تصدر الفاتورة فجر هذا اليوم عن الأسبوع المنتهي قبله (بتوقيت القاهرة).
            </p>
            <select
              value={settings[COMMISSION_CLOSE_DAY] ?? ''}
              disabled={saving === COMMISSION_CLOSE_DAY}
              onChange={(e) => update(COMMISSION_CLOSE_DAY, e.target.value)}
              className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm"
            >
              {(options[COMMISSION_CLOSE_DAY] || []).map((d) => (
                <option key={d} value={d}>{dayLabel[d] || d}</option>
              ))}
            </select>
          </div>

          <NumericSetting
            label="مهلة السداد"
            help="عدد الأيام قبل اعتبار الفاتورة متأخرة وظهور البائع في قائمة المتأخرين."
            suffix="يوم"
            value={settings[COMMISSION_GRACE_DAYS] ?? ''}
            saving={saving === COMMISSION_GRACE_DAYS}
            onSave={(v) => update(COMMISSION_GRACE_DAYS, v)}
          />

          <NumericSetting
            label="بداية احتساب العمولة"
            help="أقدم صفقة تُحتسب عليها عمولة، بصيغة YYYY-MM-DD. الصفقات المكتملة قبل هذا التاريخ لا تُحاسب — اكتب all لاحتساب كل الصفقات السابقة."
            suffix=""
            value={settings[COMMISSION_START_DATE] ?? ''}
            saving={saving === COMMISSION_START_DATE}
            onSave={(v) => update(COMMISSION_START_DATE, v)}
          />

          <NumericSetting
            label="تكرار التذكير"
            help="يُرسل تذكير للبائع عند استحقاق الفاتورة، ثم يتكرر بهذه المدة حتى السداد."
            suffix="يوم"
            value={settings[COMMISSION_REMINDER_DAYS] ?? ''}
            saving={saving === COMMISSION_REMINDER_DAYS}
            onSave={(v) => update(COMMISSION_REMINDER_DAYS, v)}
          />
        </div>

        {/* The single most surprising behaviour here, stated where it is set. */}
        <p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          تغيير النسبة يسري على المبيعات الجديدة فقط. العمولات المحتسبة بالفعل تحتفظ بالنسبة
          التي حُسبت بها، والفواتير الصادرة لا تتغير.
        </p>
      </div>
    </div>
  );
}
