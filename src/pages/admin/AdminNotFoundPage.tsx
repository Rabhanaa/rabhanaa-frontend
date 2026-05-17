import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AdminNotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="الصفحة غير موجودة" />
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <p className="text-muted-foreground text-center">
              الصفحة التي تبحث عنها غير موجودة.
            </p>
            <Button onClick={() => navigate('/admin')}>العودة إلى الرئيسية</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
