import { defineConfig } from "astro/config";

// 原田店サイト。
// 本番（独自ドメイン）はルート公開。GitHub Pages プレビュー時のみ
// 環境変数 PAGES_BASE（例: "/kinoko/harada"）でサブパスに対応する。
export default defineConfig({
  site: process.env.SITE_URL || "https://harada.anela-cafe.example",
  base: process.env.PAGES_BASE || undefined,
});
