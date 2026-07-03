# SAFETY.md — 安全対策とリカバリー手引き（暴走・誤削除への備え）

「AIが暴走して全部消した」「まちがえてファイルを消した」——そんな時に**必ず戻せる**ようにするための
多層防御と、消してしまった時の**復旧手順**をまとめています。このプロジェクトに限らず、
どのプロジェクトでも同じ考え方で守れます。

---

## 3つの大原則
1. **消えても復元できる状態を常に保つ**（＝どこかに必ずコピーがある）。
2. **危険な操作は“実行前”に止める / 確認する**（一発で不可逆なことを防ぐ）。
3. **こまめに保存＝コミット＆プッシュ**（＝“セーブポイント”を増やす）。

---

## 多層防御（1枚破られても次が守る）

| 層 | 何を守るか | 状態 |
|----|-----------|------|
| ① git（履歴） | ファイルを消しても過去の版から戻せる | 有効（このリポジトリはgit管理） |
| ② GitHub（遠隔コピー） | Macが丸ごと壊れても、クラウドに全部残る | 要：**こまめにpush** |
| ③ GitHub ブランチ保護 | AIが強制pushしても、本番履歴を上書きさせない | **要設定**（下記） |
| ④ Claude Code の許可制 | 削除・push等は**実行前に確認**を求める | 有効（`.claude/settings.json`） |
| ⑤ SAFETY GUARD フック | `rm -rf /` 等のカタストロフィックな命令を**ブロック**（Claude用） | 有効（`.claude/guard.sh`） |
| ⑥ git pre-push フック | **強制push・ブランチ削除**をブロック（**全ツール共通**：Antigravity/ターミナル等） | 要：**`setup-guardrails.sh` を1回実行** |
| ⑦ Time Machine / iCloud | gitの外（未コミット）も含めてMac全体を復元 | 要：**Time Machine ON** |

> ④⑤⑥はこのリポジトリに組み込み済み（⑥は有効化コマンドを1回だけ）。③⑦は**あなたの手で1回設定**すれば完成します（下記チェックリスト）。

### まず1回だけ：ガードを有効化する
リポジトリ直下で次を実行すると、全ツール共通の pre-push ガード（⑥）が有効になります：
```bash
bash setup-guardrails.sh
```
これは `git config core.hooksPath .githooks` を行い、Antigravity でも・ターミナルでも・Claude でも、
**強制pushやブランチ削除を git レベルで拒否**します（どのツールから git を使っても効く）。

---

## いま組み込んだガードレール（このリポジトリ）

### `.claude/settings.json`（許可制）
削除や履歴を触る系のコマンドは、Claude Code が**実行前に必ず確認**するよう設定済み：
`rm` / `mv` / `git push` / `git reset` / `git clean` / `git checkout` / `git rebase` /
`git branch` / `sudo` / `chmod` / `chown` / `wrangler` など。

### `.claude/guard.sh`（最後の砦フック）
次のような“取り返しがつかない”命令は、確認を待たず**その場でブロック**：
- `rm -rf /` `rm -rf ~` `rm -rf $HOME` `rm -rf *` `rm -rf /*`（ルート/ホーム/全体の一括削除）
- `git push --force` / `-f`（リモート履歴の破壊）、`git branch -D`
- `mkfs` `fdisk` `dd`、デバイスへの直接書き込み、`sudo rm`

> ⚠️ この2つは**Claude Code を通した操作**を守るもの。ターミナルで人間が直接打つ命令や、
> 別ツールには効きません。だから③GitHub保護と⑥Time Machineが重要です。

### 全プロジェクトに効かせたい場合（推奨）
上の守りを**すべてのプロジェクト**に効かせるには、Mac側で `.claude/` を**グローバル設定**にコピーします：
```bash
mkdir -p ~/.claude
cp .claude/guard.sh ~/.claude/guard.sh
# ~/.claude/settings.json が無ければ .claude/settings.json を雛形にして作成
#（既にある場合は permissions と hooks の項目を追記マージ）
```
グローバル側の hook パスは `"$HOME/.claude/guard.sh"` にしておくと確実です。

---

