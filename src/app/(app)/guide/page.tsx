import Link from "next/link";

const FLOW = [
  {
    icon: "💬",
    title: "① 問い合わせが来たら",
    body: "「顧客」に会社を登録 → 「案件」を作成します。国を選ぶと、その国に輸出できるか(🟢🟡🔴⚪)が自動で表示されます。",
    action: { label: "案件を作成する", href: "/deals/new" },
  },
  {
    icon: "📄",
    title: "② 見積が決まったら PI を発行",
    body: "案件画面の「PIを発行する」を押すだけ。足りない情報(住所・EORIなど)があれば発行前に教えてくれます。できたPDFをバイヤーにメールで送り、前払いしてもらいます。",
    action: { label: "案件一覧を見る", href: "/deals" },
  },
  {
    icon: "💰",
    title: "③ 入金を確認したら",
    body: "案件画面の緑のボタン「入金を記録して確認済みにする」を押します。着金前に押そうとすると確認画面が出るので、うっかりが防げます。",
  },
  {
    icon: "📦",
    title: "④ 加工して出荷",
    body: "加工が終わったら「出荷準備完了にする」→「出荷済みにする」と、緑のボタンを順番に押すだけ。ステータスは自動で進みます。",
  },
  {
    icon: "✅",
    title: "⑤ 届いたら完了",
    body: "「案件を完了する」を押しておしまい。おつかれさまでした 🎉",
  },
];

const GLOSSARY = [
  {
    term: "PI(Proforma Invoice)",
    desc: "「この内容と金額で取引しますね」という正式な請求書のこと。バイヤーはこれを見て前払いの送金をします。",
  },
  {
    term: "Incoterms(インコタームズ)",
    desc: "送料と危険をどこまで自社が持つかの世界共通ルール。例: FOB Hakata =「博多港に載せるまでこちら持ち、その先はバイヤー持ち」。DAP Hamburg =「ハンブルクの指定場所まで届けるのはこちら持ち」。",
  },
  {
    term: "EORI番号",
    desc: "EU・イギリスの輸入者が持つ通関用の番号。EU/UK向けでは書類に書いていないと税関で止まることがあるので、顧客登録のときにもらっておきましょう。",
  },
  {
    term: "VAT番号",
    desc: "ヨーロッパの消費税(VAT)の事業者番号。インボイスに記載します。",
  },
  {
    term: "HSコード",
    desc: "商品の関税分類番号。抹茶(3kg以下の小売包装)は 0902.10 系。最終確認は通関業者にお願いします。",
  },
  {
    term: "COA",
    desc: "成分・農薬などの検査成績書。特にEU向けは必須と思ってOK。LOT(製造ロット)ごとに用意します。",
  },
  {
    term: "LOT番号",
    desc: "「いつ作ったどの袋か」を追いかけるための製造番号。万一の回収時に、どのバイヤーに出したか追跡できます。",
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="fade-up">
        <h1 className="text-2xl font-extrabold text-matcha-900">
          ❓ 使い方ガイド
        </h1>
        <p className="mt-1 text-sm text-matcha-700/70">
          このアプリは「画面の緑のボタンを順番に押していく」だけで輸出業務が進むようにできています
        </p>
      </div>

      <section className="fade-up-1 space-y-3">
        <h2 className="text-base font-extrabold text-matcha-900">
          🗺 仕事の流れ(5ステップ)
        </h2>
        {FLOW.map((f) => (
          <div key={f.title} className="card flex gap-4 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-matcha-100 text-2xl">
              {f.icon}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-matcha-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-matcha-800/80">
                {f.body}
              </p>
              {f.action && (
                <Link href={f.action.href} className="btn-secondary mt-3">
                  {f.action.label} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="fade-up-2">
        <h2 className="text-base font-extrabold text-matcha-900">
          🛟 困ったとき
        </h2>
        <div className="card mt-3 divide-y divide-cream-200">
          <div className="p-5">
            <p className="font-bold text-matcha-900">
              Q. 発行したPIを間違えた!
            </p>
            <p className="mt-1 text-sm text-matcha-800/80">
              発行済みの書類は変更できません(貿易書類のルールです)。案件の内容を直してから、もう一度発行してください。新しい番号で発行されます。
            </p>
          </div>
          <div className="p-5">
            <p className="font-bold text-matcha-900">
              Q. 知らない国から問い合わせが来た
            </p>
            <p className="mt-1 text-sm text-matcha-800/80">
              まず「🌍 国・輸出ルール」でその国を確認。⚪未確認の国はPIを発行できない仕組みなので、JETROや通関業者に確認してから進めましょう。慌てなくて大丈夫です。
            </p>
          </div>
          <div className="p-5">
            <p className="font-bold text-matcha-900">
              Q. 操作を間違えて壊してしまいそうで怖い
            </p>
            <p className="mt-1 text-sm text-matcha-800/80">
              このアプリに「削除」はありません。登録した情報はあとから何度でも編集できます。危ない操作(入金前に進める等)は必ず確認画面が出るので、安心して触ってください。
            </p>
          </div>
        </div>
      </section>

      <section className="fade-up-3">
        <h2 className="text-base font-extrabold text-matcha-900">
          📖 貿易用語ミニ辞典
        </h2>
        <div className="card mt-3 divide-y divide-cream-200">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="p-5">
              <p className="font-bold text-matcha-900">{g.term}</p>
              <p className="mt-1 text-sm leading-relaxed text-matcha-800/80">
                {g.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
