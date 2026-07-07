"use client";

import { useState, useTransition } from "react";
import { advanceDealStatusAction } from "../actions";
import { nextActionLabel, nextStatus, statusLabel } from "@/lib/status";
import type { DealStatus } from "@/lib/types";

/**
 * 「次のアクション」ボタン(docs/06 §4.2)。
 * 入金確認(→paid)へ進むときはソフトガードの確認を挟む(docs/05 §5)。
 */
export function NextActionButton({
  dealId,
  status,
}: {
  dealId: string;
  status: DealStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const to = nextStatus(status);
  const label = nextActionLabel(status);
  if (!to || !label) return null;

  const needsPaymentConfirm = to === "paid";

  function advance() {
    startTransition(async () => {
      await advanceDealStatusAction(dealId, to!);
      setConfirming(false);
    });
  }

  if (confirming && needsPaymentConfirm) {
    return (
      <div className="card border-2 border-gold-400/60 bg-gradient-to-br from-white to-cream-50 p-5">
        <p className="font-extrabold text-matcha-900">
          ⚠️ 入金の着金は確認しましたか?
        </p>
        <p className="mt-1 text-sm text-matcha-800/70">
          この事業は100%前払いが条件です。着金を確認する前に加工・出荷を始めないでください。
        </p>
        <div className="mt-4 flex gap-3">
          <button onClick={advance} disabled={pending} className="btn-primary">
            {pending ? "更新中…" : "💰 着金を確認済み — 進める"}
          </button>
          <button onClick={() => setConfirming(false)} className="btn-secondary">
            まだ確認していない
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between gap-4 border-2 border-matcha-300 bg-gradient-to-r from-matcha-50 to-cream-50 p-5">
      <div>
        <p className="text-xs font-bold text-matcha-600">▶ 次にやること</p>
        <p className="mt-0.5 text-sm text-matcha-800/70">
          このボタンを押すと「{statusLabel(to)}」に進みます
        </p>
      </div>
      <button
        onClick={() => (needsPaymentConfirm ? setConfirming(true) : advance())}
        disabled={pending}
        className="btn-primary shrink-0 !px-7 !py-3 !text-base"
      >
        {pending ? "更新中…" : `${label} →`}
      </button>
    </div>
  );
}
