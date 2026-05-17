import { Badge } from '@/components/ui/badge';

interface UserStatusBadgeProps {
  status: string;
  suspendedUntil?: string;
}

function formatSuspendedUntil(iso: string): string {
  const until = new Date(iso);
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();
  if (diffMs <= 0) return 'موقوف';

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 2) return `موقوف (${diffDays} أيام)`;
  if (diffHours >= 1) return `موقوف (${diffHours} ساعة)`;
  return 'موقوف';
}

export function UserStatusBadge({ status, suspendedUntil }: UserStatusBadgeProps) {
  switch (status) {
    case 'pending_documents':
      return <Badge variant="secondary">بانتظار المستندات</Badge>;
    case 'pending_review':
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 border">
          قيد المراجعة
        </Badge>
      );
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 border">
          نشط
        </Badge>
      );
    case 'rejected':
      return <Badge variant="destructive">مرفوض</Badge>;
    case 'suspended':
      return (
        <Badge className="bg-amber-500 text-white border-amber-600 border">
          {suspendedUntil ? formatSuspendedUntil(suspendedUntil) : 'موقوف'}
        </Badge>
      );
    case 'banned':
      return (
        <Badge className="bg-destructive text-destructive-foreground border-destructive border">
          محظور
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
