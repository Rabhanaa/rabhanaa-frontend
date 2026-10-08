import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, Sparkles, Link2, Eye, Save, Send, EyeOff, Trash2, ImagePlus, X, Bell, ChevronDown,
  FileText, Settings, AlertTriangle, BarChart3, Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/admin/RichTextEditor';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { NewsContent } from '@/components/news/NewsContent';
import { NewsCover } from '@/components/news/NewsCover';
import { EmojiPicker } from '@/components/admin/EmojiPicker';
import { insertAtCaret } from '@/lib/caret';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  type AdminNews, type InterestRef, type SourceImage, AI_PROVIDER_LABEL, NOTIFY_MODE_LABEL,
  formatNewsDate, customersLabel, insertImagesIntoBody, NOTIFICATION_TITLE_HINT, NOTIFICATION_BODY_HINT,
} from '@/lib/news';
import { cn } from '@/lib/utils';

interface Form {
  title: string;
  summary: string;
  body: string;
  cover: string;
  sourceUrl: string;
  sourceName: string;
  sourceTitle: string;
  sourceText: string;
  aiProvider: string;
  aiModel: string;
  interestIds: number[];
  // Photos from the source article, already on our storage: the gallery the
  // admin picks the cover from and inserts into the body.
  sourceImages: SourceImage[];
  // The push. Empty falls back to the title and summary.
  notificationTitle: string;
  notificationBody: string;
}

const EMPTY: Form = {
  title: '', summary: '', body: '', cover: '', sourceUrl: '', sourceName: '', sourceTitle: '',
  sourceText: '', aiProvider: '', aiModel: '', interestIds: [], sourceImages: [],
  notificationTitle: '', notificationBody: '',
};

interface ExtractResponse {
  source_url: string;
  source_title: string;
  source_name: string;
  source_text: string;
  cover_image_url: string;
  cover_warning?: string;
  images: SourceImage[];
}

interface GenerateResponse {
  title: string;
  summary: string;
  body_html: string;
  notification_title: string;
  notification_body: string;
  interest_ids: number[];
  provider: string;
  model: string;
}

interface Audience {
  notify_mode: string;
  recipients: number;
  recipients_pro: number;
  recipients_free: number;
  with_push: number;
  already_notified: boolean;
}

interface PublishResponse {
  news: AdminNews;
  notify_mode: string;
  notified_count: number;
  already_notified: boolean;
}

interface SettingsResponse {
  settings: Record<string, string>;
  secrets: Record<string, string>;
}

const PROVIDERS = ['openai', 'gemini', 'openrouter'];
const TITLE_HINT = 90;
const SUMMARY_HINT = 160;

function fromArticle(n: AdminNews): Form {
  return {
    title: n.title,
    summary: n.summary,
    body: n.body_html ?? '',
    cover: n.cover_image_url,
    sourceUrl: n.source_url,
    sourceName: n.source_name,
    sourceTitle: '',
    sourceText: n.source_text ?? '',
    aiProvider: n.ai_provider,
    aiModel: n.ai_model,
    interestIds: n.interests.map((i) => i.id),
    sourceImages: n.source_images ?? [],
    notificationTitle: n.notification_title ?? '',
    notificationBody: n.notification_body ?? '',
  };
}

