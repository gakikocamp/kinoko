"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setError(
        "ログインできませんでした。メールアドレスとパスワードをご確認ください。"
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-matcha-900 via-matcha-800 to-matcha-950 px-4">
      <div className="fade-up w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="wiggle flex h-16 w-16 items-center justify-center rounded-full bg-matcha-100 text-4xl">
            🍵
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-matcha-900">
            抹茶輸出管理システム
          </h1>
          <p className="mt-1 text-xs text-matcha-700/60">
            MATCHA NINJA / WAGYUNINJA 社内ツール
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-matcha-800">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-matcha-800">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-1"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center !py-3"
          >
            {loading ? "ログイン中…" : "ログインする"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-matcha-700/50">
          アカウントは管理者の招待制です。
          <br />
          ログインできない場合は管理者に連絡してください。
        </p>
      </div>
    </main>
  );
}
