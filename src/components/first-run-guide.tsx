"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "matcha-guide-dismissed";

let listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function dismiss() {
  localStorage.setItem(KEY, "1");
  listeners.forEach((l) => l());
}

/** 初回表示の「このアプリの使い方」カード。×で閉じたら以後表示しない */
export function FirstRunGuide() {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY) === "1",
    () => true // SSR中は非表示扱い(ちらつき防止)
  );

  if (dismissed) return null;

  const steps = [
    { icon: "🤝", label: "顧客を登録", href: "/customers/new" },
    { icon: "🍵", label: "商品を登録", href: "/products/new" },
    { icon: "📋", label: "案件を作成", href: "/deals/new" },
    { icon: "📄", label: "PIを発行して送金してもらう", href: "/deals" },
  ];

  return (
    <section className="fade-up card relative overflow-hidden border-2 border-matcha-300 bg-gradient-to-br from-matcha-50 to-cream-50 p-6">
      <button
        onClick={dismiss}
        aria-label="閉じる"
        className="absolute right-4 top-3 rounded-full px-2 py-1 text-matcha-700/50 transition hover:bg-matcha-100 hover:text-matcha-800"
      >
        ✕
      </button>
      <h2 className="text-base font-extrabold text-matcha-900">
        👋 はじめまして!このアプリの使い方はかんたんです
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <Link
              href={s.href}
              className="card-hover flex items-center gap-2 rounded-full border-2 border-matcha-200 bg-white px-4 py-2 text-sm font-bold text-matcha-800"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-matcha-600 text-xs text-white">
                {i + 1}
              </span>
              {s.icon} {s.label}
            </Link>
            {i < steps.length - 1 && <span className="text-matcha-400">→</span>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-matcha-700/70">
        入金が確認できたら、あとは案件画面の緑のボタンを順番に押していくだけ。詳しくは
        <Link href="/guide" className="mx-1 font-bold text-matcha-700 underline">
          ❓ 使い方ページ
        </Link>
        へ
      </p>
    </section>
  );
}
