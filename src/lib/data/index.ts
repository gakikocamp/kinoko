import type { DataRepo } from "./repo";
import { supabaseRepo } from "./supabase";
import { memoryRepo } from "./memory";

/** DEMO_MODE=1 でサンプルデータ(インメモリ)に切替。本番は常にSupabase */
export const isDemoMode = process.env.DEMO_MODE === "1";

export const repo: DataRepo = isDemoMode ? memoryRepo : supabaseRepo;

export * from "./repo";
