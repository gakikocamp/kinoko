/** 金額表示: "USD 9,430.00" / "JPY 220,000" */
export function money(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "-";
  const digits = currency === "JPY" ? 0 : 2;
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** 日付表示: 2026/07/07 */
export function dateJa(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/** PDF用日付: July 7, 2026 */
export function dateEn(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
