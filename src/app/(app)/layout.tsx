import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { LogoutButton } from "@/components/logout-button";

const NAV = [
  { href: "/", icon: "🏠", label: "ホーム" },
  { href: "/deals", icon: "📋", label: "案件" },
  { href: "/customers", icon: "👤", label: "顧客" },
  { href: "/products", icon: "🍵", label: "商品" },
  { href: "/countries", icon: "🌍", label: "国・輸出ルール" },
  { href: "/settings", icon: "⚙️", label: "設定" },
];

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
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-4">
          <p className="text-sm font-bold text-green-900">抹茶輸出管理</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">{userEmail}</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          {isDemoMode ? (
            <p className="text-center text-xs text-gray-400">デモモード</p>
          ) : (
            <LogoutButton />
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {isDemoMode && (
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
            🧪 デモモード — サンプルデータで動作中(保存内容は再起動で消えます)。本番はSupabaseに接続されます
          </div>
        )}
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
