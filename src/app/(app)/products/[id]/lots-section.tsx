"use client";

import { useRef, useState, useTransition } from "react";
import { addLotAction, uploadCoaAction } from "../actions";
import { dateJa } from "@/lib/format";
import { HelpTip } from "@/components/help-tip";
import type { ProductLot } from "@/lib/types";

export function LotsSection({
  productId,
  lots,
}: {
  productId: string;
  lots: ProductLot[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function addLot(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await addLotAction(productId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setShowForm(false);
    });
  }

  function uploadCoa(lotId: string, formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await uploadCoaAction(productId, lotId, formData);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <section className="card p-6">
      <h2 className="font-extrabold text-matcha-900">
        🏷 LOT(製造ロット)と検査成績書
        <HelpTip term="LOTとCOA">
          LOT番号は「いつ作ったどの袋か」を追いかける製造番号。COAは農薬・成分などの検査成績書で、特にEU向けはLOTごとに必須と思ってください。ここに登録しておくと、万一のときどのバイヤーに出したか追跡できます。
        </HelpTip>
      </h2>
      <p className="mt-0.5 text-xs text-matcha-700/60">
        製造のたびにLOTを登録し、検査成績書(COA)のPDFを添付します
      </p>

      {lots.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lots.map((lot) => (
            <li
              key={lot.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream-50 px-4 py-3 text-sm"
            >
              <span className="min-w-0">
                <span className="font-extrabold text-matcha-900">
                  {lot.lot_number}
                </span>
                <span className="ml-2 text-xs text-matcha-700/60">
                  製造 {dateJa(lot.production_date)} / 賞味期限{" "}
                  {dateJa(lot.best_before)}
                </span>
                {lot.notes && (
                  <span className="ml-2 text-xs text-matcha-700/50">
                    {lot.notes}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {lot.coa_url ? (
                  <a
                    href={lot.coa_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary !px-3 !py-1.5 !text-xs"
                  >
                    ✅ COAを見る
                  </a>
                ) : (
                  <form action={(fd) => uploadCoa(lot.id, fd)} className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      COA未添付
                    </span>
                    <input
                      name="file" type="file" required
                      className="w-48 text-xs"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button type="submit" disabled={pending} className="btn-secondary !px-3 !py-1.5 !text-xs">
                      ⬆ 添付
                    </button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          ❌ {error}
        </p>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-secondary mt-4">
          ✚ LOTを追加する
        </button>
      ) : (
        <form
          ref={formRef}
          action={addLot}
          className="mt-4 space-y-3 rounded-2xl border-2 border-cream-300 bg-cream-50 p-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs font-bold text-matcha-800">
              LOT番号
              <input name="lot_number" required className="input mt-1" placeholder="例: MN-2026-0412" />
            </label>
            <label className="text-xs font-bold text-matcha-800">
              製造日
              <input name="production_date" type="date" className="input mt-1" />
            </label>
            <label className="text-xs font-bold text-matcha-800">
              賞味期限
              <input name="best_before" type="date" className="input mt-1" />
            </label>
            <label className="text-xs font-bold text-matcha-800">
              メモ
              <input name="notes" className="input mt-1" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "追加中…" : "LOTを追加する"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              やめる
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
