import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-rounded",
  display: "swap",
});

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
    <html lang="ja" className={`${rounded.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
