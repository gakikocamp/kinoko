import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { dateJa } from "@/lib/format";
import { PiViewer } from "./pi-viewer";

export const dynamic = "force-dynamic";

export default async function PiViewPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const doc = await repo.getDocument(docId);
  if (!doc || doc.deal_id !== id) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            📄 {doc.doc_number}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            発行日 {dateJa(doc.issue_date)} — この書類は発行済みのため変更できません
          </p>
        </div>
        <Link
          href={`/deals/${id}`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← 案件に戻る
        </Link>
      </div>
      <PiViewer snapshot={doc.data} docNumber={doc.doc_number} />
    </div>
  );
}
