-- ============================================================
-- 仕向国マスタ 初期データ(docs/07_country_compliance.md §2)
-- 2026年時点の目安。取引開始前に必ずJETRO・通関業者へ最新確認し、
-- last_reviewed_at を更新する運用とセット。
-- ここに無い国はアプリ側で「⚪未確認」として扱う。
-- ============================================================

-- 🟢 輸出可
insert into destination_countries (code, name_en, name_ja, status, summary, requirements) values
('US', 'United States', 'アメリカ合衆国', 'ok', 'FDA施設登録+Prior Notice',
 '[{"label": "製造元のFDA食品施設登録番号を確認済み", "required": true},
   {"label": "出荷ごとのPrior Notice提出(通常はクーリエ/フォワーダーが代行)", "required": true},
   {"label": "バイヤーのFSVP対応用にCOA・製造者情報を提供", "required": false}]'),
('GB', 'United Kingdom', 'イギリス', 'ok', 'UK EORI必須・日英EPA優遇可',
 '[{"label": "買い手のUK EORI番号を顧客情報に登録済み", "required": true},
   {"label": "日英EPA原産地申告で関税優遇(任意)", "required": false}]'),
('CA', 'Canada', 'カナダ', 'ok', '輸入者側SFCライセンス',
 '[{"label": "輸入者がSFC(Safe Food for Canadians)ライセンス保有を確認", "required": true}]'),
('SG', 'Singapore', 'シンガポール', 'ok', '規制軽微', '[]'),
('HK', 'Hong Kong', '香港', 'ok', '規制軽微(茶は放射性物質規制の対象外)', '[]'),
('CH', 'Switzerland', 'スイス', 'ok', '概ねEU準拠',
 '[{"label": "EU向け要件(MRL適合COA)に準拠", "required": true}]'),
('NO', 'Norway', 'ノルウェー', 'ok', '概ねEU準拠',
 '[{"label": "EU向け要件(MRL適合COA)に準拠", "required": true}]'),
('NZ', 'New Zealand', 'ニュージーランド', 'ok', '加工済み茶は輸入可', '[]');

-- 🟡 EU加盟27カ国(共通要件)
insert into destination_countries (code, name_en, name_ja, status, summary, requirements)
select code, name_en, name_ja, 'conditional', 'EU: 農薬MRL適合COA必須・EORI必須',
 '[{"label": "残留農薬MRL適合のCOAをLOTに添付済み(EU基準・最重要)", "required": true},
   {"label": "買い手のEORI番号を顧客情報に登録済み", "required": true},
   {"label": "日EU EPA原産地申告文をCIに記載(関税ゼロ化・任意)", "required": false},
   {"label": "有機表記する場合はCOI等の有機認証手続を確認", "required": false}]'::jsonb
from (values
  ('AT','Austria','オーストリア'), ('BE','Belgium','ベルギー'), ('BG','Bulgaria','ブルガリア'),
  ('HR','Croatia','クロアチア'), ('CY','Cyprus','キプロス'), ('CZ','Czechia','チェコ'),
  ('DK','Denmark','デンマーク'), ('EE','Estonia','エストニア'), ('FI','Finland','フィンランド'),
  ('FR','France','フランス'), ('DE','Germany','ドイツ'), ('GR','Greece','ギリシャ'),
  ('HU','Hungary','ハンガリー'), ('IE','Ireland','アイルランド'), ('IT','Italy','イタリア'),
  ('LV','Latvia','ラトビア'), ('LT','Lithuania','リトアニア'), ('LU','Luxembourg','ルクセンブルク'),
  ('MT','Malta','マルタ'), ('NL','Netherlands','オランダ'), ('PL','Poland','ポーランド'),
  ('PT','Portugal','ポルトガル'), ('RO','Romania','ルーマニア'), ('SK','Slovakia','スロバキア'),
  ('SI','Slovenia','スロベニア'), ('ES','Spain','スペイン'), ('SE','Sweden','スウェーデン')
) as eu(code, name_en, name_ja);

