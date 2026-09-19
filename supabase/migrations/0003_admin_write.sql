-- 관리자 쓰기 정책. 설계 근거는 docs/dev/schema.md 「관리자」절.
--
-- **옛 레포(butter-weather-shop)의 방식을 계승한다.** 그쪽은 Supabase Auth
-- 로 로그인하고 RLS 가 관리자 이메일을 보고 쓰기를 열어주는 구조였다
-- (useAdminProducts.ts 주석: "쓰기도 같은 RLS 가 관리자 이메일만 통과시킨다").
--
-- 0001 에는 「쓰기 정책을 만들지 않고 secret 키로만 한다」고 적혀 있었다.
-- 그것은 계승 대상을 확인하지 않고 쓴 것이라 여기서 뒤집는다. 이유는 셋.
--   1. secret 키를 아예 다루지 않아도 된다. 유출 위험이 사라진다
--   2. 누가 바꿨는지 사람 단위로 남는다. 키에는 사람이 없다
--   3. M3 손님 로그인과 같은 Auth 를 쓴다. 따로 만들지 않아도 된다

-- ── 누가 관리자인가 ─────────────────────────────────────────
-- 이메일을 정책에 직접 박지 않고 표로 둔다. 박아 두면 사람이 늘 때마다
-- 마이그레이션을 새로 써야 한다.
create table if not exists admin_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- **정책을 하나도 만들지 않는다.** 그래서 이 표는 API 로 읽을 수 없다.
-- 관리자 명단이 밖으로 새지 않아야 한다.
alter table admin_emails enable row level security;

insert into admin_emails (email) values
  ('jerry.narae@gmail.com'),
  ('seora0825@gmail.com')
on conflict (email) do nothing;

-- ── 판정 함수 ───────────────────────────────────────────────
-- security definer 라 admin_emails 의 RLS 를 지나서 읽는다. 이게 없으면
-- 위에서 표를 잠근 탓에 정책이 늘 거짓이 된다.
--
-- search_path 를 고정하는 것은 필수다. 안 그러면 호출자가 search_path 를
-- 바꿔 같은 이름의 가짜 표를 가리키게 만들 수 있다.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_emails
    where email = auth.jwt() ->> 'email'
  );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;

-- ── 상품 ────────────────────────────────────────────────────
-- 정책은 OR 로 합쳐진다. 손님은 products_read_public 으로 공개된 것만
-- 보고, 관리자는 아래 정책으로 감춘 것까지 보고 쓴다.
create policy products_admin_all on products
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy product_variants_admin_all on product_variants
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── 사진 ────────────────────────────────────────────────────
-- 읽기는 0002 의 product_images_read_public 이 이미 누구에게나 열어 두었다.
-- 여기서는 올리고 지우는 것만 관리자에게 연다.
create policy product_images_admin_write on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and is_admin());

create policy product_images_admin_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

create policy product_images_admin_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and is_admin());
