import type { StoreInfo } from "@anela/shared/lib/site";

// ⚠️ プレースホルダー。実際の住所・電話・営業時間・各SNSが決まり次第ここを差し替える。
export const store: StoreInfo = {
  id: "ohori",
  name: "アネラカフェ福岡 大濠店",
  shortName: "大濠店",
  url: "https://ohori.anela-cafe.example",
  tagline: "大濠公園のそばで、ほっとひと息。",
  address: "〒810-0000 福岡県福岡市中央区大濠○-○-○（住所は確定後に差し替え）",
  access: "地下鉄「大濠公園駅」より徒歩○分／駐車場の有無は確定後に記載",
  hours: [
    { label: "月", value: "11:00〜18:00" },
    { label: "火", value: "11:00〜18:00" },
    { label: "水", value: "定休日" },
    { label: "木", value: "11:00〜18:00" },
    { label: "金", value: "11:00〜18:00" },
    { label: "土", value: "10:00〜18:00" },
    { label: "日・祝", value: "10:00〜18:00" },
  ],
  closedNote: "定休日：毎週水曜（変更時は note・Instagram でお知らせします）",
  tel: "000-0000-0000",
  email: "ohori@example.com",
  instagram: "https://www.instagram.com/anella_cafe_fukuoka_ohori/",
  // 画像は public/images/ に置いてファイル名を指定すると表示されます（未配置の間はプレースホルダー）。
  // 例: heroImage: "/images/hero.jpg"
  heroImage: undefined,
  gallery: [],
  mapEmbedSrc: "", // Googleマップ > 共有 > 地図を埋め込む の src を貼る
  mapLink: "https://maps.google.com/",
  sister: {
    name: "アネラカフェ福岡 原田店",
    url: "https://harada.anela-cafe.example",
  },
};
