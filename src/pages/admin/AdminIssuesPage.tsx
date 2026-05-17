import { useEffect, useState, Fragment } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, User, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import {
  type IssueCategory,
  type IssuePriority,
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

interface IssueDetail {
  id: number;
  public_id: string;
  title: string;
  description: string;
  status: string;
  category: IssueCategory;
  priority: IssuePriority;
  created_at: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  user_region: string;
}

interface IssueReply {
  id: number;
  message: string;
  created_at: string;
}

interface DetailCache {
  detail: IssueDetail;
  replies: IssueReply[];
}

const PAGE_SIZE = 20;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminIssuesPage() {
  const { handleError } = useApiError();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, DetailCache>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);

  async function fetchPage(pageNum: number) {
    setLoading(true);
    try {
      const data = await api.get<{ issues: Issue[]; has_more: boolean }>(
        `/admin/issues?page=${pageNum}&page_size=${PAGE_SIZE}`
      );
      const fetched = data.issues ?? [];
      setIssues(fetched);
      setHasMore(data.has_more ?? false);
      setPage(pageNum);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPage(1); }, []);

  async function handleToggle(publicId: string) {
    if (expandedId === publicId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(publicId);
    if (detailCache[publicId]) return;

    setLoadingDetail(publicId);
    try {
      const data = await api.get<{ issue: IssueDetail; replies: IssueReply[] }>(
        `/admin/issues/${publicId}`
      );
      setDetailCache((prev) => ({
        ...prev,
        [publicId]: { detail: data.issue, replies: data.replies ?? [] },
      }));
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingDetail(null);
    }
  }

  async function handleClose(publicId: string) {
    setClosing(publicId);
    try {
      await api.patch(`/admin/issues/${publicId}/close`, {});
      setIssues((prev) =>
        prev.map((i) => (i.public_id === publicId ? { ...i, status: 'closed' } : i))
      );
      setDetailCache((prev) => {
        if (!prev[publicId]) return prev;
        return {
          ...prev,
          [publicId]: { ...prev[publicId], detail: { ...prev[publicId].detail, status: 'closed' } },
        };
      });
    } catch (err) {
      handleError(err);
    } finally {
      setClosing(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader title="استفسارات المستخدمين" />

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right w-24">الحالة</TableHead>
              <TableHead className="text-right w-28">التصنيف</TableHead>
              <TableHead className="text-right w-24">الأولوية</TableHead>
              <TableHead className="text-right w-40">التاريخ</TableHead>
              <TableHead className="text-right w-28">إجراء</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  لا توجد استفسارات
                </TableCell>
              </TableRow>
            ) : (
              issues.map((issue) => {
                const isExpanded = expandedId === issue.public_id;
                const cached = detailCache[issue.public_id];
                const isLoadingThis = loadingDetail === issue.public_id;

                return (
                  <Fragment key={issue.public_id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-xs">
                        <div>
                          <p className="font-semibold truncate">{issue.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{issue.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={issue.status === 'open' ? 'default' : 'secondary'}>
                          {issue.status === 'open' ? 'مفتوح' : 'مغلق'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[issue.category]}`}>
                          {CATEGORY_LABELS_AR[issue.category]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[issue.priority]}`}>
                          {PRIORITY_LABELS_AR[issue.priority]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(issue.created_at)}
                      </TableCell>
                      <TableCell>
                        {issue.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={closing === issue.public_id}
                            onClick={() => handleClose(issue.public_id)}
                          >
                            {closing === issue.public_id ? '...' : 'إغلاق'}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggle(issue.public_id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="py-5 px-6">
                          {isLoadingThis ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : cached ? (
                            <div className="grid grid-cols-2 gap-6">
                              {/* Left: user info */}
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">بيانات المستخدم</p>
                                <div className="bg-background rounded-lg border p-4 space-y-2.5">
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{cached.detail.user_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">{cached.detail.user_email}</span>
                                  </div>
                                  {cached.detail.user_phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                      <span className="text-muted-foreground">{cached.detail.user_phone}</span>
                                    </div>
                                  )}
                                  {cached.detail.user_region && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                      <span className="text-muted-foreground">{cached.detail.user_region}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[cached.detail.category]}`}>
                                      {CATEGORY_LABELS_AR[cached.detail.category]}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[cached.detail.priority]}`}>
                                      {PRIORITY_LABELS_AR[cached.detail.priority]}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: issue body + replies */}
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">تفاصيل الاستفسار</p>
                                <div className="bg-background rounded-lg border p-4">
                                  <p className="text-sm leading-relaxed">{cached.detail.description}</p>
                                </div>

                                {cached.replies.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">الردود</p>
                                    {cached.replies.map((reply) => (
                                      <div key={reply.id} className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3">
                                        <p className="text-sm">{reply.message}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">{formatDate(reply.created_at)}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {cached.replies.length === 0 && (
                                  <p className="text-xs text-muted-foreground">لا توجد ردود بعد</p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page === 1} onClick={() => fetchPage(page - 1)}>
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">صفحة {page}</span>
          <Button variant="outline" disabled={!hasMore} onClick={() => fetchPage(page + 1)}>
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
