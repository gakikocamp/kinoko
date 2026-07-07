import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// ISR/キャッシュ機構は使わない方針(docs/09_deployment.md §3.2)のため既定値のまま
export default defineCloudflareConfig();
