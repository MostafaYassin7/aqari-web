export function formatPrice(price: string | number | undefined): string {
  if (!price) return "";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "";
  return num.toLocaleString("ar-SA") + " ريال";
}

export function formatListingType(type: string): string {
  const map: Record<string, string> = {
    sale: "للبيع",
    rent_long: "للإيجار",
    rent_short: "إيجار يومي",
    // legacy aliases
    rent: "للإيجار",
    daily: "إيجار يومي",
  };
  return map[type] ?? type;
}

export function formatPriceShort(price: string | number | undefined): string {
  if (!price) return "";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

export function formatAdNumber(num?: string): string {
  if (!num) return "";
  return num.startsWith("AQ-") ? num : `AQ-${num}`;
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}