## 秘密情報の流出を防ぐ（GitHubは“非公開”にできる）
- **GitHub のプライベートリポジトリは完全に非公開**です。あなたと、明示的に招待した人以外は一切見られません（検索にも出ません）。「公開しかできない」は誤解です。
- このサイトは静的サイトで、**そもそもパスワードを持ちません**。`store.ts` の住所・電話・メール・Instagram は“サイトに載る公開情報”で秘密ではありません。
- 秘密の値（Cloudflareトークン等）は **`.env`（`.gitignore`で除外済み）** に置く運用。コミットされません。
- さらに **`.githooks/pre-commit`（SECRET GUARD）** を追加済み：コミット内容にAPIキー/トークン/秘密鍵/パスワード直書き/`.env`が混じると、**コミット自体をブロック**します（Antigravity/ターミナル/Claude 共通。`setup-guardrails.sh` で有効化）。
- 推奨設定：GitHub → リポジトリ → Settings → Code security で **Secret scanning / Push protection** をON（対応プランの場合）。リポジトリの公開範囲は Settings → General 最下部で確認・変更できます（Private推奨）。
- **もし誤って秘密を上げてしまったら**：まず**その値を無効化＝作り直す（ローテーション）**のが最優先（git履歴には残るため）。そのうえで必要なら履歴から除去。

## あなたが1回だけ設定すること（チェックリスト）

- [ ] **GitHub ブランチ保護**（③）: GitHub → リポジトリ → Settings → Branches →
      Add branch ruleset（または Add rule）で本番ブランチ（`master`）に対し
      **Restrict deletions** と **Block force pushes** を有効化。可能なら「Require a pull request」も。
      → これでAIや誤操作が**本番の履歴を壊す・ブランチを消す**のを防げます。
- [ ] **Time Machine ON**（⑥）: Mac のシステム設定 → 一般 → Time Machine で外付けドライブを追加。
      gitに入れていない素材（`画像集`・`ロゴ` フォルダ等）も含めてMac全体を過去に戻せます。
- [ ] **こまめに push**（②）: 作業がひと区切りしたら `git add -A && git commit && git push`。
      これが最強のセーブポイント。1日1回でも大きく違います。
- [ ] **危険モードを使わない**: Claude Code を「全許可 / 確認をスキップ」で起動しない
      （`--dangerously-skip-permissions` を付けない）。付けると④⑤の確認が無効になります。

---

## 復旧手引き（消してしまった / 壊れた時）

> まず落ち着いて。**「まだ何も上書きコミットしていない」なら、ほぼ確実に戻せます。**

### A. ファイルを1つ消した / 変な編集をした（まだコミット前）
```bash
git restore <ファイル名>          # 直前のコミットの状態に戻す
git restore .                     # 変更を全部取り消して最後のコミットに戻す
```

### B. ローカルのファイルを大量に消した（でもpush済み）
```bash
git status                        # 消えたものを確認
git restore .                     # コミット済みの版から全部復元
# それでも足りない/フォルダごと壊れたら、作り直し：
cd ..
git clone https://github.com/gakikocamp/kinoko.git kinoko-復旧
```

### C. まちがったコミットをしてしまった
```bash
git log --oneline -5              # どのコミットが問題か確認
git revert <コミットID>           # そのコミットを“打ち消す”新コミット（安全・履歴は残る）
```
> `git reset --hard` は使わない（別の変更まで消える）。迷ったら revert。

### D. 直前の操作を取り消したい / “さっきの状態”に戻したい
```bash
git reflog                        # 最近の状態の履歴（HEADの足あと）が全部出る
git reset --hard <戻したい地点>   # ※これは強い操作。番人フックが確認/停止するので指示に従う
```
`reflog` は**コミットしていない直近の移動も記録**しているので、多くの「やっちゃった」はここから戻せます。

### E. GitHub上でブランチを消してしまった
GitHub のリポジトリ → Branches 画面に、最近削除したブランチの **Restore** ボタンが出ます（一定期間）。
または、そのブランチの最後のコミットIDが分かれば、手元から `git push origin <ID>:refs/heads/<ブランチ名>`。

### F. 強制pushでリモート履歴を壊した
- ③のブランチ保護を入れていれば**そもそも起きません**（最優先で設定を）。
- 起きてしまったら、その履歴を持つ**手元のクローン**で `git reflog` から正しい地点を探し、`git push` で戻す。
- どのクローンにも無ければ、GitHub の該当コミットURL（誰かのPR/通知に残っていることが多い）から復元。

### G. gitに入れていない素材（画像・ロゴ等）を消した
git では戻せません。**Time Machine**（⑥）か **iCloudの「最近削除した項目」**（30日）から復元。
→ だからこそ、大事な素材も早めにリポジトリへ入れるか、Time Machineを回しておくこと。

---

## 迷ったときの合言葉
**「上書きする前に、まず `git status` と `git reflog` を見る」**
——たいていの“やっちゃった”は、ここから戻せます。慌てて `reset --hard` や強制pushをしないこと。
