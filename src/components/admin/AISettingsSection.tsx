import { useEffect, useId, useState } from 'react';
import { Bot, KeyRound, Loader2, CheckCircle2, AlertTriangle, Trash2, RefreshCw, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { Button } from '@/components/ui/button';
import { AI_PROVIDER_LABEL, NOTIFY_MODE_LABEL } from '@/lib/news';
import { cn } from '@/lib/utils';

interface Props {
  settings: Record<string, string>;
  options: Record<string, string[]>;
  secrets: Record<string, string>;
  secretsAvailable: boolean;
  saving: string | null;
  onUpdate: (key: string, value: string) => Promise<void>;
  onSecretsChange: (secrets: Record<string, string>) => void;
}

const PROVIDER_HELP: Record<string, string> = {
  openai: 'المفتاح من platform.openai.com ← API keys',
  gemini: 'المفتاح من aistudio.google.com ← Get API key',
  openrouter: 'المفتاح من openrouter.ai ← Keys. يتيح موديلات من شركات كثيرة بمفتاح واحد.',
};

const NOTIFY_HELP: Record<string, string> = {
  off: 'تُنشر الأخبار دون إرسال أي إشعار.',
  all: 'كل خبر يُنشر يصل إشعاره لكل العملاء. مشتركو برو يقرأونه كاملًا، وغيرهم يرون ملخصه ودعوة للاشتراك.',
  by_interest: 'يصل الإشعار فقط للعملاء الذين تتطابق اهتماماتهم مع اهتمامات الخبر، مشتركين أو لا.',
};

export function AISettingsSection({ settings, options, secrets, secretsAvailable, saving, onUpdate, onSecretsChange }: Props) {
  const providers = options.ai_provider || ['openai', 'gemini', 'openrouter'];
  const active = settings.ai_provider;
  const modes = options.news_notify_mode || ['off', 'all', 'by_interest'];

  return (
    <>
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">الذكاء الاصطناعي لكتابة الأخبار</h3>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          أضف مفتاح API لمزود واحد أو أكثر واختر الموديل، ثم حدد المزود الافتراضي. يمكن تغيير المزود لكل خبر من صفحة التحرير.
        </p>

        {!secretsAvailable && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              حفظ المفاتيح غير مفعّل على الخادم. أضف متغير البيئة <code dir="ltr" className="font-mono">SETTINGS_ENCRYPTION_KEY</code> ثم أعد تشغيل الخادم.
            </span>
          </div>
        )}

        <div className="space-y-4">
          {providers.map((p) => (
            <ProviderCard
              key={p}
              provider={p}
              isDefault={active === p}
              hint={secrets[`${p}_api_key`] || ''}
              model={settings[`${p}_model`] || ''}
              secretsAvailable={secretsAvailable}
              savingDefault={saving === 'ai_provider'}
              savingModel={saving === `${p}_model`}
              onMakeDefault={() => onUpdate('ai_provider', p)}
              onSaveModel={(m) => onUpdate(`${p}_model`, m)}
              onSecretsChange={onSecretsChange}
            />
          ))}
        </div>

        <p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          المفاتيح تُحفظ مشفرة ولا تُعرض مرة أخرى بعد الحفظ — تظهر آخر 4 أحرف فقط للتمييز.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">إشعارات الأخبار</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          من يصله إشعار عند نشر خبر. الإشعار يصل كتنبيه على الجهاز فقط ولا يُضاف لقائمة الإشعارات داخل التطبيق.
        </p>
        <div className="space-y-2">
          {modes.map((m) => (
            <label
              key={m}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                settings.news_notify_mode === m ? 'border-primary bg-primary/5' : 'hover:bg-accent',
              )}
            >
              <input
                type="radio"
                name="news_notify_mode"
                checked={settings.news_notify_mode === m}
                disabled={saving === 'news_notify_mode'}
                onChange={() => onUpdate('news_notify_mode', m)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{NOTIFY_MODE_LABEL[m] || m}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{NOTIFY_HELP[m]}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function ProviderCard({
  provider, isDefault, hint, model, secretsAvailable, savingDefault, savingModel, onMakeDefault, onSaveModel, onSecretsChange,
}: {
  provider: string;
  isDefault: boolean;
  hint: string;
  model: string;
  secretsAvailable: boolean;
  savingDefault: boolean;
  savingModel: boolean;
  onMakeDefault: () => void;
  onSaveModel: (model: string) => Promise<void>;
  onSecretsChange: (secrets: Record<string, string>) => void;
}) {
  const { handleError } = useApiError();
  const listId = useId();
  const [keyDraft, setKeyDraft] = useState('');
  const [modelDraft, setModelDraft] = useState(model);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState<'key' | 'clear' | 'models' | 'test' | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  useEffect(() => setModelDraft(model), [model]);

  const hasKey = !!hint;
  // OpenRouter publishes its model list; the others need the key.
  const canListModels = provider === 'openrouter' || hasKey;
  const ready = hasKey && !!model;
  const label = AI_PROVIDER_LABEL[provider] || provider;

  const saveKey = async () => {
    setBusy('key');
    try {
      const d = await api.post<{ secrets: Record<string, string> }>('/admin/settings/secrets', {
        key: `${provider}_api_key`,
        value: keyDraft.trim(),
      });
      onSecretsChange(d.secrets);
      setKeyDraft('');
      setTestResult(null);
      toast.success(`تم حفظ مفتاح ${label}`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  const clearKey = async () => {
    setBusy('clear');
    try {
      const d = await api.delete<{ secrets: Record<string, string> }>(`/admin/settings/secrets/${provider}_api_key`);
      onSecretsChange(d.secrets);
      setTestResult(null);
      toast.success(`تم حذف مفتاح ${label}`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  const loadModels = async () => {
    setBusy('models');
    try {
      const d = await api.get<{ models: string[] }>(`/admin/ai/models?provider=${provider}`);
      setModels(d.models || []);
      toast.success(`تم تحميل ${d.models?.length ?? 0} موديل — اكتب للبحث في القائمة`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setTestResult(null);
    try {
      const d = await api.post<{ latency_ms: number }>('/admin/ai/test', { provider });
      setTestResult(`يعمل بنجاح (${(d.latency_ms / 1000).toFixed(1)} ث)`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn('rounded-lg border p-4', isDefault && 'border-primary bg-primary/5')}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-bold">{label}</h4>
        {ready ? (
          <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> جاهز</span>
        ) : (
          <span className="text-xs text-muted-foreground">غير مُعد</span>
        )}
        <div className="ms-auto">
          {isDefault ? (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">المزود الافتراضي</span>
          ) : (
            <Button size="sm" variant="outline" onClick={onMakeDefault} disabled={savingDefault}>اجعله الافتراضي</Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{PROVIDER_HELP[provider]}</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
            <KeyRound className="h-3.5 w-3.5" /> مفتاح API
            {hasKey && <span dir="ltr" className="font-mono text-xs font-normal text-muted-foreground">{hint}</span>}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={hasKey ? 'أدخل مفتاحًا جديدًا للاستبدال' : 'الصق المفتاح هنا'}
              autoComplete="off"
              dir={keyDraft ? 'ltr' : 'rtl'}
              disabled={!secretsAvailable}
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm placeholder:font-sans"
            />
            <Button onClick={saveKey} disabled={!secretsAvailable || !keyDraft.trim() || busy !== null}>
              {busy === 'key' ? <Loader2 className="animate-spin" /> : 'حفظ'}
            </Button>
            {hasKey && (
              <Button variant="ghost" size="icon" onClick={clearKey} disabled={busy !== null} title="حذف المفتاح" className="text-destructive hover:text-destructive">
                {busy === 'clear' ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">الموديل</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={modelDraft}
              onChange={(e) => setModelDraft(e.target.value)}
              list={listId}
              placeholder={canListModels ? 'اختر من القائمة أو اكتب اسم الموديل' : 'أضف المفتاح أولًا لتحميل الموديلات'}
              dir={modelDraft ? 'ltr' : 'rtl'}
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm placeholder:font-sans"
            />
            <datalist id={listId}>
              {models.map((m) => <option key={m} value={m} />)}
            </datalist>
            <Button variant="outline" size="icon" onClick={loadModels} disabled={!canListModels || busy !== null} title="تحميل قائمة الموديلات">
              {busy === 'models' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            </Button>
            <Button onClick={() => onSaveModel(modelDraft.trim())} disabled={savingModel || !modelDraft.trim() || modelDraft.trim() === model}>
              {savingModel ? <Loader2 className="animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={test} disabled={!ready || busy !== null}>
            {busy === 'test' ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} اختبار الاتصال
          </Button>
          {testResult && <span className="text-sm text-green-700">{testResult}</span>}
        </div>
      </div>
    </div>
  );
}
