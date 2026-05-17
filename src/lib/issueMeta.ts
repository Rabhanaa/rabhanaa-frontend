export const ISSUE_CATEGORIES = ['inquiry', 'support', 'problem', 'suggestion'] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
export const CATEGORY_LABELS_AR: Record<IssueCategory, string> = {
  inquiry: 'استفسار',
  support: 'دعم فني',
  problem: 'مشكلة',
  suggestion: 'اقتراح',
};

export const ISSUE_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];
export const PRIORITY_LABELS_AR: Record<IssuePriority, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'مرتفعة',
  urgent: 'عاجلة',
};

export const PRIORITY_COLOR: Record<IssuePriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

export const CATEGORY_COLOR: Record<IssueCategory, string> = {
  inquiry: 'bg-slate-50 text-slate-700',
  support: 'bg-emerald-50 text-emerald-700',
  problem: 'bg-orange-50 text-orange-700',
  suggestion: 'bg-violet-50 text-violet-700',
};
