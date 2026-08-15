import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PostReasonDialog } from '@/components/admin/PostReasonDialog';
import { usePostVerdict, type PostType } from '@/hooks/usePostVerdict';
import { api, getImageUrl } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
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
import { Card, CardContent } from '@/components/ui/card';

const PAGE_SIZE = 20;

interface ModeratedPost {
  public_id: string;
  type: PostType;
  title: string;
  description?: string;
  image_url: string;
  owner_name: string;
  region_name: string;
  interest_name: string;
  unit: string;
  quantity: string;
  unit_price?: string;
  status: string;
  moderation_reason?: string;
  created_at: string;
}

interface PostsResponse {
  posts: ModeratedPost[];
  total: number;
}

type Tab = 'pending' | 'published';

const statusLabel: Record<string, string> = {
  pending_approval: 'بانتظار المراجعة',
  active: 'منشور',
  suspended: 'موقوف',
  rejected: 'مرفوض',
};

export function PostModerationPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [posts, setPosts] = useState<ModeratedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dialogMode, setDialogMode] = useState<'reject' | 'suspend'>('reject');
  const [dialogTarget, setDialogTarget] = useState<ModeratedPost | null>(null);

  const { approve, reject, suspend, unsuspend, isPending } = usePostVerdict();

  const fetchPage = useCallback(async (which: Tab, pageNum: number) => {
    setLoading(true);
    try {
      const data = await api.get<PostsResponse>(
        `/admin/posts/${which}?page=${pageNum}&page_size=${PAGE_SIZE}`,
      );
      setPosts(data.posts ?? []);
      setTotal(data.total);
      setPage(pageNum);
    } catch {
      // errors surface via the global handler; keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(tab, 1);
  }, [tab, fetchPage]);

  const refetch = () => fetchPage(tab, page);
  const lastPage = Math.ceil(total / PAGE_SIZE) || 1;

  function openDialog(post: ModeratedPost, mode: 'reject' | 'suspend') {
    setDialogMode(mode);
    setDialogTarget(post);
  }

  function handleReasonConfirm(reason: string) {
    const target = dialogTarget;
    if (!target) return;
    setDialogTarget(null);
    if (dialogMode === 'reject') reject(target.public_id, target.type, reason, refetch);
    else suspend(target.public_id, target.type, reason, refetch);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminPageHeader title="مراجعة المنشورات" />

      <div className="flex gap-2">
        {(['pending', 'published'] as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'بانتظار المراجعة' : 'المنشورة'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {tab === 'pending' ? 'لا توجد منشورات بانتظار المراجعة' : 'لا توجد منشورات'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنشور</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>صاحبه</TableHead>
                <TableHead>المحافظة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={`${post.type}-${post.public_id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {post.image_url ? (
                        <img
                          src={getImageUrl(post.image_url) ?? undefined}
                          alt=""
                          className="size-10 rounded object-cover"
                        />
                      ) : (
                        <span className="grid size-10 place-items-center rounded bg-muted">📦</span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{post.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {post.interest_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{post.type === 'sell' ? 'عرض بيع' : 'طلب شراء'}</TableCell>
                  <TableCell>{post.owner_name}</TableCell>
                  <TableCell>{post.region_name}</TableCell>
                  <TableCell>
                    {formatMoney(post.quantity)} {post.unit}
                  </TableCell>
                  <TableCell>
                    {post.unit_price ? `${formatMoney(post.unit_price)} ج.م` : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">
                      {statusLabel[post.status] ?? post.status}
                    </span>
                    {post.moderation_reason && (
                      <p className="max-w-40 truncate text-xs text-muted-foreground">
                        {post.moderation_reason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {post.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => approve(post.public_id, post.type, refetch)}
                          >
                            نشر
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => openDialog(post, 'reject')}
                          >
                            رفض
                          </Button>
                        </>
                      )}
                      {post.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => openDialog(post, 'suspend')}
                        >
                          إيقاف
                        </Button>
                      )}
                      {post.status === 'suspended' && (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => unsuspend(post.public_id, post.type, refetch)}
                        >
                          إعادة النشر
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              صفحة {page} من {lastPage} · {total} منشور
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchPage(tab, page - 1)}
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= lastPage}
                onClick={() => fetchPage(tab, page + 1)}
              >
                التالي
              </Button>
            </div>
          </div>
        </>
      )}

      <PostReasonDialog
        open={dialogTarget !== null}
        mode={dialogMode}
        onOpenChange={(open) => !open && setDialogTarget(null)}
        onConfirm={handleReasonConfirm}
        isPending={isPending}
      />
    </div>
  );
}
