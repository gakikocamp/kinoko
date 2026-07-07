"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issuePlAction, type CartonRowInput } from "../../../actions";

const EMPTY_ROW: CartonRowInput = {
  cartonRange: null,
  cartonsCount: 1,
  unitsPerCarton: 0,
  netWeightKg: null,
  grossWeightKg: null,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
};

export function PlIssueForm({
  dealId,
  initialRows,
  dealQuantity,
}: {
  dealId: string;
  initialRows: CartonRowInput[];
  dealQuantity: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CartonRowInput[]>(
    initialRows.length > 0 ? initialRows : [{ ...EMPTY_ROW }]
  );
  const [notes, setNotes] = useState(
    "Keep away from moisture, heat and direct sunlight."
  );

  function update(i: number, patch: Partial<CartonRowInput>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  // 合計はすべて自動計算(docs/06 §5: 手計算させない)
  const totals = rows.reduce(
    (acc, r) => {
      acc.cartons += r.cartonsCount || 0;
      acc.units += (r.cartonsCount || 0) * (r.unitsPerCarton || 0);
      acc.net += (r.netWeightKg ?? 0) * (r.cartonsCount || 0);
      acc.gross += (r.grossWeightKg ?? 0) * (r.cartonsCount || 0);
      if (r.lengthCm && r.widthCm && r.heightCm) {
        acc.volume +=
          (r.lengthCm * r.widthCm * r.heightCm * (r.cartonsCount || 0)) / 1e6;
      }
      return acc;
    },
    { cartons: 0, units: 0, net: 0, gross: 0, volume: 0 }
  );

  // 書類間の数量整合チェック(docs/05 §1)
  const quantityMismatch =
    dealQuantity > 0 && totals.units > 0 && totals.units !== dealQuantity;

  function issue() {
    startTransition(async () => {
      setError(null);
      const result = await issuePlAction(dealId, {
        cartons: rows.filter((r) => r.cartonsCount > 0 && r.unitsPerCarton > 0),
        notes: notes.trim() || null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/deals/${dealId}/docs/${result.docId}?issued=1`);
    });
  }

  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <div className="space-y-6">
      {/* Step 1: カートン明細 */}
      <section className="fade-up-1 card p-6">
        <h2 className="font-extrabold text-matcha-900">
          Step 1. カートン(箱)の明細
        </h2>
        <p className="mt-1 text-xs text-matcha-700/50">
          「同じ仕様の箱」を1行にまとめて入力します(例: 20袋入りの箱が10箱 → 1行)。重量は1箱あたりです
        </p>

        <div className="mt-4 space-y-4">
          {rows.map((r, i) => (
            <div key={i} className="rounded-2xl border-2 border-cream-300 bg-cream-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-matcha-800">
                  📦 明細 {i + 1}
                </p>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                    className="text-xs font-bold text-red-400 hover:text-red-600"
                  >
                    ✕ この行を削除
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="text-xs font-bold text-matcha-800">
                  カートン番号
                  <input
                    value={r.cartonRange ?? ""}
                    onChange={(e) => update(i, { cartonRange: e.target.value || null })}
                    className="input mt-1"
                    placeholder="例: 1-10"
                  />
                </label>
                <label className="text-xs font-bold text-matcha-800">
                  箱数
                  <input
                    type="number" min={1}
                    value={r.cartonsCount || ""}
                    onChange={(e) => update(i, { cartonsCount: Number(e.target.value) })}
                    className="input mt-1"
                  />
                </label>
                <label className="text-xs font-bold text-matcha-800">
                  1箱あたり入数
                  <input
                    type="number" min={1}
                    value={r.unitsPerCarton || ""}
                    onChange={(e) => update(i, { unitsPerCarton: Number(e.target.value) })}
                    className="input mt-1"
                  />
                </label>
                <div />
                <label className="text-xs font-bold text-matcha-800">
                  純重量 N.W.(kg/箱)
                  <input
                    type="number" step="0.001" min={0}
                    value={r.netWeightKg ?? ""}
                    onChange={(e) => update(i, { netWeightKg: num(e.target.value) })}
                    className="input mt-1"
                  />
                </label>
                <label className="text-xs font-bold text-matcha-800">
                  総重量 G.W.(kg/箱)
                  <input
                    type="number" step="0.001" min={0}
                    value={r.grossWeightKg ?? ""}
                    onChange={(e) => update(i, { grossWeightKg: num(e.target.value) })}
                    className="input mt-1"
                  />
                </label>
                <label className="text-xs font-bold text-matcha-800">
                  寸法 縦×横×高(cm)
                  <span className="mt-1 flex items-center gap-1">
                    <input type="number" step="0.1" min={0} value={r.lengthCm ?? ""}
                      onChange={(e) => update(i, { lengthCm: num(e.target.value) })}
                      className="input" placeholder="40" />
                    ×
                    <input type="number" step="0.1" min={0} value={r.widthCm ?? ""}
                      onChange={(e) => update(i, { widthCm: num(e.target.value) })}
                      className="input" placeholder="30" />
                    ×
                    <input type="number" step="0.1" min={0} value={r.heightCm ?? ""}
                      onChange={(e) => update(i, { heightCm: num(e.target.value) })}
                      className="input" placeholder="25" />
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((p) => [...p, { ...EMPTY_ROW }])}
          className="btn-secondary mt-4"
        >
          ✚ 行を追加する
        </button>
      </section>

      {/* Step 2: 合計(自動計算) */}
      <section className="fade-up-2 card border-2 border-matcha-300 bg-gradient-to-br from-matcha-50 to-cream-50 p-6">
        <h2 className="font-extrabold text-matcha-900">
          Step 2. 合計(自動計算)
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          {[
            ["総箱数", `${totals.cartons} 箱`],
            ["総数量", `${totals.units} 個`],
            ["総純重量", `${Math.round(totals.net * 1000) / 1000} kg`],
            ["総総重量", `${Math.round(totals.gross * 1000) / 1000} kg`],
            ["容積", totals.volume > 0 ? `${Math.round(totals.volume * 1000) / 1000} m³` : "-"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-3 text-center">
              <dt className="text-xs text-matcha-700/60">{label}</dt>
              <dd className="mt-0.5 font-extrabold text-matcha-900">{value}</dd>
            </div>
          ))}
        </dl>
        {quantityMismatch && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            ⚠️ 総数量({totals.units}個)が案件の数量({dealQuantity}個)と一致していません。
            書類間の数量不一致は通関遅延の原因になります。意図的な場合以外は入数・箱数を確認してください
          </p>
        )}
        <div className="mt-4">
          <label className="block text-sm font-bold text-matcha-800">
            Notes(英語・任意)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input mt-1"
          />
        </div>
      </section>

      {/* Step 3: 発行 */}
      <section className="fade-up-3 card p-6">
        <h2 className="font-extrabold text-matcha-900">Step 3. 発行</h2>
        <p className="mt-1 text-xs text-matcha-700/60">
          発行するとPL番号が確定し、記載内容が保存されます。発行済みのCIがあれば参照番号として自動記載されます
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            ❌ {error}
          </p>
        )}
        <button
          onClick={issue}
          disabled={pending || totals.cartons === 0 || totals.units === 0}
          className="btn-primary mt-4 !px-7 !py-3 !text-base"
        >
          {pending ? "発行中…" : "Packing Listを発行する(番号を確定)"}
        </button>
      </section>
    </div>
  );
}
