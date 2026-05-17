import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Egyptian E.164: prepend +20 unless the number already carries it.
export function normalizeEgPhone(phone: string): string {
  const t = phone.trim();
  if (t.startsWith("+20")) return t;
  if (t.startsWith("20")) return `+${t}`;
  if (t.startsWith("0")) return `+20${t.slice(1)}`;
  return `+20${t}`;
}
