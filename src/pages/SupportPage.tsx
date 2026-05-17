import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, X, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApiError } from '@/hooks/useApiError';
import {
  type IssueCategory,
  type IssuePriority,
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  CATEGORY_LABELS_AR,
  PRIORITY_LABELS_AR,
  CATEGORY_COLOR,
  PRIORITY_COLOR,
} from '@/lib/issueMeta';

interface Issue {
  id: number;
  public_id: string;
  title: string;
  description: string;
  status: string;
  category: IssueCategory;
  priority: IssuePriority;
  created_at: string;
}

interface IssueReply {
  id: number;
  message: string;
  created_at: string;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  return `منذ ${diffDays} يوم`;
}

export function SupportPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('support');
  const [priority, setPriority] = useState<IssuePriority>('normal');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, IssueReply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null);

  async function fetchIssues() {
    try {
      const data = await api.get<{ issues: Issue[] }>('/issues');
      setIssues(data.issues ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchIssues(); }, []);

  async function handleToggle(publicId: string) {
    if (expandedId === publicId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(publicId);
    if (replies[publicId]) return;
    setLoadingReplies(publicId);
    try {
      const data = await api.get<{ issue: Issue; replies: IssueReply[] }>(`/issues/${publicId}`);
      setReplies((prev) => ({ ...prev, [publicId]: data.replies ?? [] }));
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingReplies(null);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/issues', { title: title.trim(), description: description.trim(), category, priority });
      setTitle('');
      setDescription('');
      setCategory('support');
      setPriority('normal');
      setShowForm(false);
      fetchIssues();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 font-bold text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white transition-all';
  const selectClass =
    'w-full h-12 border border-gray-200 rounded-xl px-4 font-bold text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white appearance-none';

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 pb-32" dir="rtl">
      <ScreenHeader title="الدعم الفني" onBack={() => navigate(-1)} />

      {/* New Issue Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-12 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="h-4 w-4" />
          استفسار جديد
        </button>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-800">استفسار جديد</span>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">العنوان *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} h-12`}
              placeholder="موضوع الاستفسار"
              disabled={submitting}
            />
            {title.length > 0 && title.trim().length < 5 && (
              <p className="mt-1.5 text-xs font-bold text-red-500">يجب أن يكون العنوان 5 أحرف على الأقل</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className={selectClass}
                disabled={submitting}
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS_AR[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className={selectClass}
                disabled={submitting}
              >
                {ISSUE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS_AR[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">التفاصيل *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} h-28 py-3 resize-none`}
              placeholder="اشرح استفسارك بالتفصيل"
              disabled={submitting}
            />
            {description.length > 0 && description.trim().length < 10 && (
              <p className="mt-1.5 text-xs font-bold text-red-500">الرجاء كتابة 10 أحرف على الأقل</p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={title.trim().length < 5 || description.trim().length < 10 || submitting}
            className="w-full h-12 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال'}
          </button>
        </div>
      )}

      {/* Issues List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <CheckCircle2 className="h-12 w-12" />
          <p className="font-bold text-sm">لا توجد استفسارات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const isOpen = expandedId === issue.public_id;
            const issueReplies = replies[issue.public_id] ?? [];
            return (
              <div key={issue.public_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  className="w-full text-right px-5 py-4 flex items-start gap-3"
                  onClick={() => handleToggle(issue.public_id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          issue.status === 'open'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {issue.status === 'open' ? 'مفتوح' : 'مغلق'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[issue.category]}`}>
                        {CATEGORY_LABELS_AR[issue.category]}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[issue.priority]}`}>
                        {PRIORITY_LABELS_AR[issue.priority]}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(issue.created_at)}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-gray-900 truncate">{issue.title}</p>
                    {!isOpen && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{issue.description}</p>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
                    {loadingReplies === issue.public_id ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      </div>
                    ) : issueReplies.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-bold text-gray-500">ردود الدعم الفني:</p>
                        {issueReplies.map((reply) => (
                          <div key={reply.id} className="bg-green-50 rounded-xl px-4 py-3">
                            <p className="text-sm text-gray-800">{reply.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{getRelativeTime(reply.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 pt-1">في انتظار رد الدعم الفني</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
