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
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">
          ⚠️ 入金の着金を確認しましたか?
        </p>
        <p className="mt-1 text-xs text-amber-800">
          この事業は100%前払いが条件です。着金確認前に加工・出荷を始めないでください。
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={advance}
            disabled={pending}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {pending ? "更新中…" : "着金を確認済み — 進める"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            まだ確認していない
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <p className="text-xs text-gray-500">
        ▶ 次のアクション(次の状態: {statusLabel(to)})
      </p>
      <button
        onClick={() => (needsPaymentConfirm ? setConfirming(true) : advance())}
        disabled={pending}
        className="mt-2 rounded-md bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
      >
        {pending ? "更新中…" : label}
      </button>
    </div>
  );
}
