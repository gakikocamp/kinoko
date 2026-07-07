import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { dateJa } from "@/lib/format";
import { PiViewer } from "./pi-viewer";

export const dynamic = "force-dynamic";

export default async function PiViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; docId: string }>;
  searchParams: Promise<{ issued?: string }>;
}) {
  const [{ id, docId }, { issued }] = await Promise.all([params, searchParams]);
  const doc = await repo.getDocument(docId);
  if (!doc || doc.deal_id !== id) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="fade-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-matcha-900">
            📄 {doc.doc_number}
          </h1>
          <p className="mt-0.5 text-sm text-matcha-700/60">
            発行日 {dateJa(doc.issue_date)} — この書類は発行済みのため変更できません
          </p>
        </div>
        <Link href={`/deals/${id}`} className="btn-secondary">
          ← 案件に戻る
        </Link>
      </div>
      <PiViewer
        snapshot={doc.data}
        docNumber={doc.doc_number}
        celebrate={issued === "1"}
      />
    </div>
  );
}
