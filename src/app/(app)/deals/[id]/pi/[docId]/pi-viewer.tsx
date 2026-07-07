"use client";

import dynamic from "next/dynamic";
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
    <div className="flex h-[70vh] items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400">
      PDFを準備しています…
    </div>
  );
}

export function PiViewer({
  snapshot,
  docNumber,
}: {
  snapshot: PiSnapshot;
  docNumber: string;
}) {
  const doc = <PiDocument data={snapshot} />;
  return (
    <div className="space-y-3">
      <PDFDownloadLink
        document={doc}
        fileName={`${docNumber}.pdf`}
        className="inline-block rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
      >
        {({ loading }) =>
          loading ? "PDFを生成中…" : `⬇ ${docNumber}.pdf をダウンロード`
        }
      </PDFDownloadLink>
      <PDFViewer className="h-[75vh] w-full rounded-xl border border-gray-200" showToolbar>
        {doc}
      </PDFViewer>
    </div>
  );
}
