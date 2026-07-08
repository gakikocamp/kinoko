import { COUNTRY_STATUS_META, statusLabel, statusStage } from "@/lib/status";
import type { Country, DealStatus } from "@/lib/types";

export function CountryBadge({ country }: { country: Country | null }) {
  if (!country) return <span className="text-matcha-700/40">-</span>;
  const meta = COUNTRY_STATUS_META[country.status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}
      title={country.summary ?? undefined}
    >
      {meta.icon} {country.name_ja}・{meta.label}
    </span>
  );
}

const STAGE_STYLE: Record<number, string> = {
  0: "bg-gray-100 text-gray-500",
  1: "bg-sky-100 text-sky-800",
  2: "bg-indigo-100 text-indigo-800",
  3: "bg-amber-100 text-amber-800",
  4: "bg-emerald-100 text-emerald-800",
  5: "bg-cream-200 text-matcha-800",
};

const STAGE_ICON: Record<number, string> = {
  0: "🚫",
  1: "💬",
  2: "📄",
  3: "💰",
  4: "📦",
  5: "✅",
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  const stage = statusStage(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${STAGE_STYLE[stage]}`}
    >
      {STAGE_ICON[stage]} {statusLabel(status)}
    </span>
  );
}

/** 🔒 社内のみ表示のバッジ(docs/06 §5) */
export function InternalOnlyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-matcha-900 px-2 py-0.5 text-[10px] font-bold text-white">
      🔒 社内のみ
    </span>
  );
}
