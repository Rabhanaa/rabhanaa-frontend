import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ReactNode } from 'react';

export type MetricAccent = 'info' | 'success' | 'danger';

interface MetricCardProps {
  title: string;
  value?: string | number;
  suffix?: string;
  icon?: ReactNode;
  loading?: boolean;
  alert?: boolean;
  accent?: MetricAccent;
  testId?: string;
}

const ACCENT_CLASSES: Record<MetricAccent, { card: string; value: string; icon: string }> = {
  info:    { card: 'border-blue-200 bg-blue-50/40',     value: 'text-blue-700',    icon: 'text-blue-600' },
  success: { card: 'border-emerald-200 bg-emerald-50/40', value: 'text-emerald-700', icon: 'text-emerald-600' },
  danger:  { card: 'border-red-200 bg-red-50/40',       value: 'text-red-700',     icon: 'text-red-600' },
};

export function MetricCard({
  title,
  value,
  suffix,
  icon,
  loading = false,
  alert = false,
  accent,
  testId,
}: MetricCardProps) {
  const accentCls = accent ? ACCENT_CLASSES[accent] : null;
  return (
    <Card data-testid={testId} className={accentCls?.card}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={accentCls?.icon ?? 'text-muted-foreground'}>{icon}</div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div
            className={`text-2xl font-bold ${
              alert ? 'text-destructive' : accentCls?.value ?? ''
            }`}
          >
            {value ?? '—'}
            {suffix && (
              <span className="text-sm font-normal text-muted-foreground mr-1">
                {suffix}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
