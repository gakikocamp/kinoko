"use client";

import { useRef, useState, useTransition } from "react";
import { uploadDealFileAction, deleteDealFileAction } from "../actions";
import { dateJa } from "@/lib/format";
import type { FileCategory, StoredFile } from "@/lib/types";

const CATEGORY_LABEL: Record<FileCategory, string> = {
  pi_pdf: "請求書PDF",
  ci_pdf: "通関インボイスPDF",
  pl_pdf: "梱包リストPDF",
  coa: "検査成績書(COA)",
  product_label: "商品ラベル",
  payment_proof: "入金証憑",
  shipping_receipt: "発送伝票",
  tracking_doc: "追跡書類",
  qc_photo: "QC写真(検品)",
  other: "その他",
};

const UPLOADABLE: FileCategory[] = [
  "payment_proof", "coa", "product_label",
  "shipping_receipt", "tracking_doc", "qc_photo", "other",
];

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

export function FilesSection({
  dealId,
  files,
}: {
  dealId: string;
  files: StoredFile[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function upload(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await uploadDealFileAction(dealId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  function remove(fileId: string) {
    startTransition(async () => {
      await deleteDealFileAction(dealId, fileId);
      setConfirmDelete(null);
    });
  }

  return (
    <section className="card p-6">
      <h2 className="font-extrabold text-matcha-900">📎 ファイル</h2>
      <p className="mt-0.5 text-xs text-matcha-700/60">
        入金証憑・COA・ラベルデータ・QC写真など、この案件の証拠をぜんぶここに集めます
      </p>

      <form
        ref={formRef}
        action={upload}
        className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 p-4"
      >
        <label className="text-xs font-bold text-matcha-800">
          種類
          <select name="category" required className="input mt-1 min-w-44">
            {UPLOADABLE.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-xs font-bold text-matcha-800">
          ファイル(20MBまで)
          <input name="file" type="file" required className="input mt-1" />
        </label>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "アップロード中…" : "⬆ アップロード"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          ❌ {error}
        </p>
      )}

      {files.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-cream-50 px-4 py-2.5 text-sm"
            >
              <span className="min-w-0">
                <span className="mr-2 rounded-full bg-matcha-100 px-2 py-0.5 text-[10px] font-bold text-matcha-800">
                  {CATEGORY_LABEL[f.category]}
                </span>
                <span className="font-bold text-matcha-900">{f.file_name}</span>
                <span className="ml-2 text-xs text-matcha-700/50">
                  {formatSize(f.size_bytes)} ・ {dateJa(f.created_at)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {f.url && (
                  <a
                    href={f.url}
                    download={f.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary !px-3 !py-1.5 !text-xs"
                  >
                    開く
                  </a>
                )}
                {confirmDelete === f.id ? (
                  <>
                    <button
                      onClick={() => remove(f.id)}
                      disabled={pending}
                      className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                    >
                      本当に削除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-matcha-700/60 underline"
                    >
                      やめる
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(f.id)}
                    className="text-xs text-matcha-700/40 hover:text-red-500"
                    aria-label={`${f.file_name} を削除`}
                  >
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-center text-sm text-matcha-700/40">
          まだファイルがありません
        </p>
      )}
    </section>
  );
}
