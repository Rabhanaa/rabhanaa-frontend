import { api } from './api';

export type Granularity = 'day' | 'week' | 'month';
export type MetricKey =
  | 'new_users'
  | 'failed_logins'
  | 'bids'
  | 'closed_auctions'
  | 'orders'
  | 'buy_requests'
  | 'issues';

export interface TimeSeriesPoint {
  bucket: string;
  value: number;
}

export interface TierCount {
  tier_name: string;
  display_name_en: string;
  count: number;
}

export interface OverviewSummary {
  active_sessions: number;
  profile_completion_rate: number;
  users_total: number;
  users_new_in_range: number;
  active_subscriptions: number;
  subscriptions_by_tier: TierCount[];
  orders_in_range: number;
  gmv_in_range: string;
  open_issues: number;
}

export interface SubscriptionStats {
  active_by_tier: TierCount[];
  inactive_total: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface SourceDayPoint {
  bucket: string;
  source: string;
  value: number;
}

export interface IssueSummary {
  total: number;
  resolved: number;
  unresolved: number;
}

export interface InterestCount {
  id: number;
  name_ar: string;
  name_en: string;
  count: number;
}

export interface InterestUser {
  public_id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
}

function toRFC3339(d: Date): string {
  return d.toISOString();
}

export const adminAnalytics = {
  overview: (from: Date, to: Date) =>
    api.get<OverviewSummary>(
      `/admin/analytics/overview?from=${toRFC3339(from)}&to=${toRFC3339(to)}`
    ),

  timeseries: (
    metric: MetricKey,
    from: Date,
    to: Date,
    granularity: Granularity = 'day'
  ) =>
    api.get<TimeSeriesPoint[]>(
      `/admin/analytics/timeseries?metric=${metric}&from=${toRFC3339(from)}&to=${toRFC3339(to)}&granularity=${granularity}`
    ),

  statusDistribution: () =>
    api.get<StatusCount[]>('/admin/analytics/users/status-distribution'),

  usersSourceDistribution: (from: Date, to: Date) =>
    api.get<SourceCount[]>(
      `/admin/analytics/users/source-distribution?from=${toRFC3339(from)}&to=${toRFC3339(to)}`
    ),

  usersSourceByDay: (from: Date, to: Date) =>
    api.get<SourceDayPoint[]>(
      `/admin/analytics/users/source-by-day?from=${toRFC3339(from)}&to=${toRFC3339(to)}`
    ),

  issuesBreakdown: (from: Date, to: Date) =>
    api.get<IssueSummary>(
      `/admin/analytics/issues/breakdown?from=${toRFC3339(from)}&to=${toRFC3339(to)}`
    ),

  subscriptionStats: () =>
    api.get<SubscriptionStats>('/admin/analytics/subscriptions/stats'),

  usersByInterest: () =>
    api.get<InterestCount[]>('/admin/analytics/users/by-interest'),

  usersForInterest: (interestId: number) =>
    api.get<InterestUser[]>(`/admin/analytics/users/by-interest/${interestId}`),
};
