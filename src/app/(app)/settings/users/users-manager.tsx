"use client";

import { useState, useTransition } from "react";
import { setRoleAction } from "./actions";
import { ROLE_META } from "@/lib/roles";
import { dateJa } from "@/lib/format";
import type { Profile, UserRole } from "@/lib/types";

export function UsersManager({
  profiles,
  currentUserEmail,
}: {
  profiles: Profile[];
  currentUserEmail: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function changeRole(userId: string, role: UserRole) {
    setSavingId(userId);
    startTransition(async () => {
      setError(null);
      const result = await setRoleAction(userId, role);
      if ("error" in result) setError(result.error);
      setSavingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          ❌ {error}
        </p>
      )}
      {profiles.map((p) => {
        const isMe = p.email === currentUserEmail;
        const meta = ROLE_META[p.role];
        return (
          <div
            key={p.id}
            className={`card flex flex-wrap items-center justify-between gap-4 p-5 ${
              p.role === "pending" ? "border-2 border-amber-300" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-bold text-matcha-900">
                {p.email ?? "(メール未登録)"}
                {isMe && (
                  <span className="rounded-full bg-matcha-100 px-2 py-0.5 text-[10px] font-bold text-matcha-700">
                    あなた
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-matcha-700/60">
                {p.full_name || "名前未登録"} ・ 登録 {dateJa(p.created_at)}
              </p>
              <p className="mt-1 text-xs text-matcha-700/50">{meta.desc}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.badge}`}>
                {meta.label}
              </span>
              {isMe ? (
                <span className="text-xs text-matcha-700/40">
                  自分の役割は変更できません
                </span>
              ) : (
                <select
                  value={p.role}
                  disabled={pending && savingId === p.id}
                  onChange={(e) => changeRole(p.id, e.target.value as UserRole)}
                  className="input max-w-40"
                >
                  <option value="pending">承認待ち(停止)</option>
                  <option value="viewer">閲覧のみ</option>
                  <option value="staff">スタッフ</option>
                  <option value="admin">管理者</option>
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
