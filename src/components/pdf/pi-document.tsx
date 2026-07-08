/**
 * Proforma Invoice PDFテンプレート(docs/03 §1)。
 * 入力は PiSnapshot(発行時スナップショット)のみ。DBを直接参照しない。
 * ブラウザ(発行画面)とNode(検証スクリプト)の両方で使える純粋コンポーネント。
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PiSnapshot } from "@/lib/types";

const s = StyleSheet.create({
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
  section: { marginTop: 14 },
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
  totals: { marginTop: 0, alignSelf: "flex-end", width: 220 },
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

function fmt(n: number, currency: string): string {
  const digits = currency === "JPY" ? 0 : 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function PiDocument({ data }: { data: PiSnapshot }) {
  const cur = data.terms.currency;
  return (
    <Document title={data.docNumber}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.bold}>{data.exporter.companyName}</Text>
            <Text>{data.exporter.address}</Text>
            {data.exporter.phone && <Text>Tel: {data.exporter.phone}</Text>}
            {data.exporter.email && <Text>Email: {data.exporter.email}</Text>}
          </View>
          <View>
            <Text style={s.title}>PROFORMA INVOICE</Text>
            <View style={s.meta}>
              <Text>
                PI No: <Text style={s.bold}>{data.docNumber}</Text>
                {data.revision > 0 ? `  Rev.${data.revision}` : ""}
              </Text>
              <Text>Issue date: {fmtDate(data.issueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>BUYER / CONSIGNEE</Text>
            <Text style={s.bold}>{data.buyer.companyName}</Text>
            {data.buyer.contactPerson && <Text>Attn: {data.buyer.contactPerson}</Text>}
            {data.buyer.billingAddress && <Text>{data.buyer.billingAddress}</Text>}
            {data.buyer.vatNumber && <Text>VAT No: {data.buyer.vatNumber}</Text>}
            {data.buyer.eoriNumber && <Text>EORI No: {data.buyer.eoriNumber}</Text>}
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>SHIP TO</Text>
            <Text>
              {data.shipTo.address ?? data.buyer.billingAddress ?? "-"}
            </Text>
          </View>
        </View>

        {/* Terms bar */}
        <View style={s.termsRow}>
          <View style={s.termCell}>
            <Text style={s.termLabel}>CURRENCY</Text>
            <Text>{cur}</Text>
          </View>
          <View style={s.termCell}>
            <Text style={s.termLabel}>COUNTRY OF ORIGIN</Text>
            <Text>{data.terms.countryOfOrigin}</Text>
          </View>
          <View style={s.termCell}>
            <Text style={s.termLabel}>INCOTERMS (2020)</Text>
            <Text>{data.terms.incoterms ?? "-"}</Text>
          </View>
          <View style={s.termCellLast}>
            <Text style={s.termLabel}>PAYMENT TERMS</Text>
            <Text>{data.terms.paymentTerms ?? "-"}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={s.table}>
          <View style={s.tr}>
            <Text style={[s.th, { flex: 0.5 }]}>No.</Text>
            <Text style={[s.th, { flex: 4 }]}>DESCRIPTION</Text>
            <Text style={[s.th, { flex: 1.2 }]}>HS CODE</Text>
            <Text style={[s.th, { flex: 1.2 }, s.right]}>QTY</Text>
            <Text style={[s.th, { flex: 1.3 }, s.right]}>UNIT PRICE</Text>
            <Text style={[s.th, { flex: 1.4, borderRight: 0 }, s.right]}>AMOUNT</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.tr}>
              <Text style={[s.td, { flex: 0.5 }]}>{i + 1}</Text>
              <View style={[s.td, { flex: 4 }]}>
                <Text>{item.description}</Text>
                {item.origin && (
                  <Text style={{ color: "#555", fontSize: 8 }}>
                    Origin: {item.origin}
                  </Text>
                )}
              </View>
              <Text style={[s.td, { flex: 1.2 }]}>{item.hsCode ?? "-"}</Text>
              <Text style={[s.td, { flex: 1.2 }, s.right]}>
                {item.quantity} {item.unit}
              </Text>
              <Text style={[s.td, { flex: 1.3 }, s.right]}>
                {fmt(item.unitPrice, cur)}
              </Text>
              <Text style={[s.td, { flex: 1.4, borderRight: 0 }, s.right]}>
                {fmt(item.amount, cur)}
              </Text>
            </View>
          ))}
          {data.fees.packagingFee && (
            <View style={s.tr}>
              <Text style={[s.td, { flex: 0.5 }]}>{data.items.length + 1}</Text>
              <View style={[s.td, { flex: 4 }]}>
                <Text style={s.bold}>{data.fees.packagingFee.title}</Text>
                {data.fees.packagingFee.description && (
                  <Text style={{ color: "#333", fontSize: 8 }}>
                    {data.fees.packagingFee.description}
                  </Text>
                )}
              </View>
              <Text style={[s.td, { flex: 1.2 }]}>-</Text>
              <Text style={[s.td, { flex: 1.2 }, s.right]}>1</Text>
              <Text style={[s.td, { flex: 1.3 }, s.right]}>
                {fmt(data.fees.packagingFee.amount, cur)}
              </Text>
              <Text style={[s.td, { flex: 1.4, borderRight: 0 }, s.right]}>
                {fmt(data.fees.packagingFee.amount, cur)}
              </Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>
              {cur} {fmt(data.totals.subtotal, cur)}
            </Text>
          </View>
          <View style={s.totalRow}>
            <Text>Shipping fee</Text>
            <Text>
              {cur} {fmt(data.fees.shippingFee, cur)}
            </Text>
          </View>
          <View style={[s.totalRow, s.grandTotal]}>
            <Text>TOTAL</Text>
            <Text>
              {cur} {fmt(data.totals.total, cur)}
            </Text>
          </View>
        </View>

        {/* Bank details */}
        {(data.bank.bankDetails || data.bank.wiseDetails) && (
          <View style={s.noteBox}>
            <Text style={s.partyLabel}>BANK DETAILS / WISE</Text>
            {data.bank.bankDetails && <Text>{data.bank.bankDetails}</Text>}
            {data.bank.wiseDetails && (
              <Text style={{ marginTop: 3 }}>{data.bank.wiseDetails}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={s.noteBox}>
            <Text style={s.partyLabel}>NOTES</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={s.signArea}>
          <View style={s.signLine} />
          <Text style={{ textAlign: "center" }}>
            Authorized signature
            {data.signature.name ? ` — ${data.signature.name}` : ""}
          </Text>
        </View>

        <Text style={s.footer} fixed>
          {data.docNumber} — This proforma invoice is issued for advance
          payment purposes.
        </Text>
      </Page>
    </Document>
  );
}
