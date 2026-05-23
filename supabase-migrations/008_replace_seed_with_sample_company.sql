-- 008_replace_seed_with_sample_company.sql
-- 初期 seed データを汎用的なサンプル会社情報に置き換える。
-- accounting-app-2 (サンプルアプリ用Supabase) で1回だけ実行する想定。

-- 1. 本店ブランチの住所・電話を更新
update public.branches
   set name    = '本店',
       address = '〒100-0001 東京都千代田区千代田1-1-1',
       phone   = '03-1234-5678'
 where id = '00000000-0000-0000-0000-000000000001';

-- 2. アプリ設定（会社情報）をサンプル会社に置換
update public.app_settings
   set company_name                = 'サンプル株式会社',
       company_address             = '〒100-0001 東京都千代田区千代田1-1-1',
       company_phone               = '03-1234-5678',
       company_registration_number = 'T0000000000000'
 where branch_id = '00000000-0000-0000-0000-000000000001';

-- 3. サンプル顧客5件を汎用名に差し替え
update public.customers
   set name         = '株式会社サンプル商事',
       name_kana    = 'サンプルショウジ',
       address      = '〒150-0001 東京都渋谷区神宮前1-1-1',
       phone        = '03-2000-0001'
 where customer_code = 'C-001'
   and branch_id     = '00000000-0000-0000-0000-000000000001';

update public.customers
   set name         = 'デモ運送株式会社',
       name_kana    = 'デモウンソウ',
       address      = '〒135-0061 東京都江東区豊洲2-2-2',
       phone        = '03-2000-0002'
 where customer_code = 'C-002'
   and branch_id     = '00000000-0000-0000-0000-000000000001';

update public.customers
   set name         = 'テスト自動車株式会社',
       name_kana    = 'テストジドウシャ',
       address      = '〒160-0023 東京都新宿区西新宿3-3-3',
       phone        = '03-2000-0003'
 where customer_code = 'C-003'
   and branch_id     = '00000000-0000-0000-0000-000000000001';

update public.customers
   set name         = '株式会社デモ建設',
       name_kana    = 'デモケンセツ',
       address      = '〒106-0032 東京都港区六本木4-4-4',
       phone        = '03-2000-0004'
 where customer_code = 'C-004'
   and branch_id     = '00000000-0000-0000-0000-000000000001';

update public.customers
   set name         = '株式会社サンプル物流',
       name_kana    = 'サンプルブツリュウ',
       address      = '〒103-0027 東京都中央区日本橋5-5-5',
       phone        = '03-2000-0005'
 where customer_code = 'C-005'
   and branch_id     = '00000000-0000-0000-0000-000000000001';

-- 4. 確認用 SELECT
select 'branches' as table_name, name, address, phone from public.branches
 where id = '00000000-0000-0000-0000-000000000001'
union all
select 'app_settings', company_name, company_address, company_phone from public.app_settings
 where branch_id = '00000000-0000-0000-0000-000000000001'
union all
select 'customers', name, address, phone from public.customers
 where branch_id = '00000000-0000-0000-0000-000000000001'
 order by 1;
