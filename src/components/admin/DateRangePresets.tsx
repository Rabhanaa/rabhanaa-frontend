import { Button } from '@/components/ui/button';

interface DateRangePresetsProps {
  onChange: (from: Date, to: Date) => void;
  activeDays?: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const PRESETS = [
  { label: '7 أيام', days: 7 },
  { label: '30 يوم', days: 30 },
  { label: '90 يوم', days: 90 },
];

export function DateRangePresets({ onChange, activeDays }: DateRangePresetsProps) {
  return (
    <div className="flex gap-2">
      {PRESETS.map((p) => {
        const isActive = activeDays != null && Math.abs(activeDays - p.days) <= 1;
        return (
          <Button
            key={p.days}
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => {
              const to = endOfDay(new Date());
              const from = startOfDay(new Date(Date.now() - p.days * 24 * 60 * 60 * 1000));
              onChange(from, to);
            }}
          >
            {p.label}
          </Button>
        );
      })}
    </div>
  );
}
