"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { PiSnapshot } from "@/lib/types";
import { PiDocument } from "@/components/pdf/pi-document";

// @react-pdf/renderer はブラウザ専用のためSSRを無効化して読み込む
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false, loading: () => <ViewerLoading /> }
);
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false }
);

function ViewerLoading() {
  return (
    <div className="card flex h-[70vh] items-center justify-center text-sm text-matcha-700/50">
      🍵 PDFを準備しています…
    </div>
  );
}

const CONFETTI = ["🎉", "🍵", "✨", "🎊", "💚", "🌿", "✨", "🎉", "🍵", "💰", "✨", "🌿"];

export function PiViewer({
  snapshot,
  docNumber,
  celebrate = false,
}: {
  snapshot: PiSnapshot;
  docNumber: string;
  celebrate?: boolean;
}) {
  const doc = <PiDocument data={snapshot} />;
  const confetti = useMemo(
    () =>
      CONFETTI.map((emoji, i) => ({
        emoji,
        left: `${(i * 8.3 + 4) % 100}%`,
        delay: `${(i % 6) * 0.18}s`,
      })),
    []
  );

  return (
    <div className="space-y-4">
      {celebrate && (
        <>
          {confetti.map((c, i) => (
            <span
              key={i}
              className="confetti"
              style={{ left: c.left, animationDelay: c.delay }}
            >
              {c.emoji}
            </span>
          ))}
          <div className="fade-up card border-2 border-matcha-400 bg-gradient-to-r from-matcha-50 to-cream-50 p-5 text-center">
            <p className="text-lg font-extrabold text-matcha-900">
              🎉 {docNumber} を発行しました!
            </p>
            <p className="mt-1 text-sm text-matcha-800/70">
              下のボタンでPDFをダウンロードして、バイヤーにメールで送りましょう。入金が来たら案件画面の緑のボタンへ
            </p>
          </div>
        </>
      )}

      <PDFDownloadLink
        document={doc}
        fileName={`${docNumber}.pdf`}
        className="btn-primary"
      >
        {({ loading }) =>
          loading ? "🍵 PDFを生成中…" : `⬇ ${docNumber}.pdf をダウンロード`
        }
      </PDFDownloadLink>

      <PDFViewer
        className="h-[75vh] w-full rounded-2xl border border-cream-300 shadow-lg"
        showToolbar
      >
        {doc}
      </PDFViewer>
    </div>
  );
}
