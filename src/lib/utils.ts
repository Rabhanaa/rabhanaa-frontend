import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Money arrives from the API as a decimal string ("190.75"). Render it with
// thousands separators and at most 2 decimals, keeping Western digits so it
// matches how amounts are displayed elsewhere in the app.
export function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// Egyptian E.164: prepend +20 unless the number already carries it.
export function normalizeEgPhone(phone: string): string {
  const t = phone.trim();
  if (t.startsWith("+20")) return t;
  if (t.startsWith("20")) return `+${t}`;
  if (t.startsWith("0")) return `+20${t.slice(1)}`;
  return `+20${t}`;
}
