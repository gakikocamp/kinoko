"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="btn-secondary w-full justify-center !border-white/20 !bg-white/10 !text-matcha-100 hover:!bg-white/20"
    >
      ログアウト
    </button>
  );
}
