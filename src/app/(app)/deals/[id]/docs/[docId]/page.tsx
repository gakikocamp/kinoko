import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { dateJa } from "@/lib/format";
import { DocViewer } from "./doc-viewer";

export const dynamic = "force-dynamic";

const DOC_LABEL = {
  proforma_invoice: "Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
} as const;

export default async function DocViewPage({
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
            <span className="ml-2 text-sm font-bold text-matcha-700/60">
              {DOC_LABEL[doc.doc_type]}
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-matcha-700/60">
            発行日 {dateJa(doc.issue_date)} — この書類は発行済みのため変更できません
          </p>
        </div>
        <Link href={`/deals/${id}`} className="btn-secondary">
          ← 案件に戻る
        </Link>
      </div>
      <DocViewer
        snapshot={doc.data}
        docNumber={doc.doc_number}
        celebrate={issued === "1"}
      />
    </div>
  );
}
