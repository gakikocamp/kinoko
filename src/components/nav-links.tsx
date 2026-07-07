"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", icon: "🏠", label: "ホーム" },
  { href: "/deals", icon: "📋", label: "案件" },
  { href: "/customers", icon: "🤝", label: "顧客" },
  { href: "/products", icon: "🍵", label: "商品" },
  { href: "/countries", icon: "🌍", label: "国・輸出ルール" },
  { href: "/settings", icon: "⚙️", label: "設定" },
  { href: "/guide", icon: "❓", label: "使い方" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
              active
                ? "bg-matcha-500/25 text-white shadow-inner"
                : "text-matcha-100/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
            {active && <span className="ml-auto text-matcha-300">●</span>}
          </Link>
        );
      })}
    </nav>
  );
}
