import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export type ChartType = 'line' | 'bar';

interface TimeSeriesChartProps {
  data: Array<{ bucket: string; value: number }>;
  type?: ChartType;
  color?: string;
  alertThreshold?: number;
  height?: number;
  testId?: string;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-sm">
        <div className="text-muted-foreground">{formatDateLabel(label)}</div>
        <div className="font-semibold">{payload[0].value}</div>
      </div>
    );
  }
  return null;
}

export function TimeSeriesChart({
  data,
  type = 'line',
  color = '#2563eb',
  alertThreshold,
  height = 240,
  testId,
}: TimeSeriesChartProps) {
  const strokeColor = alertThreshold
    ? data.some((d) => d.value > alertThreshold)
      ? '#dc2626'
      : color
    : color;

  return (
    <div data-testid={testId} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={strokeColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
