// Shown in place of a photo when a post has no image. Keyed by the Arabic
// interest name the API returns. Covers the deactivated categories too, since
// older posts still reference them.
const CATEGORY_ICONS: Record<string, string> = {
  'لحوم': '🥩',
  'دواجن': '🍗',
  'أسماك': '🐟',
  'ألبان': '🥛',
  'زيوت': '🫒',
  'خضروات': '🥬',
  'فاكهة': '🍎',
  'حبوب': '🌾',
  'توابل': '🧂',
  'تمور': '🌴',
  'مكسرات': '🥜',
  'عصائر': '🧃',
};

const DEFAULT_ICON = '📦';

export function categoryIcon(interestName?: string | null): string {
  if (!interestName) return DEFAULT_ICON;
  return CATEGORY_ICONS[interestName.trim()] ?? DEFAULT_ICON;
}
