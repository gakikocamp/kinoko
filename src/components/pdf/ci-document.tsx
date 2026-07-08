/**
 * Commercial Invoice PDFテンプレート(docs/03 §2)。
 * 入力は CiSnapshot のみ。銀行情報は載せない。通関書類として
 * Reason for export / HS code / 原産国 / 発送方法・追跡番号を明記する。
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { CiSnapshot } from "@/lib/types";
import { s, fmt, fmtDate } from "./doc-styles";

export function CiDocument({ data }: { data: CiSnapshot }) {
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
            <Text style={s.title}>COMMERCIAL INVOICE</Text>
            <View style={s.meta}>
              <Text>
                Invoice No: <Text style={s.bold}>{data.docNumber}</Text>
                {data.revision > 0 ? `  Rev.${data.revision}` : ""}
              </Text>
              <Text>Date: {fmtDate(data.issueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>CONSIGNEE</Text>
            <Text style={s.bold}>{data.buyer.companyName}</Text>
            {data.buyer.contactPerson && <Text>Attn: {data.buyer.contactPerson}</Text>}
            {data.buyer.billingAddress && <Text>{data.buyer.billingAddress}</Text>}
            {data.buyer.vatNumber && <Text>VAT No: {data.buyer.vatNumber}</Text>}
            {data.buyer.eoriNumber && <Text>EORI No: {data.buyer.eoriNumber}</Text>}
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>SHIP TO</Text>
            <Text>{data.shipTo.address ?? data.buyer.billingAddress ?? "-"}</Text>
          </View>
        </View>

        {/* Shipping bar */}
        <View style={s.termsRow}>
          <View style={s.termCell}>
            <Text style={s.termLabel}>REASON FOR EXPORT</Text>
            <Text>{data.shipping.reasonForExport}</Text>
          </View>
          <View style={s.termCell}>
            <Text style={s.termLabel}>INCOTERMS (2020)</Text>
            <Text>{data.terms.incoterms ?? "-"}</Text>
          </View>
          <View style={s.termCell}>
            <Text style={s.termLabel}>SHIPPING METHOD</Text>
            <Text>{data.shipping.method ?? "-"}</Text>
          </View>
          <View style={s.termCellLast}>
            <Text style={s.termLabel}>TRACKING NUMBER</Text>
            <Text>{data.shipping.trackingNumber ?? "-"}</Text>
          </View>
        </View>
        <View style={[s.termsRow, { marginTop: 0, borderTop: 0 }]}>
          <View style={s.termCell}>
            <Text style={s.termLabel}>CURRENCY</Text>
            <Text>{cur}</Text>
          </View>
          <View style={s.termCellLast}>
            <Text style={s.termLabel}>COUNTRY OF ORIGIN</Text>
            <Text>{data.terms.countryOfOrigin}</Text>
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

        {/* Declaration / Notes */}
        {data.notes && (
          <View style={s.noteBox}>
            <Text style={s.partyLabel}>DECLARATION / NOTES</Text>
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
          {data.docNumber} — Commercial Invoice
        </Text>
      </Page>
    </Document>
  );
}
