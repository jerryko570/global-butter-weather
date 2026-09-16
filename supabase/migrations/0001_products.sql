-- 상품 테이블. 설계 근거는 docs/dev/schema.md
--
-- 옛 레포(jerryko570/butter-weather-shop)의 products 테이블을 계승한다.
-- 그 쪽은 대시보드에서 손으로 만들어 재현할 방법이 없었다. 여기서는
-- 파일로 남긴다 — 프로젝트를 다시 만들어도 이 파일 하나로 복원된다.

-- ── 카테고리 ────────────────────────────────────────────────
-- 2026-09-16 확정. **소재가 아니라 형태로 나눈다** (foundation.md 8절 1번).
-- 「기타」는 두지 않는다. 형태가 다른 것이 나오면 그때 값을 늘린다.
create type product_category as enum ('keyring', 'bracelet', 'necklace');

-- 판매 상태. **노출 여부(is_active)와 다른 축이다.**
-- 품절이어도 보여줘야 하고, 준비 중이면 팔 수 있어도 감춰야 한다.
create type product_status as enum ('active', 'sold_out');

create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,

  -- 한국어가 기준이고 영어는 없을 수 있다. 3절 「하나의 카탈로그에
  -- 언어가 옵션으로 붙는 구조」 — 언어별로 행을 나누지 않는다.
  name        text not null,
  name_en     text,
  description      text,
  description_en   text,

  -- 가격은 정수로 다룬다(원 단위). 통화별로 컬럼을 나눈다 (CLAUDE.md 8절).
  -- 환율로 계산하지 않는다 — 통화마다 값을 따로 정한다.
  price_krw   integer not null check (price_krw >= 0),
  price_usd   integer check (price_usd >= 0),        -- 센트 단위

  stock       integer not null default 0 check (stock >= 0),

  category    product_category not null,
  tags        text[] not null default '{}',
  options     text[] not null default '{}',          -- 예: ['그린','블루']

  -- 대표/갤러리와 상세 설명 이미지를 나눈다. 상세는 세로로 길게 쌓이는
  -- 스마트스토어식이라 성격이 다르다.
  images         text[] not null default '{}',
  detail_images  text[] not null default '{}',

  status      product_status not null default 'active',
  is_active   boolean not null default false,        -- 기본은 **감춤**

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 목록은 「공개된 것을 최신순으로」가 기본이고 카테고리로 거른다.
create index products_public_idx
  on products (is_active, category, created_at desc);

-- updated_at 자동 갱신
create function set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
-- CLAUDE.md 8절: 「공개는 읽기만, 쓰기는 관리자로 제한」. 대충 넘기지 않는다.
alter table products enable row level security;

-- 읽기 — 누구나. 단 **공개된 것만.** is_active=false는 밖에서 안 보인다.
create policy products_read_public on products
  for select
  using (is_active = true);

-- 쓰기 — 정책을 만들지 않는다. anon·authenticated 어느 쪽도 쓰지 못한다.
-- 관리자 작업은 service_role 키로만 한다(RLS를 우회한다). 그 키는
-- 서버에서만 쓰고 브라우저로 내보내지 않는다.
