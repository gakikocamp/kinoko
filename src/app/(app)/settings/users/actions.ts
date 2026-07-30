"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/data";
import type { UserRole } from "@/lib/types";

const VALID: UserRole[] = ["admin", "staff", "viewer", "pending"];

/** スタッフの役割を変更(承認・権限変更・停止)。adminのみ(RLSで保証) */
export async function setRoleAction(
  userId: string,
  role: UserRole
): Promise<{ error: string } | { ok: true }> {
  if (!VALID.includes(role)) return { error: "不正な役割です" };

  // 実行者が管理者か確認(多層防御。RLSでも守られる)
  const myRole = await repo.currentRole();
  if (myRole !== "admin") {
    return { error: "この操作は管理者のみ可能です" };
  }

  try {
    await repo.updateProfileRole(userId, role);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "変更できませんでした" };
  }
  revalidatePath("/settings/users");
  return { ok: true };
}
