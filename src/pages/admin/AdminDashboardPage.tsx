import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { TimeSeriesChart } from '@/components/admin/TimeSeriesChart';
import { StatusDonut } from '@/components/admin/StatusDonut';
import { DateRangePresets } from '@/components/admin/DateRangePresets';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  ShoppingCart,
  Ticket,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Activity,
  BarChart3,
  Tag,
} from 'lucide-react';
import {
  adminAnalytics,
  type OverviewSummary,
  type TimeSeriesPoint,
  type StatusCount,
  type SubscriptionStats,
  type SourceCount,
  type SourceDayPoint,
  type IssueSummary,
  type InterestCount,
  type InterestUser,
} from '@/lib/adminAnalytics';
import { UserStatusBadge } from '@/components/admin/UserStatusBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

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

function getActiveDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function mergeTimeSeries(
  a: TimeSeriesPoint[],
  b: TimeSeriesPoint[],
  keyA: string,
  keyB: string
): Array<{ bucket: string; [k: string]: number | string }> {
  const map = new Map<string, any>();
  a.forEach((p) => {
    map.set(p.bucket, { ...map.get(p.bucket), bucket: p.bucket, [keyA]: p.value });
  });
  b.forEach((p) => {
    map.set(p.bucket, { ...map.get(p.bucket), bucket: p.bucket, [keyB]: p.value });
  });
  return Array.from(map.values()).sort(
    (x, y) => new Date(x.bucket).getTime() - new Date(y.bucket).getTime()
  );
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
        {payload.map((p: any) => (
          <div key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

const SOURCE_LABELS_AR: Record<string, string> = {
  facebook:  'فيسبوك',
  google:    'جوجل',
  instagram: 'إنستجرام',
  tiktok:    'تيك توك',
  x:         'إكس',
  snapchat:  'سناب شات',
  friend:    'صديق',
  app_store: 'متجر التطبيقات',
  search:    'بحث',
  other:     'أخرى',
  direct:    'مباشرة',
};

const SOURCE_COLORS: Record<string, string> = {
  facebook:  '#1877f2',
  google:    '#ea4335',
  instagram: '#e1306c',
  tiktok:    '#010101',
  x:         '#1da1f2',
  snapchat:  '#fffc00',
  friend:    '#16a34a',
  app_store: '#0a84ff',
  search:    '#9333ea',
  other:     '#6b7280',
  direct:    '#64748b',
};

function sourceLabel(s: string): string {
  return SOURCE_LABELS_AR[s] ?? s;
}

function sourceColor(s: string): string {
  return SOURCE_COLORS[s] ?? '#94a3b8';
}

function pivotSourceByDay(rows: SourceDayPoint[]): {
  data: Array<Record<string, string | number>>;
  sources: string[];
} {
  const sourceSet = new Set<string>();
  const byBucket = new Map<string, Record<string, string | number>>();
  rows.forEach((r) => {
    sourceSet.add(r.source);
    const existing = byBucket.get(r.bucket) ?? { bucket: r.bucket };
    existing[r.source] = (Number(existing[r.source]) || 0) + r.value;
    byBucket.set(r.bucket, existing);
  });
  const data = Array.from(byBucket.values()).sort(
    (a, b) => new Date(a.bucket as string).getTime() - new Date(b.bucket as string).getTime()
  );
  return { data, sources: Array.from(sourceSet) };
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultFrom = useMemo(
    () => startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    []
  );
  const defaultTo = useMemo(() => endOfDay(new Date()), []);

  const from = useMemo(
    () => parseDateParam(searchParams.get('from'), defaultFrom),
    [searchParams, defaultFrom]
  );
  const to = useMemo(
    () => parseDateParam(searchParams.get('to'), defaultTo),
    [searchParams, defaultTo]
  );

  const updateRange = useCallback(
    (f: Date, t: Date) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('from', f.toISOString());
          next.set('to', t.toISOString());
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const setFrom = useCallback((f: Date) => updateRange(f, to), [updateRange, to]);
  const setTo = useCallback((t: Date) => updateRange(from, t), [updateRange, from]);

  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [newUsersSeries, setNewUsersSeries] = useState<TimeSeriesPoint[]>([]);
  const [bidsSeries, setBidsSeries] = useState<TimeSeriesPoint[]>([]);
  const [closedAuctionsSeries, setClosedAuctionsSeries] = useState<TimeSeriesPoint[]>([]);
  const [ordersSeries, setOrdersSeries] = useState<TimeSeriesPoint[]>([]);
  const [failedLoginsSeries, setFailedLoginsSeries] = useState<TimeSeriesPoint[]>([]);
  const [buyRequestsSeries, setBuyRequestsSeries] = useState<TimeSeriesPoint[]>([]);
  const [tsLoading, setTsLoading] = useState(true);

  const [statusDist, setStatusDist] = useState<StatusCount[]>([]);
  const [statusDistLoading, setStatusDistLoading] = useState(true);

  const [subStats, setSubStats] = useState<SubscriptionStats | null>(null);
  const [subStatsLoading, setSubStatsLoading] = useState(true);

  const [issuesSummary, setIssuesSummary] = useState<IssueSummary | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(true);

  const [sourceDist, setSourceDist] = useState<SourceCount[]>([]);
  const [sourceByDay, setSourceByDay] = useState<SourceDayPoint[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);

  const [interestCounts, setInterestCounts] = useState<InterestCount[]>([]);
  const [interestCountsLoading, setInterestCountsLoading] = useState(true);
  const [selectedInterest, setSelectedInterest] = useState<InterestCount | null>(null);
  const [interestUsers, setInterestUsers] = useState<InterestUser[]>([]);
  const [interestUsersLoading, setInterestUsersLoading] = useState(false);

  const activeDays = useMemo(() => getActiveDays(from, to), [from, to]);

  useEffect(() => {
    let cancelled = false;
    setOverviewLoading(true);
    adminAnalytics
      .overview(from, to)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setTsLoading(true);
    Promise.all([
      adminAnalytics.timeseries('new_users', from, to),
      adminAnalytics.timeseries('bids', from, to),
      adminAnalytics.timeseries('closed_auctions', from, to),
      adminAnalytics.timeseries('orders', from, to),
      adminAnalytics.timeseries('failed_logins', from, to),
      adminAnalytics.timeseries('buy_requests', from, to),
    ])
      .then(([nu, b, ca, o, fl, br]) => {
        if (cancelled) return;
        setNewUsersSeries(nu);
        setBidsSeries(b);
        setClosedAuctionsSeries(ca);
        setOrdersSeries(o);
        setFailedLoginsSeries(fl);
        setBuyRequestsSeries(br);
      })
      .catch(() => {
        if (!cancelled) {
          setNewUsersSeries([]);
          setBidsSeries([]);
          setClosedAuctionsSeries([]);
          setOrdersSeries([]);
          setFailedLoginsSeries([]);
          setBuyRequestsSeries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setTsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setStatusDistLoading(true);
    adminAnalytics
      .statusDistribution()
      .then((data) => {
        if (!cancelled) setStatusDist(data);
      })
      .catch(() => {
        if (!cancelled) setStatusDist([]);
      })
      .finally(() => {
        if (!cancelled) setStatusDistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSubStatsLoading(true);
    adminAnalytics
      .subscriptionStats()
      .then((data) => {
        if (!cancelled) setSubStats(data);
      })
      .catch(() => {
        if (!cancelled) setSubStats(null);
      })
      .finally(() => {
        if (!cancelled) setSubStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setInterestCountsLoading(true);
    adminAnalytics
      .usersByInterest()
      .then((data) => {
        if (!cancelled) setInterestCounts(data);
      })
      .catch(() => {
        if (!cancelled) setInterestCounts([]);
      })
      .finally(() => {
        if (!cancelled) setInterestCountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedInterest) {
      setInterestUsers([]);
      return;
    }
    let cancelled = false;
    setInterestUsersLoading(true);
    adminAnalytics
      .usersForInterest(selectedInterest.id)
      .then((data) => {
        if (!cancelled) setInterestUsers(data);
      })
      .catch(() => {
        if (!cancelled) setInterestUsers([]);
      })
      .finally(() => {
        if (!cancelled) setInterestUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedInterest]);

  useEffect(() => {
    let cancelled = false;
    setSourcesLoading(true);
    Promise.all([
      adminAnalytics.usersSourceDistribution(from, to),
      adminAnalytics.usersSourceByDay(from, to),
    ])
      .then(([dist, byDay]) => {
        if (cancelled) return;
        setSourceDist(dist);
        setSourceByDay(byDay);
      })
      .catch(() => {
        if (!cancelled) {
          setSourceDist([]);
          setSourceByDay([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setIssuesLoading(true);
    adminAnalytics
      .issuesBreakdown(from, to)
      .then((data) => {
        if (!cancelled) setIssuesSummary(data);
      })
      .catch(() => {
        if (!cancelled) setIssuesSummary(null);
      })
      .finally(() => {
        if (!cancelled) setIssuesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const combinedAuctionsOrders = useMemo(
    () => mergeTimeSeries(closedAuctionsSeries, ordersSeries, 'auctions', 'orders'),
    [closedAuctionsSeries, ordersSeries]
  );

  const sourceDistWithLabels = useMemo(
    () => sourceDist.map((s) => ({ ...s, label: sourceLabel(s.source) })),
    [sourceDist]
  );
  const sourceByDayPivot = useMemo(() => pivotSourceByDay(sourceByDay), [sourceByDay]);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="لوحة التحكم"
        actions={
          <div className="flex items-center gap-3">
            <DateRangePresets
              onChange={(f, t) => updateRange(f, t)}
              activeDays={activeDays}
            />
            <DateRangePicker
              startDate={from}
              endDate={to}
              onStartChange={(d) => d && setFrom(startOfDay(d))}
              onEndChange={(d) => d && setTo(endOfDay(d))}
            />
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="الجلسات النشطة"
          value={overview?.active_sessions}
          loading={overviewLoading}
          icon={<Activity className="h-4 w-4" />}
          testId="kpi-active-sessions"
        />
        <MetricCard
          title="إجمالي المبيعات"
          value={overview?.gmv_in_range}
          suffix="ر.س"
          loading={overviewLoading}
          icon={<ShoppingCart className="h-4 w-4" />}
          testId="kpi-gmv"
        />
        <MetricCard
          title="مستخدمين جدد"
          value={overview?.users_new_in_range}
          loading={overviewLoading}
          icon={<Users className="h-4 w-4" />}
          testId="kpi-new-users"
        />
        <MetricCard
          title="مشاكل مفتوحة"
          value={overview?.open_issues}
          loading={overviewLoading}
          icon={<AlertTriangle className="h-4 w-4" />}
          testId="kpi-open-issues"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مستخدمين جدد / يوم</CardTitle>
          </CardHeader>
          <CardContent>
            {tsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <TimeSeriesChart data={newUsersSeries} type="line" testId="chart-new-users" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">عروض المزايدة / يوم</CardTitle>
          </CardHeader>
          <CardContent>
            {tsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <TimeSeriesChart data={bidsSeries} type="bar" color="#16a34a" testId="chart-bids" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">صفقات منتهية vs طلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {tsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div data-testid="chart-auctions-orders" style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={combinedAuctionsOrders}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 12, fill: '#888' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">
                          {value === 'auctions' ? 'صفقات منتهية' : 'طلبات'}
                        </span>
                      )}
                    />
                    <Bar dataKey="auctions" fill="#ca8a04" radius={[4, 4, 0, 0]} name="auctions" />
                    <Bar dataKey="orders" fill="#2563eb" radius={[4, 4, 0, 0]} name="orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">تسجيلات دخول فاشلة / يوم</CardTitle>
          </CardHeader>
          <CardContent>
            {tsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <TimeSeriesChart
                data={failedLoginsSeries}
                type="line"
                color="#dc2626"
                alertThreshold={10}
                testId="chart-failed-logins"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع حالات المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <StatusDonut data={statusDist} testId="chart-status-dist" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الاشتراكات حسب الباقة</CardTitle>
          </CardHeader>
          <CardContent>
            {subStatsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div data-testid="chart-subscriptions" style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subStats?.active_by_tier ?? []}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="display_name_en"
                      tick={{ fontSize: 12, fill: '#888' }}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#9333ea" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues categorization */}
      <div data-testid="issues-summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="إجمالي المشاكل"
          value={issuesSummary?.total}
          loading={issuesLoading}
          accent="info"
          icon={<AlertTriangle className="h-4 w-4" />}
          testId="kpi-issues-total"
        />
        <MetricCard
          title="مشاكل محلولة"
          value={issuesSummary?.resolved}
          loading={issuesLoading}
          accent="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
          testId="kpi-issues-resolved"
        />
        <MetricCard
          title="مشاكل غير محلولة"
          value={issuesSummary?.unresolved}
          loading={issuesLoading}
          accent="danger"
          icon={<AlertCircle className="h-4 w-4" />}
          testId="kpi-issues-unresolved"
        />
      </div>

      {/* Signup source breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إجمالي مصادر الاكتساب</CardTitle>
          </CardHeader>
          <CardContent>
            {sourcesLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div data-testid="chart-source-dist" style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sourceDistWithLabels}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#888' }}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {sourceDistWithLabels.map((s) => (
                        <Cell key={s.source} fill={sourceColor(s.source)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">مصادر الاكتساب اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            {sourcesLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div data-testid="chart-source-by-day" style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sourceByDayPivot.data}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 12, fill: '#888' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-sm">
                            <div className="text-muted-foreground">{formatDateLabel(label)}</div>
                            {payload.map((p: any) => (
                              <div key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
                                {sourceLabel(p.dataKey)}: {p.value}
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{sourceLabel(value)}</span>
                      )}
                    />
                    {sourceByDayPivot.sources.map((src) => (
                      <Bar
                        key={src}
                        dataKey={src}
                        stackId="sources"
                        fill={sourceColor(src)}
                        name={src}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users by interest */}
      <Card data-testid="users-by-interest">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">المستخدمون حسب الاهتمام</CardTitle>
          {selectedInterest && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSelectedInterest(null)}
            >
              إلغاء التحديد
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {interestCountsLoading ? (
            <Skeleton className="h-[80px] w-full" />
          ) : interestCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد اهتمامات</p>
          ) : (
            <div className="flex flex-wrap gap-2" data-testid="interest-chips">
              {interestCounts.map((it) => {
                const isActive = selectedInterest?.id === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setSelectedInterest(isActive ? null : it)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                    data-testid={`interest-chip-${it.id}`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>{it.name_ar}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {it.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedInterest && (
            <div className="rounded-md border" data-testid="interest-users-panel">
              <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/40">
                <h3 className="text-sm font-semibold">
                  مستخدمو «{selectedInterest.name_ar}» ({selectedInterest.count})
                </h3>
              </div>
              {interestUsersLoading ? (
                <div className="p-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : interestUsers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">لا يوجد مستخدمون</p>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y">
                  {interestUsers.map((u) => (
                    <button
                      key={u.public_id}
                      type="button"
                      onClick={() => navigate(`/admin/users/${u.public_id}`)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-right hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{u.name || '—'}</div>
                        <div className="truncate text-xs text-muted-foreground" dir="ltr">
                          {u.phone || '—'}
                        </div>
                      </div>
                      <UserStatusBadge status={u.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="إجمالي المستخدمين"
          value={overview?.users_total}
          loading={overviewLoading}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="نسبة اكتمال الملف"
          value={
            overview ? `${(overview.profile_completion_rate * 100).toFixed(0)}%` : undefined
          }
          loading={overviewLoading}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          title="اشتراكات نشطة"
          value={overview?.active_subscriptions}
          loading={overviewLoading}
          icon={<Ticket className="h-4 w-4" />}
        />
        <MetricCard
          title="طلبات شراء"
          value={buyRequestsSeries.reduce((s, p) => s + p.value, 0)}
          loading={tsLoading}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
