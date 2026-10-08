import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import {
  Undo2, Redo2, Heading2, Heading3, Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Quote, Minus, AlignRight, AlignCenter, AlignLeft, Link2, Unlink, ImagePlus, Image as ImageIcon,
  Youtube as YoutubeIcon, RemoveFormatting, Code, Loader2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface RichTextEditorHandle {
  // At the cursor in the visual editor; at the end in HTML mode.
  insertImage: (src: string, alt?: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  ref?: Ref<RichTextEditorHandle>;
}

// Markup the visual editor has no node for. Opening such a body in visual
// mode would silently drop it on the first keystroke, so it opens as HTML.
const UNSUPPORTED = /<(table|figure|figcaption|h4|h5|h6|span|mark|dl|details|video|audio)\b|<div(?![^>]*data-youtube-video)/i;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type UrlPrompt = 'link' | 'image' | 'youtube' | null;

export function RichTextEditor({ value, onChange, ref }: RichTextEditorProps) {
  const { handleError } = useApiError();
  const [mode, setMode] = useState<'visual' | 'html'>(() => (UNSUPPORTED.test(value) ? 'html' : 'visual'));
  const [prompt, setPrompt] = useState<UrlPrompt>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    // The toolbar shows which marks are active, so it has to re-render as the
    // selection moves.
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: 'news-content', dir: 'rtl' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // New content from outside (an AI draft, a loaded article) replaces what is
  // in the editor; the editor's own updates come back equal and are ignored.
  useEffect(() => {
    // StrictMode replays effects against the instance it just destroyed.
    if (!editor || editor.isDestroyed || mode !== 'visual') return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor, mode]);

  useImperativeHandle(ref, () => ({
    insertImage: (src, alt = '') => {
      if (mode === 'visual' && editor && !editor.isDestroyed) {
        insertAfterSelection().setImage({ src, alt }).run();
      } else {
        const tag = document.createElement('img');
        tag.setAttribute('src', src);
        tag.setAttribute('alt', alt);
        onChange(value + tag.outerHTML);
      }
    },
  }));

  const switchMode = (next: 'visual' | 'html') => {
    if (next === mode) return;
    if (next === 'visual' && UNSUPPORTED.test(value)) {
      toast.warning('هذا المحتوى يحتوي على عناصر لا يدعمها المحرر المرئي (مثل الجداول) وستُحذف عند التعديل فيه. ابقَ في وضع HTML للحفاظ عليها.');
    }
    setMode(next);
  };

  // Media goes after the selection rather than replacing it: an admin who
  // highlights a sentence and then inserts a picture does not expect to lose it.
  const insertAfterSelection = () => editor!.chain().focus().setTextSelection(editor!.state.selection.to);

  const uploadImage = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('الصيغ المدعومة: JPG و PNG و WEBP و GIF');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('حجم الصورة أكبر من 10 ميجابايت');
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.upload<{ url: string }>('/upload', file);
      if (editor) insertAfterSelection().setImage({ src: url, alt: '' }).run();
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = (url: string) => {
    if (!editor) return;
    const kind = prompt;
    setPrompt(null);
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error('الرابط يجب أن يبدأ بـ https://');
      return;
    }
    if (kind === 'link') {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else if (kind === 'image') {
      insertAfterSelection().setImage({ src: url, alt: '' }).run();
    } else if (kind === 'youtube') {
      const ok = insertAfterSelection().setYoutubeVideo({ src: url }).run();
      if (!ok) toast.error('رابط يوتيوب غير صحيح');
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
        <div className="me-1 flex rounded-md border bg-background p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('visual')}
            className={cn('rounded px-2.5 py-1', mode === 'visual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
          >
            المحرر
          </button>
          <button
            type="button"
            onClick={() => switchMode('html')}
            className={cn('flex items-center gap-1 rounded px-2.5 py-1', mode === 'html' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
          >
            <Code className="h-3.5 w-3.5" /> HTML
          </button>
        </div>

        {mode === 'visual' && editor && (
          <Toolbar
            editor={editor}
            uploading={uploading}
            onUploadClick={() => fileInput.current?.click()}
            onPrompt={setPrompt}
          />
        )}
      </div>

      {mode === 'visual' ? (
        <div className="news-editor">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            spellCheck={false}
            className="block min-h-[360px] w-full resize-y bg-background p-3 font-mono text-xs leading-6 outline-none"
          />
          <p className="flex items-start gap-1.5 border-t bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            يُحفظ HTML كما هو بعد تنظيفه تلقائيًا من السكربتات والعناصر غير الآمنة. إطارات iframe مسموحة ليوتيوب فقط.
          </p>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) uploadImage(file);
        }}
      />

      {/* Keyed so each opening starts from its own initial value. */}
      <UrlDialog
        key={prompt ?? 'closed'}
        kind={prompt}
        initial={prompt === 'link' ? editor?.getAttributes('link').href ?? '' : ''}
        onClose={() => setPrompt(null)}
        onSubmit={applyUrl}
      />
    </div>
  );
}

function Toolbar({
  editor, uploading, onUploadClick, onPrompt,
}: {
  editor: Editor;
  uploading: boolean;
  onUploadClick: () => void;
  onPrompt: (p: UrlPrompt) => void;
}) {
  const chain = () => editor.chain().focus();
  return (
    <>
      <ToolButton label="تراجع" onClick={() => chain().undo().run()} disabled={!editor.can().undo()}><Undo2 /></ToolButton>
      <ToolButton label="إعادة" onClick={() => chain().redo().run()} disabled={!editor.can().redo()}><Redo2 /></ToolButton>
      <Divider />
      <ToolButton label="عنوان رئيسي" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 /></ToolButton>
      <ToolButton label="عنوان فرعي" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 /></ToolButton>
      <Divider />
      <ToolButton label="عريض" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}><Bold /></ToolButton>
      <ToolButton label="مائل" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}><Italic /></ToolButton>
      <ToolButton label="تسطير" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}><Underline /></ToolButton>
      <ToolButton label="يتوسطه خط" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}><Strikethrough /></ToolButton>
      <Divider />
      <ToolButton label="قائمة نقطية" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}><List /></ToolButton>
      <ToolButton label="قائمة مرقمة" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}><ListOrdered /></ToolButton>
      <ToolButton label="اقتباس" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}><Quote /></ToolButton>
      <ToolButton label="خط فاصل" onClick={() => chain().setHorizontalRule().run()}><Minus /></ToolButton>
      <Divider />
      <ToolButton label="محاذاة لليمين" active={editor.isActive({ textAlign: 'right' })} onClick={() => chain().setTextAlign('right').run()}><AlignRight /></ToolButton>
      <ToolButton label="توسيط" active={editor.isActive({ textAlign: 'center' })} onClick={() => chain().setTextAlign('center').run()}><AlignCenter /></ToolButton>
      <ToolButton label="محاذاة لليسار" active={editor.isActive({ textAlign: 'left' })} onClick={() => chain().setTextAlign('left').run()}><AlignLeft /></ToolButton>
      <Divider />
      <ToolButton label="رابط" active={editor.isActive('link')} onClick={() => onPrompt('link')}><Link2 /></ToolButton>
      <ToolButton label="إزالة الرابط" onClick={() => chain().unsetLink().run()} disabled={!editor.isActive('link')}><Unlink /></ToolButton>
      <Divider />
      <ToolButton label="رفع صورة" onClick={onUploadClick} disabled={uploading}>
        {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
      </ToolButton>
      <ToolButton label="صورة من رابط" onClick={() => onPrompt('image')}><ImageIcon /></ToolButton>
      <ToolButton label="فيديو يوتيوب" onClick={() => onPrompt('youtube')}><YoutubeIcon /></ToolButton>
      <Divider />
      <ToolButton label="إزالة التنسيق" onClick={() => chain().unsetAllMarks().clearNodes().run()}><RemoveFormatting /></ToolButton>
    </>
  );
}

function ToolButton({
  label, active, disabled, onClick, children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4',
        active && 'bg-background text-primary shadow-sm',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

const PROMPT_TEXT: Record<Exclude<UrlPrompt, null>, { title: string; placeholder: string }> = {
  link: { title: 'إضافة رابط', placeholder: 'https://example.com/page' },
  image: { title: 'صورة من رابط', placeholder: 'https://example.com/photo.jpg' },
  youtube: { title: 'فيديو يوتيوب', placeholder: 'https://www.youtube.com/watch?v=...' },
};

function UrlDialog({
  kind, initial, onClose, onSubmit,
}: {
  kind: UrlPrompt;
  initial: string;
  onClose: () => void;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState(initial);

  const text = kind ? PROMPT_TEXT[kind] : null;
  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{text?.title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(url.trim());
          }}
          className="space-y-4"
        >
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={text?.placeholder}
            dir="ltr"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit">إضافة</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
