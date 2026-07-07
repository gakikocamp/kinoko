"use client";

import { useState } from "react";

/**
 * 用語ヘルプ(docs/06 §2-5)。「?」を押すと、やさしい日本語の説明がその場に出る。
 * 使い方: <HelpTip term="EORI番号">EUの輸入者が持つ通関用の番号です…</HelpTip>
 */
export function HelpTip({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        aria-label={`${term}とは?`}
        onClick={() => setOpen((v) => !v)}
        className={`ml-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-[11px] font-bold transition ${
          open
            ? "bg-matcha-600 text-white"
            : "bg-cream-200 text-matcha-700/70 hover:bg-matcha-200"
        }`}
      >
        ?
      </button>
      {open && (
        <>
          {/* 外側クリックで閉じる */}
          <span
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <span className="card fade-up absolute left-0 top-6 z-20 block w-72 p-3.5 text-left shadow-xl">
            <span className="block text-xs font-extrabold text-matcha-900">
              💡 {term}とは?
            </span>
            <span className="mt-1 block text-xs font-normal leading-relaxed text-matcha-800/80">
              {children}
            </span>
          </span>
        </>
      )}
    </span>
  );
}
