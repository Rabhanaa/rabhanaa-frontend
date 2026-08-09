import { useConfigStore } from '@/stores/config';
import { normalizeEgPhone } from './utils';

// Used when the server hasn't supplied a number yet — /config sits behind auth,
// so logged-out visitors on the landing page never receive one.
export const FALLBACK_SUPPORT_PHONE = '01107286690';

export function useSupportPhone(): string {
  return useConfigStore((s) => s.config?.support_phone) || FALLBACK_SUPPORT_PHONE;
}

export function useWhatsAppUrl(): string {
  return `https://wa.me/${normalizeEgPhone(useSupportPhone())}`;
}
