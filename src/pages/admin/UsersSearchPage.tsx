import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { UserRow, type UserResponse } from '@/components/admin/UserRow';
import { api } from '@/lib/api';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const PAGE_SIZE = 20;

interface UsersResponse {
  users: UserResponse[];
  total: number;
  page: number;
  page_size: number;
}

type StatusFilter =
  | ''
  | 'pending_documents'
  | 'pending_review'
  | 'active'
  | 'suspended'
  | 'banned'
  | 'rejected';

interface FilterChip {
  label: string;
  value: StatusFilter;
}

const FILTER_CHIPS: FilterChip[] = [
  { label: 'الكل', value: '' },
  { label: 'بانتظار المستندات', value: 'pending_documents' },
  { label: 'بانتظار المراجعة', value: 'pending_review' },
  { label: 'نشط', value: 'active' },
  { label: 'موقوف', value: 'suspended' },
  { label: 'محظور', value: 'banned' },
  { label: 'مرفوض', value: 'rejected' },
];

export function UsersSearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Debounce: reset page + update debouncedQuery 300ms after query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page when status changes
  useEffect(() => {
    setPage(1);
  }, [status]);

  // Fetch whenever debouncedQuery, status, or page changes
  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(PAGE_SIZE),
        });
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (status) params.set('status', status);

        const data = await api.get<UsersResponse>(`/admin/users?${params.toString()}`);
        if (!cancelled) {
          setUsers(data.users ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        // errors surface via global handler; keep existing state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, status, page]);

  const lastPage = Math.ceil(total / PAGE_SIZE) || 1;

  function handleReset() {
    setQuery('');
    setStatus('');
    setPage(1);
  }

  // Track whether the debouncedQuery is still catching up
  const isSearching = query !== debouncedQuery;
  const showLoading = loading || isSearching;

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminPageHeader title="البحث عن المستخدمين" />

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-background pb-4 flex flex-col gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="ps-9"
            placeholder="ابحث بالبريد الإلكتروني أو الاسم"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <Button
              key={chip.value}
              variant={status === chip.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(chip.value)}
            >
              {chip.label}
            </Button>
          ))}
        </div>

        {/* Total badge */}
        {!showLoading && (
          <p className="text-sm text-muted-foreground">
            {total} نتيجة
          </p>
        )}
      </div>

      {/* Content */}
      {showLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-muted-foreground">لا يوجد نتائج تطابق بحثك</p>
            <Button variant="outline" onClick={handleReset}>
              إعادة تعيين
            </Button>
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
                <UserRow
                  key={user.public_id}
                  user={user}
                  onClick={() => navigate(`/admin/users/${user.public_id}`)}
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/users/${user.public_id}`);
                      }}
                    >
                      عرض
                    </Button>
                  }
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
