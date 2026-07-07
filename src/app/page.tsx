import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            🏠 ホーム(今日やること)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            ログイン中: {user.email}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-8 rounded-xl border border-dashed border-green-300 bg-green-50 p-8">
        <h2 className="font-semibold text-green-900">
          セットアップ中(Phase 0 基盤)
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          認証・データベース・デプロイ基盤まで完成しています。次のマイルストーン(Milestone
          1)で顧客・商品・案件・PI発行の画面がここに追加されます。
        </p>
        <ol className="mt-4 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>✅ ログイン(Supabase Auth)</li>
          <li>✅ データベース設計(マイグレーション適用済み)</li>
          <li>✅ Cloudflare Workers デプロイパイプライン</li>
          <li>⬜ 顧客・商品・案件管理(次フェーズ)</li>
          <li>⬜ Proforma Invoice 発行(次フェーズ)</li>
        </ol>
      </section>
    </main>
  );
}
