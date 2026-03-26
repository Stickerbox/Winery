import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function groupWinesByMonth<T extends { createdAt: Date | string }>(
    wines: T[],
    locale: string
): { label: string; wines: T[] }[] {
    const buckets = new Map<string, { label: string; wines: T[] }>();

    for (const wine of wines) {
        const date = new Date(wine.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!buckets.has(key)) {
            const label = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
            buckets.set(key, { label, wines: [] });
        }
        buckets.get(key)!.wines.push(wine);
    }

    return Array.from(buckets.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([, group]) => group);
}
