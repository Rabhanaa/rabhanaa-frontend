import { TableCell, TableRow } from '@/components/ui/table';
import { UserStatusBadge } from './UserStatusBadge';

export interface UserResponse {
  public_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

interface UserRowProps {
  user: UserResponse;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export function UserRow({ user, actions, onClick }: UserRowProps) {
  return (
    <TableRow
      onClick={onClick}
      className={onClick ? 'cursor-pointer hover:bg-muted' : undefined}
    >
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.phone}</TableCell>
      <TableCell>
        <UserStatusBadge status={user.status} />
      </TableCell>
      <TableCell>
        {new Date(user.created_at).toLocaleDateString('ar-EG')}
      </TableCell>
      {actions !== undefined && <TableCell>{actions}</TableCell>}
    </TableRow>
  );
}
