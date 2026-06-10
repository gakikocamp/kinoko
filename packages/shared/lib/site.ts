// 2サイト共通で使う「店舗情報」の型定義。
// 各サイトは sites/<store>/src/data/store.ts でこの型に沿ったデータを用意する。

export type WeeklyHours = {
  /** 例: "月" "火" ... "祝" */
  label: string;
  /** 例: "11:00〜18:00" / "定休日" */
  value: string;
};

export type StoreInfo = {
  /** 内部識別子: "ohori" | "harada" */
  id: string;
  /** 表示名: 例 "アネラカフェ福岡 大濠店" */
  name: string;
  /** 短い名前: 例 "大濠店" */
  shortName: string;
  /** 公開URL（OGP・canonical用）。未確定なら pages.dev の仮URL */
  url: string;
  /** トップのキャッチコピー */
  tagline: string;
  /** 住所 */
  address: string;
  /** アクセス補足（最寄り駅・駐車場など） */
  access: string;
  /** 営業時間（曜日ごと） */
  hours: WeeklyHours[];
  /** 定休日の補足文 */
  closedNote?: string;
  /** 電話番号（tel: 用にハイフンなしでも可、表示は自由） */
  tel: string;
  /** 問い合わせメール */
  email: string;
  /** この店舗の Instagram プロフィールURL */
  instagram: string;
  /** トップのヒーロー画像（public/ からのパス 例: "/images/hero.jpg"）。未設定ならプレースホルダー表示 */
  heroImage?: string;
  /** トップ等で使うギャラリー画像（public/ からのパス）。空ならギャラリー非表示 */
  gallery?: { src: string; alt: string }[];
  /** Googleマップ埋め込み用の iframe src（共有 > 地図を埋め込む で取得） */
  mapEmbedSrc?: string;
  /** Googleマップへのリンク（経路案内用） */
  mapLink?: string;
  /** 姉妹店へのリンク情報 */
  sister: {
    name: string;
    url: string;
  };
};

// 組織共通の情報（2店舗で共有）
export const ORG = {
  /** 全店共通の note アカウント名（例: "anelacafe"）。
   *  未設定の間は空文字にしておくと RSS 取得をスキップしてビルドが通る。 */
  noteAccount: "",
  /** 里親募集の発信に使う Instagram（保護犬の最新情報） */
  adoptionInstagram: "https://www.instagram.com/",
  /** 運営団体名 */
  operator: "アネラカフェ",
} as const;