export function AdminNewsEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { handleError } = useApiError();

  const [form, setForm] = useState<Form>(EMPTY);
  const [article, setArticle] = useState<AdminNews | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [interests, setInterests] = useState<InterestRef[]>([]);
  const [provider, setProvider] = useState('');
  const [configured, setConfigured] = useState<Record<string, boolean>>({});

  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<'extract' | 'generate' | 'notification' | 'test' | 'save' | 'publish' | 'unpublish' | 'delete' | 'cover' | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [notify, setNotify] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const bodyEditor = useRef<RichTextEditorHandle>(null);
  const notificationTitleInput = useRef<HTMLInputElement>(null);
  const notificationBodyInput = useRef<HTMLTextAreaElement>(null);

  // Reference data: interests to tag with, and which AI providers are ready.
  useEffect(() => {
    api.get<{ interests: (InterestRef & { is_active: boolean })[] }>('/interests')
      .then((d) => setInterests((d.interests || []).filter((i) => i.is_active)))
      .catch(handleError);
    api.get<SettingsResponse>('/admin/settings')
      .then((d) => {
        const ready: Record<string, boolean> = {};
        for (const p of PROVIDERS) ready[p] = !!d.secrets?.[`${p}_api_key`] && !!d.settings?.[`${p}_model`];
        setConfigured(ready);
        setProvider(d.settings?.ai_provider || 'openai');
      })
      .catch(handleError);
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      setArticle(null);
      setDirty(false);
      return;
    }
    // The first save of a new story moves the URL to its id; the page already
    // holds what was just saved, so there is nothing to reload.
    if (article?.public_id === id) return;
    setLoading(true);
    api.get<{ news: AdminNews }>(`/admin/news/${id}`)
      .then((d) => {
        setArticle(d.news);
        setForm(fromArticle(d.news));
        setDirty(false);
      })
      .catch((err) => {
        handleError(err);
        navigate('/admin/news', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Closing the tab with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  // ------------------------------------------------------------ AI flow

  const fetchAndWrite = async () => {
    if (!url.trim()) {
      toast.error('الصق رابط الخبر أولًا');
      return;
    }
    setBusy('extract');
    try {
      const src = await api.post<ExtractResponse>('/admin/news/extract', { url: url.trim() });
      const gallery = [
        ...(src.cover_image_url ? [{ url: src.cover_image_url, alt: '' }] : []),
        ...(src.images ?? []),
      ];
      const next: Form = {
        ...form,
        sourceUrl: src.source_url,
        sourceName: src.source_name,
        sourceTitle: src.source_title,
        sourceText: src.source_text,
        cover: form.cover || src.cover_image_url,
        sourceImages: gallery,
      };
      setForm(next);
      setDirty(true);
      if (src.cover_warning) toast.warning(src.cover_warning);
      await generate(next);
    } catch (err) {
      handleError(err);
      // A blocked or unreadable site is common; the manual path is right here.
      setShowSource(true);
    } finally {
      setBusy(null);
    }
  };

  const requestGenerate = () => {
    if (form.title.trim() || form.body.trim()) {
      setConfirmOverwrite(true);
    } else {
      void runGenerate();
    }
  };

  const runGenerate = async () => {
    setBusy('generate');
    try {
      await generate(form);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  const generate = async (source: Form) => {
    if (source.sourceText.trim().length < 80) {
      toast.error('نص المصدر قصير جدًا — الصق نص الخبر كاملًا');
      setShowSource(true);
      return;
    }
    setBusy('generate');
    const draft = await api.post<GenerateResponse>('/admin/news/generate', {
      provider,
      source_url: source.sourceUrl,
      source_title: source.sourceTitle,
      source_name: source.sourceName,
      source_text: source.sourceText,
    });
    setForm({
      ...source,
      title: draft.title,
      summary: draft.summary,
      // The AI writes text only; the source's photos go back in between its
      // paragraphs. The cover is left out so it does not appear twice.
      body: insertImagesIntoBody(draft.body_html, source.sourceImages.filter((img) => img.url !== source.cover)),
      interestIds: draft.interest_ids,
      aiProvider: draft.provider,
      aiModel: draft.model,
      notificationTitle: draft.notification_title,
      notificationBody: draft.notification_body,
    });
    setDirty(true);
    toast.success('تمت كتابة المسودة — راجعها قبل النشر');
  };

  // Rewrites just the push from the article as it now stands, for when the
  // story was edited after the AI drafted it.
  const writeNotification = async () => {
    if (!form.title.trim()) {
      toast.error('اكتب عنوان الخبر أولًا');
      return;
    }
    setBusy('notification');
    try {
      const r = await api.post<{ notification_title: string; notification_body: string }>('/admin/news/notification-text', {
        provider,
        title: form.title,
        summary: form.summary,
        body_html: form.body,
      });
      setForm((f) => ({ ...f, notificationTitle: r.notification_title, notificationBody: r.notification_body }));
      setDirty(true);
      toast.success('تمت كتابة نص الإشعار');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  // Sends the notification, as it is in the editor now, to the admin's own
  // phone only. A new story is saved first: the push has to open something.
  // An existing one is not, so testing never pushes unfinished edits live.
  const sendTestNotification = async () => {
    const target = article ?? (await save(true));
    if (!target) return;
    setBusy('test');
    try {
      const r = await api.post<{ devices: number }>(`/admin/news/${target.public_id}/test-notification`, {
        notification_title: form.notificationTitle,
        notification_body: form.notificationBody,
      });
      toast.success(r.devices > 1 ? `أُرسل الإشعار التجريبي إلى أجهزتك (${r.devices})` : 'أُرسل الإشعار التجريبي إلى جهازك');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  // ------------------------------------------------------------ saving

  const payload = () => ({
    title: form.title,
    summary: form.summary,
    body_html: form.body,
    cover_image_url: form.cover,
    source_url: form.sourceUrl,
    source_name: form.sourceName,
    source_text: form.sourceText,
    ai_provider: form.aiProvider,
    ai_model: form.aiModel,
    interest_ids: form.interestIds,
    source_images: form.sourceImages,
    notification_title: form.notificationTitle,
    notification_body: form.notificationBody,
  });

  // Returns the saved article, or null when saving failed (already reported).
  const save = async (quiet = false): Promise<AdminNews | null> => {
    if (!form.title.trim()) {
      toast.error('عنوان الخبر مطلوب');
      return null;
    }
    setBusy('save');
    try {
      const d = article
        ? await api.patch<{ news: AdminNews }>(`/admin/news/${article.public_id}`, payload())
        : await api.post<{ news: AdminNews }>('/admin/news', payload());
      setArticle(d.news);
      // The server cleans the HTML; show what was actually stored.
      setForm((f) => ({ ...fromArticle(d.news), sourceTitle: f.sourceTitle }));
      setDirty(false);
      if (!quiet) toast.success('تم الحفظ');
      if (!article) navigate(`/admin/news/${d.news.public_id}`, { replace: true });
      return d.news;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const openPublish = async () => {
    if (!form.body.trim()) {
      toast.error('أضف نص الخبر قبل النشر');
      return;
    }
    const saved = dirty || !article ? await save(true) : article;
    if (!saved) return;
    setAudience(null);
    setPublishOpen(true);
    try {
      const a = await api.get<Audience>(`/admin/news/${saved.public_id}/audience`);
      setAudience(a);
      setNotify(a.notify_mode !== 'off' && !a.already_notified && a.recipients > 0);
    } catch (err) {
      handleError(err);
    }
  };

  const publish = async () => {
    if (!article) return;
    setBusy('publish');
    try {
      const r = await api.post<PublishResponse>(`/admin/news/${article.public_id}/publish`, { notify });
      setArticle(r.news);
      setPublishOpen(false);
      if (r.notified_count > 0) toast.success(`تم النشر وإرسال إشعار إلى ${customersLabel(r.notified_count)}`);
      else toast.success('تم النشر');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    if (!article) return;
    setBusy('unpublish');
    try {
      const d = await api.post<{ news: AdminNews }>(`/admin/news/${article.public_id}/unpublish`, {});
      setArticle(d.news);
      toast.success('تم إلغاء النشر — الخبر الآن مسودة');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!article) return;
    setBusy('delete');
    try {
      await api.delete(`/admin/news/${article.public_id}`);
      setDirty(false);
      toast.success('تم حذف الخبر');
      navigate('/admin/news', { replace: true });
    } catch (err) {
      handleError(err);
      setBusy(null);
    }
  };

  const uploadCover = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('الصيغ المدعومة: JPG و PNG و WEBP و GIF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة أكبر من 10 ميجابايت');
      return;
    }
    setBusy('cover');
    try {
      const { url: uploaded } = await api.upload<{ url: string }>('/upload', file);
      set('cover', uploaded);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const published = article?.status === 'published';
  const anyBusy = busy !== null;
  const providerReady = configured[provider];

  return (
    <div className="space-y-6" dir="rtl">
      <AdminPageHeader
        title={isNew ? 'خبر جديد' : 'تعديل الخبر'}
        breadcrumbs={[{ label: 'الأخبار', to: '/admin/news' }, { label: isNew ? 'خبر جديد' : form.title || 'تعديل' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {article && (published
              ? <Badge className="bg-green-600 hover:bg-green-600">منشور</Badge>
              : <Badge variant="secondary">مسودة</Badge>)}
            {dirty && <span className="text-xs text-amber-600">تغييرات غير محفوظة</span>}
            {article && (published || article.notified_at) && (
              <Button variant="outline" onClick={() => navigate(`/admin/news/${article.public_id}/analytics`)}>
                <BarChart3 /> التحليلات
              </Button>
            )}
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!form.title && !form.body}>
              <Eye /> معاينة
            </Button>
            <Button variant="outline" onClick={() => save()} disabled={anyBusy || (!dirty && !!article)}>
              {busy === 'save' ? <Loader2 className="animate-spin" /> : <Save />} حفظ
            </Button>
            {published ? (
              <Button variant="outline" onClick={unpublish} disabled={anyBusy}>
                {busy === 'unpublish' ? <Loader2 className="animate-spin" /> : <EyeOff />} إلغاء النشر
              </Button>
            ) : (
              <Button onClick={openPublish} disabled={anyBusy}>
                <Send /> نشر
              </Button>
            )}
            {article && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} disabled={anyBusy}>
                <Trash2 />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Source + AI */}
          <section className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">اكتب الخبر بالذكاء الاصطناعي</h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* The icon and its padding use physical sides: the field flips
                  to LTR once a URL is typed, and logical sides would flip with it. */}
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !anyBusy && fetchAndWrite()}
                  placeholder="الصق رابط الخبر من أي موقع إخباري"
                  dir={url ? 'ltr' : 'rtl'}
                  className="h-10 w-full rounded-md border border-input bg-background pl-3 pr-9 text-sm"
                />
              </div>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                title="مزود الذكاء الاصطناعي"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {AI_PROVIDER_LABEL[p]}{configured[p] ? '' : ' (غير مُعد)'}
                  </option>
                ))}
              </select>
              <Button onClick={fetchAndWrite} disabled={anyBusy || !providerReady} className="sm:w-44">
                {busy === 'extract' ? <><Loader2 className="animate-spin" /> جاري قراءة الرابط</>
                  : busy === 'generate' ? <><Loader2 className="animate-spin" /> جاري الكتابة</>
                  : <><Sparkles /> اجلب واكتب</>}
              </Button>
            </div>

            {!providerReady && provider && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {AI_PROVIDER_LABEL[provider]} غير مُعد — أضف المفتاح واختر الموديل من
                <button className="font-semibold underline" onClick={() => navigate('/admin/settings')}>الإعدادات</button>
              </p>
            )}

            <button
              onClick={() => setShowSource((v) => !v)}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', showSource && 'rotate-180')} />
              نص المصدر {form.sourceText ? `(${form.sourceText.length.toLocaleString('ar-EG')} حرف)` : '— أو الصقه يدويًا'}
            </button>
            {showSource && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={form.sourceText}
                  onChange={(e) => set('sourceText', e.target.value)}
                  placeholder="إذا تعذر جلب الرابط، انسخ نص الخبر من الموقع والصقه هنا"
                  className="min-h-[160px] w-full rounded-md border border-input bg-background p-3 text-sm leading-7"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={form.sourceName}
                    onChange={(e) => set('sourceName', e.target.value)}
                    placeholder="اسم المصدر (مثال: اليوم السابع)"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <input
                    value={form.sourceUrl}
                    onChange={(e) => set('sourceUrl', e.target.value)}
                    placeholder="رابط المصدر"
                    dir={form.sourceUrl ? 'ltr' : 'rtl'}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <Button variant="outline" onClick={requestGenerate} disabled={anyBusy || !providerReady}>
                  {busy === 'generate' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  اكتب من هذا النص
                </Button>
              </div>
            )}
          </section>

          {/* Article */}
          <section className="space-y-4 rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">الخبر</h3>
              {form.aiProvider && (
                <span className="ms-auto text-xs text-muted-foreground">
                  كُتب بواسطة {AI_PROVIDER_LABEL[form.aiProvider] ?? form.aiProvider}{form.aiModel ? ` · ${form.aiModel}` : ''}
                </span>
              )}
            </div>

            <Field label="العنوان" count={form.title.length} hint={TITLE_HINT}>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={200}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-base font-semibold"
              />
            </Field>

            <Field label="الملخص" help="يظهر في الإشعار وفي قائمة الأخبار" count={form.summary.length} hint={SUMMARY_HINT}>
              <textarea
                value={form.summary}
                onChange={(e) => set('summary', e.target.value)}
                maxLength={300}
                rows={2}
                className="w-full rounded-md border border-input bg-background p-3 text-sm leading-6"
              />
            </Field>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">نص الخبر</label>
              <RichTextEditor ref={bodyEditor} value={form.body} onChange={(html) => set('body', html)} />
            </div>
          </section>

          {/* Notification */}
          <section className="space-y-4 rounded-lg border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">الإشعار</h3>
              <span className="text-xs text-muted-foreground">يصل لكل العملاء حسب إعدادات الإشعارات — غير المشتركين يرون دعوة للاشتراك عند فتحه</span>
              <Button variant="outline" size="sm" className="ms-auto" onClick={writeNotification} disabled={anyBusy || !providerReady}>
                {busy === 'notification' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                اكتب بالذكاء الاصطناعي
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                <Field label="عنوان الإشعار" count={form.notificationTitle.length} hint={NOTIFICATION_TITLE_HINT}>
                  <div className="flex items-center gap-1 rounded-md border border-input bg-background pe-1 focus-within:ring-2 focus-within:ring-ring">
                    <input
                      ref={notificationTitleInput}
                      value={form.notificationTitle}
                      onChange={(e) => set('notificationTitle', e.target.value)}
                      maxLength={100}
                      placeholder={form.title || 'عنوان الخبر يُستخدم إذا تُرك فارغًا'}
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none"
                    />
                    <EmojiPicker onPick={(e) => set('notificationTitle', insertAtCaret(notificationTitleInput.current, form.notificationTitle, e))} />
                  </div>
                </Field>
                <Field label="نص الإشعار" count={form.notificationBody.length} hint={NOTIFICATION_BODY_HINT}>
                  <div className="flex items-start gap-1 rounded-md border border-input bg-background pe-1 pt-1 focus-within:ring-2 focus-within:ring-ring">
                    <textarea
                      ref={notificationBodyInput}
                      value={form.notificationBody}
                      onChange={(e) => set('notificationBody', e.target.value)}
                      maxLength={300}
                      rows={3}
                      placeholder={form.summary || 'ملخص الخبر يُستخدم إذا تُرك فارغًا'}
                      className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none"
                    />
                    <EmojiPicker onPick={(e) => set('notificationBody', insertAtCaret(notificationBodyInput.current, form.notificationBody, e))} />
                  </div>
                </Field>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold">كيف سيظهر</p>
                <NotificationPreview
                  title={form.notificationTitle || form.title}
                  body={form.notificationBody || form.summary}
                />
                <TestNotificationButton onClick={sendTestNotification} busy={busy === 'test'} disabled={anyBusy || !form.title.trim()} />
              </div>
            </div>
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 font-semibold">صورة الغلاف</h3>
            {form.cover ? (
              <div className="relative overflow-hidden rounded-md border">
                <NewsCover src={form.cover} className="aspect-video w-full" />
                <button
                  onClick={() => set('cover', '')}
                  className="absolute end-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="إزالة الصورة"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                لا توجد صورة
              </div>
            )}
            <Button variant="outline" className="mt-3 w-full" onClick={() => coverInput.current?.click()} disabled={busy === 'cover'}>
              {busy === 'cover' ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              {form.cover ? 'تغيير الصورة' : 'رفع صورة'}
            </Button>
            <input
              ref={coverInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) uploadCover(f);
              }}
            />
          </section>

          {form.sourceImages.length > 0 && (
            <section className="rounded-lg border bg-card p-5">
              <h3 className="mb-1 font-semibold">صور من المصدر</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                اختر صورة الغلاف أو أدرج الصورة في نص الخبر عند موضع المؤشر.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {form.sourceImages.map((img) => {
                  const isCover = img.url === form.cover;
                  return (
                    <div key={img.url} className={cn('overflow-hidden rounded-md border', isCover && 'ring-2 ring-primary')}>
                      <div className="relative">
                        <NewsCover src={img.url} className="aspect-video w-full" />
                        {isCover && (
                          <span className="absolute start-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            الغلاف
                          </span>
                        )}
                      </div>
                      <div className="flex divide-x divide-x-reverse border-t text-xs">
                        <button
                          type="button"
                          onClick={() => set('cover', img.url)}
                          disabled={isCover}
                          className="flex-1 py-1.5 font-medium hover:bg-accent disabled:text-muted-foreground disabled:hover:bg-transparent"
                        >
                          غلاف
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            bodyEditor.current?.insertImage(img.url, img.alt);
                            toast.success('أُدرجت الصورة في نص الخبر');
                          }}
                          className="flex-1 py-1.5 font-medium hover:bg-accent"
                        >
                          إدراج في النص
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-lg border bg-card p-5">
            <h3 className="mb-1 font-semibold">الاهتمامات</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              تحدد من يصله الإشعار عند اختيار «مشتركي برو حسب الاهتمام» في الإعدادات.
            </p>
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => {
                const on = form.interestIds.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => set('interestIds', on ? form.interestIds.filter((x) => x !== i.id) : [...form.interestIds, i.id])}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                    )}
                  >
                    {i.name_ar}
                  </button>
                );
              })}
            </div>
          </section>

          {article && (
            <section className="space-y-2 rounded-lg border bg-card p-5 text-sm">
              <h3 className="mb-1 font-semibold">النشر</h3>
              <Row label="الحالة" value={published ? 'منشور' : 'مسودة'} />
              {article.published_at && <Row label="تاريخ النشر" value={formatNewsDate(article.published_at)} />}
              <Row
                label="الإشعار"
                value={article.notified_at ? `أُرسل إلى ${customersLabel(article.notified_count)}` : 'لم يُرسل'}
                icon={article.notified_at ? <Bell className="h-3.5 w-3.5 text-primary" /> : undefined}
              />
              <Row label="آخر تعديل" value={formatNewsDate(article.updated_at)} />
            </section>
          )}
        </div>
      </div>

      {/* Preview: the member view, at phone width */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        {/* The close button sits over the cover photo here, so it gets a backing. */}
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0 [&>button:last-child]:z-10 [&>button:last-child]:rounded-full [&>button:last-child]:bg-white/90 [&>button:last-child]:p-1.5 [&>button:last-child]:opacity-100 [&>button:last-child]:shadow" dir="rtl">
          <DialogHeader className="sr-only"><DialogTitle>معاينة</DialogTitle></DialogHeader>
          <ArticlePreview form={form} publishedAt={article?.published_at ?? null} />
        </DialogContent>
      </Dialog>

      {/* Publish */}
      <Dialog open={publishOpen} onOpenChange={(o) => busy !== 'publish' && setPublishOpen(o)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>نشر الخبر</DialogTitle>
            <DialogDescription>يقرأه مشتركو برو كاملًا، وغير المشتركين يرون ملخصه ودعوة للاشتراك.</DialogDescription>
          </DialogHeader>
          {!audience ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-muted-foreground">إعداد الإشعارات</span>
                <button className="flex items-center gap-1 font-semibold hover:underline" onClick={() => navigate('/admin/settings')}>
                  {NOTIFY_MODE_LABEL[audience.notify_mode] ?? audience.notify_mode}
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
              {audience.already_notified ? (
                <p className="rounded-md bg-muted p-3 text-muted-foreground">أُرسل إشعار هذا الخبر من قبل، ولن يُرسل مرة أخرى.</p>
              ) : audience.notify_mode === 'off' ? (
                <p className="rounded-md bg-muted p-3 text-muted-foreground">الإشعارات متوقفة من الإعدادات — سيُنشر الخبر دون إشعار.</p>
              ) : audience.recipients === 0 ? (
                <p className="rounded-md bg-amber-50 p-3 text-amber-800">
                  لا يوجد عملاء مطابقون.
                  {audience.notify_mode === 'by_interest' && ' اختر اهتمامات للخبر أولًا.'}
                </p>
              ) : (
                <>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                    <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-1 size-4 accent-primary" />
                    <span>
                      <span className="block font-semibold">أرسل إشعارًا إلى {customersLabel(audience.recipients)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {audience.recipients_pro} مشترك برو و{audience.recipients_free} غير مشترك · {audience.with_push} فعّلوا الإشعارات على أجهزتهم.
                      </span>
                    </span>
                  </label>
                  {notify && (
                    <>
                      <NotificationPreview
                        title={form.notificationTitle || form.title}
                        body={form.notificationBody || form.summary}
                      />
                      <TestNotificationButton onClick={sendTestNotification} busy={busy === 'test'} disabled={busy !== null} />
                    </>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={busy === 'publish'}>إلغاء</Button>
            <Button onClick={publish} disabled={!audience || busy === 'publish'}>
              {busy === 'publish' ? <Loader2 className="animate-spin" /> : <Send />}
              نشر الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف الخبر؟"
        description="سيُحذف الخبر نهائيًا ويختفي من صفحة الأخبار عند المشتركين."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive
        onConfirm={remove}
      />
      <ConfirmDialog
        open={confirmOverwrite}
        onOpenChange={setConfirmOverwrite}
        title="استبدال المسودة الحالية؟"
        description="سيكتب الذكاء الاصطناعي عنوانًا وملخصًا ونصًا جديدًا بدل الموجود."
        confirmLabel="استبدال"
        cancelLabel="إلغاء"
        onConfirm={() => void runGenerate()}
      />
    </div>
  );
}

function Field({
  label, help, count, hint, children,
}: {
  label: string;
  help?: string;
  count: number;
  hint: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <label className="text-sm font-semibold">
          {label}
          {help && <span className="ms-2 text-xs font-normal text-muted-foreground">{help}</span>}
        </label>
        <span className={cn('text-xs tabular-nums', count > hint ? 'text-amber-600' : 'text-muted-foreground')}>
          {count}/{hint}
        </span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 font-medium">{icon}{value}</span>
    </div>
  );
}

function ArticlePreview({ form, publishedAt }: { form: Form; publishedAt: string | null }) {
  return (
    <article className="bg-white">
      {form.cover && <NewsCover src={form.cover} className="aspect-[16/10] w-full" />}
      <div className="space-y-3 p-5">
        <p className="text-xs font-semibold text-green-700">
          {formatNewsDate(publishedAt ?? new Date().toISOString())}
        </p>
        <h1 className="text-2xl font-extrabold leading-snug text-gray-900">{form.title || 'بدون عنوان'}</h1>
        {form.summary && <p className="text-base leading-7 text-gray-600">{form.summary}</p>}
        <NewsContent html={form.body} className="pt-2" />
      </div>
    </article>
  );
}

// A phone lock-screen notification, so the admin sees how the push reads
// (and where the phone will cut it off) before sending it.
function NotificationPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-700 to-slate-900 p-3">
      <div className="rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur" dir="rtl">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-gray-500">
          <img src="/icon-192x192.png" alt="" className="size-4 rounded" />
          <span className="font-semibold">ربحانة</span>
          <span className="ms-auto">الآن</span>
        </div>
        <p className="line-clamp-1 text-sm font-bold text-gray-900">{title || 'عنوان الإشعار'}</p>
        <p className="line-clamp-3 text-[13px] leading-5 text-gray-700">{body || 'نص الإشعار'}</p>
      </div>
    </div>
  );
}

function TestNotificationButton({ onClick, busy, disabled }: { onClick: () => void; busy: boolean; disabled: boolean }) {
  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClick} disabled={disabled}>
        {busy ? <Loader2 className="animate-spin" /> : <Smartphone />}
        أرسل إشعارًا تجريبيًا لي
      </Button>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
        يصل لهاتفك فقط إذا كنت مسجلًا بحسابك هذا في التطبيق وفعّلت الإشعارات. لا يُحسب في التحليلات.
      </p>
    </div>
  );
}
