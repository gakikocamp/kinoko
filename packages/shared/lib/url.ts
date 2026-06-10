// 内部リンクを base パス対応にするヘルパー。
// 本番（独自ドメイン・ルート公開）では BASE_URL='/' なので影響なし。
// GitHub Pages のサブパス（例: /kinoko/ohori/）公開時に内部リンクを正しく前置する。
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}
