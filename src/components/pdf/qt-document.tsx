/**
 * 見積書(Quotation)PDFテンプレート。
 * PIと同構造だが、タイトルはQUOTATION、銀行情報は載せない(まだ請求ではない)。
 * 入力は QtSnapshot のみ。
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { QtSnapshot } from "@/lib/types";
import { s, fmt, fmtDate } from "./doc-styles";

export function QtDocument({ data }: { data: QtSnapshot }) {
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
            <Text style={s.title}>QUOTATION</Text>
            <View style={s.meta}>
              <Text>
                Quotation No: <Text style={s.bold}>{data.docNumber}</Text>
                {data.revision > 0 ? `  Rev.${data.revision}` : ""}
              </Text>
              <Text>Date: {fmtDate(data.issueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>TO</Text>
            <Text style={s.bold}>{data.buyer.companyName}</Text>
            {data.buyer.contactPerson && <Text>Attn: {data.buyer.contactPerson}</Text>}
            {data.buyer.billingAddress && <Text>{data.buyer.billingAddress}</Text>}
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>SHIP TO (PLANNED)</Text>
            <Text>{data.shipTo.address ?? data.buyer.billingAddress ?? "-"}</Text>
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
          {data.docNumber} — This quotation is not an invoice. Prices are
          subject to the validity period stated above.
        </Text>
      </Page>
    </Document>
  );
}
