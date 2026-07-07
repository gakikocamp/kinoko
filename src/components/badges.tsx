import { COUNTRY_STATUS_META, statusLabel, statusStage } from "@/lib/status";
import type { Country, DealStatus } from "@/lib/types";

export function CountryBadge({ country }: { country: Country | null }) {
  if (!country) return <span className="text-gray-400">-</span>;
  const meta = COUNTRY_STATUS_META[country.status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}
      title={country.summary ?? undefined}
    >
      {meta.icon} {country.name_ja} · {meta.label}
    </span>
  );
}

const STAGE_COLORS: Record<number, string> = {
  0: "bg-gray-100 text-gray-500",
  1: "bg-sky-100 text-sky-800",
  2: "bg-indigo-100 text-indigo-800",
  3: "bg-amber-100 text-amber-800",
  4: "bg-emerald-100 text-emerald-800",
  5: "bg-gray-200 text-gray-700",
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[statusStage(status)]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

/** 🔒 社内のみ表示のバッジ(docs/06 §5) */
export function InternalOnlyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      🔒 社内のみ
    </span>
  );
}
