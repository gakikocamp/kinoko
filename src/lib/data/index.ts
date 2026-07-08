import type { DataRepo } from "./repo";
import { supabaseRepo } from "./supabase";
import { memoryRepo } from "./memory";

/**
 * DEMO_MODE=1 でサンプルデータ(インメモリ)に切替。
 * 安全装置: 本番ビルド(NODE_ENV=production)では環境変数が誤って
 * 設定されていてもデモモード(=認証バイパス)には絶対にならない。
 * デモは `npm run demo`(開発サーバー)でのみ動く。
 */
export const isDemoMode =
  process.env.DEMO_MODE === "1" && process.env.NODE_ENV !== "production";

export const repo: DataRepo = isDemoMode ? memoryRepo : supabaseRepo;

export * from "./repo";
