import Link from "next/link";
import { redirect } from "next/navigation";
import { repo, isDemoMode } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // 管理者のみアクセス可(多層防御: RLSでも守られる)
  const role = await repo.currentRole();
  if (role !== "admin") redirect("/");

  let currentUserEmail = "demo@matcha-ninja.example";
  if (!isDemoMode) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserEmail = user?.email ?? "";
  }

  const profiles = await repo.listProfiles();
  const pendingCount = profiles.filter((p) => p.role === "pending").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="fade-up">
        <h1 className="text-2xl font-extrabold text-matcha-900">
          👥 スタッフ管理
        </h1>
        <p className="mt-1 text-sm text-matcha-700/60">
          誰がこのアプリを使えるか、どこまで見られるかを管理します
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="fade-up-1 card border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            ⏳ 承認待ちが {pendingCount} 人います
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            この人たちはまだ何も見られません。下で役割(スタッフ等)を選ぶと使えるようになります
          </p>
        </div>
      )}

      <div className="fade-up-2">
        <UsersManager profiles={profiles} currentUserEmail={currentUserEmail} />
      </div>

      {/* スタッフの追加方法 */}
      <section className="fade-up-3 card border-2 border-matcha-200 bg-matcha-50/50 p-6">
        <h2 className="font-extrabold text-matcha-900">
          ➕ 新しいスタッフを追加するには
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-matcha-800/80">
          <li>
            <span className="font-bold">1.</span> Supabaseの管理画面 →
            Authentication → Users →「Add user」→「Create new user」で、
            スタッフのメールと仮パスワード(12文字以上)を作成
          </li>
          <li>
            <span className="font-bold">2.</span>{" "}
            そのスタッフにメールと仮パスワードを伝える
          </li>
          <li>
            <span className="font-bold">3.</span>{" "}
            スタッフがこのアプリにログインすると、この画面に「⏳承認待ち」で表示されます
          </li>
          <li>
            <span className="font-bold">4.</span>{" "}
            あなたが役割(スタッフ / 閲覧のみ / 管理者)を選べば、その場で使えるようになります
          </li>
        </ol>
        <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs text-matcha-700/70">
          💡
          いずれ「アプリ内のボタンだけでスタッフを招待できる」ようにもできます(メール送信機能とセットで追加予定)。今の方式でも安全に運用できます。
        </p>
      </section>

      <Link href="/settings" className="btn-secondary">
        ← 設定に戻る
      </Link>
    </div>
  );
}
