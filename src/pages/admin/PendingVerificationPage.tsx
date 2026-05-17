import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { UserRow, type UserResponse } from '@/components/admin/UserRow';
import { UserDocumentsPanel } from '@/components/admin/UserDocumentsPanel';
import { RejectDialog } from '@/components/admin/RejectDialog';
import { useUserVerdict } from '@/hooks/useUserVerdict';
import { api } from '@/lib/api';
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

interface PendingResponse {
  users: UserResponse[];
  total: number;
  page: number;
  page_size: number;
}

export function PendingVerificationPage() {
  const navigate = useNavigate();
  const { approve, reject, isPending } = useUserVerdict();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  async function fetchPage(pageNum: number) {
    setLoading(true);
    try {
      const data = await api.get<PendingResponse>(
        `/admin/users/pending?page=${pageNum}&page_size=${PAGE_SIZE}`
      );
      setUsers(data.users ?? []);
      setTotal(data.total);
      setPage(pageNum);
    } catch {
      // errors surface via global handler; keep existing state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage(1);
  }, []);

  function refetch() {
    fetchPage(page);
  }

  const lastPage = Math.ceil(total / PAGE_SIZE) || 1;

  function toggleExpanded(publicId: string) {
    setExpandedId((prev) => (prev === publicId ? null : publicId));
  }

  function handleApprove(publicId: string) {
    approve(publicId, refetch);
  }

  function handleRejectConfirm(reason: string) {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setRejectTarget(null);
    reject(target, reason, refetch);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminPageHeader title="قيد المراجعة" />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">لا يوجد طلبات مراجعة حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <React.Fragment key={user.public_id}>
                  <UserRow
                    key={user.public_id}
                    user={user}
                    onClick={() => navigate(`/admin/users/${user.public_id}`)}
                    actions={
                      <div className="flex flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(user.public_id);
                          }}
                        >
                          عرض المستندات
                        </Button>
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(user.public_id);
                          }}
                        >
                          موافقة
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectTarget(user.public_id);
                          }}
                        >
                          رفض
                        </Button>
                      </div>
                    }
                  />
                  {expandedId === user.public_id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <UserDocumentsPanel
                          userPublicId={user.public_id}
                          userStatus={user.status}
                          onVerdict={refetch}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchPage(page - 1)}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحة {page} من {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= lastPage}
              onClick={() => fetchPage(page + 1)}
            >
              التالي
            </Button>
          </div>
        </>
      )}

      <RejectDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onConfirm={handleRejectConfirm}
        isPending={isPending}
      />
    </div>
  );
}
