import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = "demo@matcha-ninja.example";
  if (!isDemoMode) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    userEmail = user.email ?? "";

    // 承認待ち(pending)ユーザーはデータに一切アクセスできない(RLS)ため、
    // 案内画面だけを表示する
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role === "pending") {
      return (
        <main className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
          <div className="card max-w-md p-8 text-center">
            <p className="text-4xl">⏳</p>
            <h1 className="mt-3 text-lg font-extrabold text-matcha-900">
              アカウントは承認待ちです
            </h1>
            <p className="mt-2 text-sm text-matcha-700/70">
              管理者があなたのアカウントを承認すると使えるようになります。
              管理者に連絡してください。({userEmail})
            </p>
            <div className="mt-5">
              <LogoutButton />
            </div>
          </div>
        </main>
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-gradient-to-b from-matcha-900 to-matcha-950 text-white">
        <div className="px-5 py-6">
          <p className="flex items-center gap-2 text-lg font-extrabold tracking-wide">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-matcha-500/30 text-xl">
              🍵
            </span>
            抹茶輸出管理
          </p>
          <p className="mt-2 truncate pl-1 text-xs text-matcha-200/70">
            {userEmail}
          </p>
        </div>

        <NavLinks />

        <div className="p-4">
          {isDemoMode ? (
            <p className="rounded-full bg-white/10 py-1.5 text-center text-xs text-matcha-100">
              🧪 デモモード
            </p>
          ) : (
            <LogoutButton className="w-full !border-white/20 !bg-white/10 !text-matcha-100 hover:!bg-white/20" />
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {isDemoMode && (
          <div className="bg-gold-400/25 px-4 py-1.5 text-center text-xs font-medium text-matcha-900">
            🧪 デモモード — サンプルデータで動作中。自由に触ってOK(再起動で元に戻ります)
          </div>
        )}
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
