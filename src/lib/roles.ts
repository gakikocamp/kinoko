import type { UserRole } from "./types";

export const ROLE_META: Record<
  UserRole,
  { label: string; badge: string; desc: string }
> = {
  admin: {
    label: "管理者",
    badge: "bg-matcha-600 text-white",
    desc: "すべて操作できます。原価・銀行情報・スタッフ管理も見られます",
  },
  staff: {
    label: "スタッフ",
    badge: "bg-sky-100 text-sky-800",
    desc: "日々の業務(顧客・商品・案件・書類)を操作できます",
  },
  viewer: {
    label: "閲覧のみ",
    badge: "bg-gray-100 text-gray-600",
    desc: "見ることはできますが、変更はできません",
  },
  pending: {
    label: "承認待ち",
    badge: "bg-amber-100 text-amber-800",
    desc: "まだ何も見られません。あなたが役割を決めると使えるようになります",
  },
};

/** 管理者が割り当てられる役割(自分自身以外) */
export const ASSIGNABLE_ROLES: UserRole[] = ["admin", "staff", "viewer", "pending"];
