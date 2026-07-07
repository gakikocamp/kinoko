import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "抹茶輸出管理システム",
  description: "MATCHA NINJA / WAGYUNINJA 海外輸出販売管理(社内ツール)",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
