"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", icon: "🏠", label: "ホーム", adminOnly: false },
  { href: "/deals", icon: "📋", label: "案件", adminOnly: false },
  { href: "/customers", icon: "🤝", label: "顧客", adminOnly: false },
  { href: "/products", icon: "🍵", label: "商品", adminOnly: false },
  { href: "/countries", icon: "🌍", label: "国・輸出ルール", adminOnly: false },
  { href: "/settings/users", icon: "👥", label: "スタッフ管理", adminOnly: true },
  { href: "/settings", icon: "⚙️", label: "設定", adminOnly: false },
  { href: "/guide", icon: "❓", label: "使い方", adminOnly: false },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.filter((item) => isAdmin || !item.adminOnly).map((item) => {
        const active =
          item.href === "/" || item.href === "/settings"
            ? pathname === item.href
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
