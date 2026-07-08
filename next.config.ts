import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // 社内ツールのため Cloudflare Images は使わずプレーン配信(docs/09_deployment.md §3.2)
  images: {
    unoptimized: true,
  },
  // セキュリティヘッダ(docs/08_security.md §5)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

// `next dev` 実行時に Cloudflare バインディングをエミュレートする
initOpenNextCloudflareForDev();
