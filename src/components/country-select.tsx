"use client";

import { useState } from "react";
import { COUNTRY_STATUS_META } from "@/lib/status";
import type { Country } from "@/lib/types";

/**
 * 国セレクト+輸出可否バッジ(docs/06 §4.4)。
 * 選択と同時に 🟢🟡🔴⚪ と要件サマリを表示する。
 */
export function CountrySelect({
  countries,
  name,
  defaultValue,
  required,
}: {
  countries: Country[];
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  const [code, setCode] = useState(defaultValue ?? "");
  const selected = countries.find((c) => c.code === code) ?? null;
  const meta = selected ? COUNTRY_STATUS_META[selected.status] : null;

  return (
    <div>
      <select
        name={name}
        value={code}
        required={required}
        onChange={(e) => setCode(e.target.value)}
        className="input"
      >
        <option value="">選択してください</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {COUNTRY_STATUS_META[c.status].icon} {c.name_ja} ({c.name_en})
          </option>
        ))}
      </select>

      {selected && meta && (
        <div
          className={`mt-1.5 rounded-md px-2.5 py-1.5 text-xs ${meta.className}`}
        >
          {meta.icon} {meta.label}
          {selected.summary && <> — {selected.summary}</>}
          {selected.status === "prohibited" && (
            <p className="mt-0.5 font-semibold">
              この国への案件は作成できません
            </p>
          )}
          {selected.status === "unverified" && (
            <p className="mt-0.5">
              問い合わせ・サンプルまで対応可。PI発行前に管理者が輸出条件を確認してください
            </p>
          )}
        </div>
      )}
    </div>
  );
}
