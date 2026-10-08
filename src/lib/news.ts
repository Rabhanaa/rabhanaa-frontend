import DOMPurify from 'dompurify';

export interface InterestRef {
  id: number;
  name_ar: string;
}

// Member side
export interface NewsListItem {
  public_id: string;
  title: string;
  summary: string;
  cover_image_url: string;
  published_at: string;
  is_new: boolean;
}

export interface NewsArticle {
  public_id: string;
  title: string;
  summary: string;
  body_html: string;
  cover_image_url: string;
  interests: InterestRef[];
  published_at: string;
}

// What a non-Pro member sees of a story, above the upgrade prompt.
export interface NewsTeaser {
  public_id: string;
  title: string;
  summary: string;
  cover_image_url: string;
  published_at: string;
}

export interface NewsStatus {
  is_pro: boolean;
  unread: number;
}

// Admin side
export interface SourceImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface AdminNews {
  public_id: string;
  title: string;
  summary: string;
  body_html?: string;
  cover_image_url: string;
  source_url: string;
  source_name: string;
  source_text?: string;
  source_images?: SourceImage[];
  status: 'draft' | 'published';
  ai_provider: string;
  ai_model: string;
  interests: InterestRef[];
  published_at: string | null;
  notified_at: string | null;
  notified_count: number;
  created_at: string;
  updated_at: string;
  notification_title: string;
  notification_body: string;
  viewers: number;
}

// One story's reach. "pro" = read as Pro and never hit the upgrade prompt;
// "free" = hit the prompt, including those who then upgraded (converted).
export interface NewsAnalytics {
  notified_at: string | null;
  recipients: number;
  recipients_pro: number;
  recipients_free: number;
  delivered: number;
  delivered_pro: number;
  delivered_free: number;
  viewers: number;
  viewers_pro: number;
  viewers_free: number;
  push_opens: number;
  push_opens_pro: number;
  push_opens_free: number;
  read_to_end: number;
  upgrade_clicks: number;
  converted: number;
  total_views: number;
}

export interface NewsViewer {
  public_id: string;
  name: string;
  phone: string;
  email: string;
  from_push: boolean;
  read_as_pro: boolean;
  gated: boolean;
  read_to_end: boolean;
  upgrade_clicked: boolean;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
}

export type AIProvider = 'openai' | 'gemini' | 'openrouter';

export const AI_PROVIDER_LABEL: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
};

export const NOTIFY_MODE_LABEL: Record<string, string> = {
  off: 'إيقاف الإشعارات',
  all: 'كل العملاء',
  by_interest: 'العملاء حسب الاهتمام',
};

// Recommended lengths: phones cut notifications off around here.
export const NOTIFICATION_TITLE_HINT = 50;
export const NOTIFICATION_BODY_HINT = 120;

export const NEWS_EMOJIS = [
  '📰', '🔥', '📈', '📉', '💰', '📊', '⚠️', '🚨', '✅', '⏰', '👇', '✨',
  '🐔', '🥚', '🥩', '🐄', '🐑', '🐟', '🥛', '🧀', '🫒', '🌾', '🚚', '🌍',
];

// "45%" of whole, or an em dash when there is nothing to divide by.
export function percent(part: number, whole: number): string {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

// Spreads photos through an article body: each after a paragraph (never
// straight after a heading), evenly, keeping their order. Used to put the
// source article's photos into the AI draft, which is text only.
export function insertImagesIntoBody(html: string, images: SourceImage[]): string {
  if (images.length === 0) return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  const anchors = Array.from(root.children).filter((el) => !/^H[1-6]$/.test(el.tagName));
  const make = (img: SourceImage) => {
    const el = doc.createElement('img');
    el.setAttribute('src', img.url);
    el.setAttribute('alt', img.alt || '');
    return el;
  };
  if (anchors.length === 0) {
    images.forEach((img) => root.appendChild(make(img)));
    return root.innerHTML;
  }
  // Insert from the last image backwards so earlier positions stay valid and
  // images sharing an anchor keep their order.
  for (let i = images.length - 1; i >= 0; i--) {
    const pos = Math.max(1, Math.round(((i + 1) * anchors.length) / (images.length + 1)));
    anchors[Math.min(pos, anchors.length) - 1].after(make(images[i]));
  }
  return root.innerHTML;
}

// Arabic counted nouns: 3–10 take the plural, 11 and up the singular.
export function customersLabel(n: number): string {
  if (n === 1) return 'عميل واحد';
  if (n === 2) return 'عميلَين';
  if (n >= 3 && n <= 10) return `${n} عملاء`;
  return `${n} عميلًا`;
}

export function formatNewsDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Roughly 180 Arabic words a minute; never claims less than one minute.
export function readingMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

const YOUTUBE_EMBED = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[A-Za-z0-9_-]{6,20}(\?[A-Za-z0-9_=&;%.-]*)?$/;

// The API already sanitises every body before storing it. This is the second
// line: the member app never injects HTML it has not cleaned itself, and the
// only iframes that survive are YouTube embeds.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const src = (node as Element).getAttribute('src') || '';
    if (!YOUTUBE_EMBED.test(src)) node.parentNode?.removeChild(node);
  }
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')?.startsWith('http')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'nofollow noopener noreferrer');
  }
});

export function sanitizeNewsHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'data-youtube-video', 'loading'],
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
  });
}
