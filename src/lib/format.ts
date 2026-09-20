export function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Date not on file";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fullAddress(line1: string, city: string, state: string, zip: string): string {
  return `${line1}, ${city}, ${state} ${zip}`;
}