-- 🟡 その他の条件付き可
insert into destination_countries (code, name_en, name_ja, status, summary, requirements) values
('TW', 'Taiwan', '台湾', 'conditional', '全日本産食品に産地証明書',
 '[{"label": "産地証明書を取得(全ての日本産食品に必要)", "required": true},
   {"label": "特定5県産でないことを確認(八女=福岡産は対象外)", "required": true},
   {"label": "台湾の茶向け農薬基準に適合するCOAを確認", "required": true}]'),
('KR', 'South Korea', '韓国', 'conditional', '一部県産に放射性物質証明・検査厳格',
 '[{"label": "産地が放射性物質証明の対象県か確認(福岡産は対象外を都度確認)", "required": true},
   {"label": "輸入者の食品輸入登録を確認", "required": true}]'),
('AU', 'Australia', 'オーストラリア', 'conditional', 'BICONで輸入条件確認',
 '[{"label": "BICON(輸入条件DB)で緑茶の最新条件を確認", "required": true},
   {"label": "密封小売包装・加工済みであることを確認", "required": true}]'),
('AE', 'United Arab Emirates', 'アラブ首長国連邦', 'conditional', '輸入者登録・アラビア語ラベル',
 '[{"label": "輸入者の食品登録を確認", "required": true},
   {"label": "アラビア語ラベル対応を輸入者と合意(責任分担を書面化)", "required": true},
   {"label": "ハラール認証の要否をバイヤーに確認(茶は原則不要)", "required": false}]'),
('SA', 'Saudi Arabia', 'サウジアラビア', 'conditional', 'SFDA輸入者登録・アラビア語ラベル',
 '[{"label": "輸入者のSFDA登録を確認", "required": true},
   {"label": "アラビア語ラベル対応を輸入者と合意", "required": true}]'),
('IN', 'India', 'インド', 'conditional', 'FSSAI・高関税に注意',
 '[{"label": "輸入者のFSSAIライセンスを確認", "required": true},
   {"label": "茶の高関税(100%超)を織り込んだ価格で合意済み", "required": true}]'),
('ID', 'Indonesia', 'インドネシア', 'conditional', 'BPOM登録・ハラール表示義務化に注意',
 '[{"label": "輸入者のBPOM登録を確認", "required": true},
   {"label": "ハラール表示義務の適用状況と対応可否を確認", "required": true}]'),
('TH', 'Thailand', 'タイ', 'conditional', '輸入者の食品輸入ライセンス確認',
 '[{"label": "輸入者のThai FDA輸入ライセンスを確認", "required": true}]'),
('VN', 'Vietnam', 'ベトナム', 'conditional', '輸入者の食品輸入手続確認',
 '[{"label": "輸入者の食品輸入手続(自己公表制度等)を確認", "required": true}]'),
('MY', 'Malaysia', 'マレーシア', 'conditional', '輸入者の食品輸入手続確認',
 '[{"label": "輸入者の食品輸入手続を確認", "required": true},
   {"label": "ハラール認証の要否をバイヤーに確認", "required": false}]'),
('BR', 'Brazil', 'ブラジル', 'conditional', 'ANVISA登録が重い・採算要確認',
 '[{"label": "輸入者のANVISA登録を確認", "required": true},
   {"label": "輸送費・関税込みの採算を案件単位で確認", "required": true}]');

-- 🔴 当面対応不可
insert into destination_countries (code, name_en, name_ja, status, summary, notes) values
('CN', 'China', '中国', 'prohibited',
 'GACC海外製造者登録+放射性物質全量検査で通関が長期・不確実。体制構築まで対応不可',
 '解禁する場合はGACC登録を完了し、このステータスをconditionalに変更して要件を登録すること'),
('RU', 'Russia', 'ロシア', 'prohibited',
 '制裁により決済手段が実質喪失(Wise停止・銀行送金制約)。前払い回収が成立しない', null),
('BY', 'Belarus', 'ベラルーシ', 'prohibited', 'ロシアと同様の制裁・決済制約', null),
('KP', 'North Korea', '北朝鮮', 'prohibited', '日本の全面輸出禁止措置', null),
('IR', 'Iran', 'イラン', 'prohibited', '包括制裁・決済不能', null),
('SY', 'Syria', 'シリア', 'prohibited', '包括制裁・決済不能', null),
('CU', 'Cuba', 'キューバ', 'prohibited', '制裁関連の決済リスク', null);
