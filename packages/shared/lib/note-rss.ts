// note の RSS をビルド時に取得して整形する。
// note のフィードURL: https://note.com/<account>/rss
//
// 設計方針:
//  - アカウント未設定 / ネットワーク不通 / パース失敗のいずれでも例外を投げず空配列を返す。
//    → note 連携前でもサイトのビルドが必ず通るようにする。
//  - 記事本文はサイトに持たず、リンクで note 側に飛ばす（運用の手間を最小化）。

import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  /** ISO文字列 */
  pubDate: string;
  /** 表示用に整形した日付 例: "2026年6月1日" */
  dateLabel: string;
  /** 記事サムネ（取れなければ undefined） */
  image?: string;
};

function formatDate(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function extractImage(item: Record<string, unknown>): string | undefined {
  // note の RSS では media:thumbnail や enclosure、本文中の <img> にサムネが入ることがある。
  const thumb = item["media:thumbnail"] as { "@_url"?: string } | undefined;
  if (thumb?.["@_url"]) return thumb["@_url"];

  const enclosure = item["enclosure"] as { "@_url"?: string } | undefined;
  if (enclosure?.["@_url"]) return enclosure["@_url"];

  const content =
    (item["content:encoded"] as string | undefined) ??
    (item["description"] as string | undefined) ??
    "";
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

/**
 * note RSS から最新記事を取得する。
 * @param account note のアカウント名（例: "anelacafe"）。空なら [] を返す。
 * @param limit   取得件数の上限
 */
export async function fetchNoteNews(
  account: string,
  limit = 10
): Promise<NewsItem[]> {
  if (!account) return [];

  const url = `https://note.com/${account}/rss`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "anela-cafe-site (+build)" },
    });
    if (!res.ok) {
      console.warn(`[note-rss] ${url} returned ${res.status}`);
      return [];
    }
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(xml);

    const rawItems = parsed?.rss?.channel?.item;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.slice(0, limit).map((item: Record<string, unknown>) => {
      const pub = String(item["pubDate"] ?? "");
      return {
        title: String(item["title"] ?? "（無題）"),
        link: String(item["link"] ?? ""),
        pubDate: pub,
        dateLabel: formatDate(pub),
        image: extractImage(item),
      } satisfies NewsItem;
    });
  } catch (err) {
    console.warn(`[note-rss] failed to fetch ${url}:`, err);
    return [];
  }
}
