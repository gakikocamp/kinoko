/**
 * Packing List PDFテンプレート(docs/03 §3)。
 * 入力は PlSnapshot のみ。金額は一切記載しない(数量・重量・寸法のみ)。
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { PlSnapshot } from "@/lib/types";
import { s, fmtKg, fmtDate } from "./doc-styles";

export function PlDocument({ data }: { data: PlSnapshot }) {
  return (
    <Document title={data.docNumber}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.bold}>{data.exporter.companyName}</Text>
            <Text>{data.exporter.address}</Text>
          </View>
          <View>
            <Text style={s.title}>PACKING LIST</Text>
            <View style={s.meta}>
              <Text>
                Packing List No: <Text style={s.bold}>{data.docNumber}</Text>
                {data.revision > 0 ? `  Rev.${data.revision}` : ""}
              </Text>
              <Text>Date: {fmtDate(data.issueDate)}</Text>
              {data.refInvoiceNumber && (
                <Text>Ref. Invoice: {data.refInvoiceNumber}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Consignee */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>CONSIGNEE</Text>
            <Text style={s.bold}>{data.consignee.companyName}</Text>
            {data.consignee.address && <Text>{data.consignee.address}</Text>}
            {data.consignee.country && <Text>{data.consignee.country}</Text>}
          </View>
        </View>

        {/* Cartons */}
        <View style={s.table}>
          <View style={s.tr}>
            <Text style={[s.th, { flex: 1 }]}>CARTON NO.</Text>
            <Text style={[s.th, { flex: 3 }]}>PRODUCT / PACKAGING</Text>
            <Text style={[s.th, { flex: 1 }, s.right]}>CARTONS</Text>
            <Text style={[s.th, { flex: 1.1 }, s.right]}>UNITS / CTN</Text>
            <Text style={[s.th, { flex: 1.2 }, s.right]}>N.W. / CTN (kg)</Text>
            <Text style={[s.th, { flex: 1.2 }, s.right]}>G.W. / CTN (kg)</Text>
            <Text style={[s.th, { flex: 1.6, borderRight: 0 }]}>
              DIMENSIONS (cm)
            </Text>
          </View>
          {data.cartons.map((c, i) => (
            <View key={i} style={s.tr}>
              <Text style={[s.td, { flex: 1 }]}>{c.cartonRange ?? i + 1}</Text>
              <View style={[s.td, { flex: 3 }]}>
                <Text>{c.product}</Text>
                {c.packaging && (
                  <Text style={{ color: "#555", fontSize: 8 }}>{c.packaging}</Text>
                )}
              </View>
              <Text style={[s.td, { flex: 1 }, s.right]}>{c.cartonsCount}</Text>
              <Text style={[s.td, { flex: 1.1 }, s.right]}>{c.unitsPerCarton}</Text>
              <Text style={[s.td, { flex: 1.2 }, s.right]}>{fmtKg(c.netWeightKg)}</Text>
              <Text style={[s.td, { flex: 1.2 }, s.right]}>{fmtKg(c.grossWeightKg)}</Text>
              <Text style={[s.td, { flex: 1.6, borderRight: 0 }]}>
                {c.dimensionsCm ?? "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={[s.totals, { width: 280 }]}>
          <View style={s.totalRow}>
            <Text>Total cartons</Text>
            <Text>{data.totals.cartons}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Total units</Text>
            <Text>{data.totals.units}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Total net weight</Text>
            <Text>{fmtKg(data.totals.netWeightKg)} kg</Text>
          </View>
          <View style={[s.totalRow, s.grandTotal]}>
            <Text>Total gross weight</Text>
            <Text>{fmtKg(data.totals.grossWeightKg)} kg</Text>
          </View>
          {data.totals.volumeM3 != null && (
            <View style={s.totalRow}>
              <Text>Total volume</Text>
              <Text>{data.totals.volumeM3} m3</Text>
            </View>
          )}
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
          {data.docNumber} — Packing List (no commercial value stated)
        </Text>
      </Page>
    </Document>
  );
}
