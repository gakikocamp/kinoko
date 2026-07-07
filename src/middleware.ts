import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// Next.js 16 では proxy.ts が推奨だが、proxy は Node.js ランタイム固定であり
// @opennextjs/cloudflare が Edge ミドルウェアのみ対応のため、
// 意図的に middleware.ts(Edge)を使用している(ビルド時の非推奨警告は既知)。
// OpenNext が Node ミドルウェアに対応したら proxy.ts へ移行する。
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 静的アセット以外のすべてを認証ガードの対象にする
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
