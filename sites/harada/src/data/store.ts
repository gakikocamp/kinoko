import type { StoreInfo } from "@anela/shared/lib/site";

// ⚠️ プレースホルダー。実際の住所・電話・営業時間・各SNSが決まり次第ここを差し替える。
export const store: StoreInfo = {
  id: "harada",
  name: "アネラカフェ福岡 原田店",
  shortName: "原田店",
  url: "https://harada.anela-cafe.example",
  tagline: "原田のまちで、わんこと過ごすやさしい時間。",
  address: "〒810-0000 福岡県福岡市○区原田○-○-○（住所は確定後に差し替え）",
  access: "最寄り駅より徒歩○分／駐車場の有無は確定後に記載",
  hours: [
    { label: "月", value: "11:00〜18:00" },
    { label: "火", value: "定休日" },
    { label: "水", value: "11:00〜18:00" },
    { label: "木", value: "11:00〜18:00" },
    { label: "金", value: "11:00〜18:00" },
    { label: "土", value: "10:00〜18:00" },
    { label: "日・祝", value: "10:00〜18:00" },
  ],
  closedNote: "定休日：毎週火曜（変更時は note・Instagram でお知らせします）",
  tel: "000-0000-0000",
  email: "harada@example.com",
  instagram: "https://www.instagram.com/", // 原田店のアカウントが決まり次第差し替え
  // 画像は public/images/ に置いてファイル名を指定すると表示されます（未配置の間はプレースホルダー）。
  heroImage: undefined,
  gallery: [],
  mapEmbedSrc: "",
  mapLink: "https://maps.google.com/",
  sister: {
    name: "アネラカフェ福岡 大濠店",
    url: "https://ohori.anela-cafe.example",
  },
};
