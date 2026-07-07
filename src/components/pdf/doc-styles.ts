/** PI/CI/PL 共通のPDFスタイルとフォーマッタ(docs/03 共通仕様) */
import { StyleSheet } from "@react-pdf/renderer";

export const s = StyleSheet.create({
  page: {
    padding: 42,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111",
    lineHeight: 1.45,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  meta: { marginTop: 10, textAlign: "right" },
  partiesRow: { flexDirection: "row", gap: 16, marginTop: 14 },
  partyBox: {
    flex: 1,
    border: "1 solid #999",
    padding: 8,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  termsRow: {
    flexDirection: "row",
    marginTop: 14,
    border: "1 solid #999",
  },
  termCell: { flex: 1, padding: 6, borderRight: "1 solid #999" },
  termCellLast: { flex: 1, padding: 6 },
  termLabel: { fontSize: 6.5, color: "#555", marginBottom: 2 },
  table: { marginTop: 14, border: "1 solid #999" },
  tr: { flexDirection: "row", borderBottom: "1 solid #ccc" },
  th: {
    padding: 5,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f0f0f0",
    borderRight: "1 solid #ccc",
  },
  td: { padding: 5, borderRight: "1 solid #ccc" },
  right: { textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 220 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  grandTotal: {
    borderTop: "1.5 solid #111",
    marginTop: 2,
    paddingTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  noteBox: { border: "1 solid #999", padding: 8, marginTop: 14 },
  signArea: {
    marginTop: 28,
    alignSelf: "flex-end",
    width: 220,
  },
  signLine: {
    borderBottom: "1 solid #111",
    height: 34,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    fontSize: 7,
    color: "#777",
    textAlign: "center",
  },
});

export function fmt(n: number, currency: string): string {
  const digits = currency === "JPY" ? 0 : 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtKg(n: number | null): string {
  if (n == null) return "-";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
