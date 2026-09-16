-- 상품과 옵션. 설계 근거는 docs/dev/schema.md
--
-- 옛 레포(jerryko570/butter-weather-shop)의 products 를 계승하되,
-- **옵션마다 가격과 재고가 다르다**는 요건 때문에 한 군데를 크게 바꿨다.
-- 옛 쪽은 options 가 문자열 배열이라 옵션별 값을 담을 수 없었다.
--
-- 옛 쪽은 테이블을 대시보드에서 손으로 만들어 재현할 방법이 없었다.
-- 여기서는 파일로 남긴다 — 프로젝트를 다시 만들어도 이 파일로 복원된다.

-- ── 카테고리 ────────────────────────────────────────────────
-- 2026-09-16 확정. **소재가 아니라 형태로 나눈다** (foundation.md 8절 1번).
-- 「기타」는 두지 않는다. 형태가 다른 것이 나오면 그때 값을 늘린다.
-- enum 인 이유는 값을 늘릴 때 반드시 마이그레이션을 거치게 하려는 것이다.
create type product_category as enum ('keyring', 'bracelet', 'necklace');

-- 판매 상태. **노출 여부(is_active)와 다른 축이다.**
-- 품절이어도 보여줘야 하고, 준비 중이면 팔 수 있어도 감춰야 한다.
create type product_status as enum ('active', 'sold_out');

-- ── products — 「물건」 ──────────────────────────────────────
-- 가격과 재고가 여기 없다. 그것은 파는 단위(variant)의 성질이다.
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,

  -- 한국어가 기준이고 영어는 없을 수 있다. 3절 「하나의 카탈로그에
  -- 언어가 옵션으로 붙는 구조」 — 언어별로 행을 나누지 않는다.
  name        text not null,
  name_en     text,
  description      text,
  description_en   text,

  category    product_category not null,
  tags        text[] not null default '{}',

  -- 대표/갤러리와 상세 설명 이미지를 나눈다. 상세는 세로로 길게 쌓이는
  -- 스마트스토어식이라 성격이 다르다. 한 배열에 섞으면 목록 썸네일에
  -- 설명 이미지가 뜬다.
  images         text[] not null default '{}',
  detail_images  text[] not null default '{}',

  status      product_status not null default 'active',
  is_active   boolean not null default false,   -- 기본은 **감춤**

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── product_variants — 「파는 단위」 ─────────────────────────
-- 옵션마다 가격과 재고가 다르다. 그래서 배열이 아니라 테이블이다.
--
-- **variant 가 없는 product 는 팔 수 없다.** 제약으로 강제하지 않고
-- 구조로 둔다 — 아래 products_public 뷰가 그런 상품을 걸러낸다.
-- 옵션이 하나뿐인 물건도 variant 를 하나 만든다(예: 이름 '기본').
-- 가격과 재고가 한 군데에만 있게 하려는 것이다.
create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,

  name        text not null,            -- '그린' · '14cm' · '기본'
  name_en     text,

  -- 가격은 정수로 다룬다(원 단위). 통화별로 컬럼을 나눈다 (CLAUDE.md 8절).
  -- 환율로 계산하지 않는다 — 통화마다 값을 따로 정한다.
  price_krw   integer not null check (price_krw >= 0),
  price_usd   integer check (price_usd >= 0),   -- 센트 단위

  stock       integer not null default 0 check (stock >= 0),
  is_active   boolean not null default true,
  position    integer not null default 0,       -- 화면에 보이는 순서

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- 한 상품 안에서 옵션 이름은 겹치지 않는다
  unique (product_id, name)
);

create index product_variants_product_idx
  on product_variants (product_id, position);

-- 목록은 「공개된 것을 최신순으로」가 기본이고 카테고리로 거른다.
create index products_public_idx
  on products (is_active, category, created_at desc);

-- ── updated_at 자동 갱신 ────────────────────────────────────
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

create trigger product_variants_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
-- CLAUDE.md 8절: 「공개는 읽기만, 쓰기는 관리자로 제한」. 대충 넘기지 않는다.
alter table products enable row level security;
alter table product_variants enable row level security;

-- 읽기 — 누구나. 단 **공개된 것만.** is_active=false 는 밖에서 안 보인다.
create policy products_read_public on products
  for select using (is_active = true);

-- variant 도 마찬가지이되, **딸린 상품이 공개된 경우에만** 보인다.
-- 이게 없으면 감춘 상품의 가격이 variant 를 통해 새어 나간다.
create policy product_variants_read_public on product_variants
  for select using (
    is_active = true
    and exists (
      select 1 from products p
      where p.id = product_variants.product_id and p.is_active = true
    )
  );

-- 쓰기 — 정책을 만들지 않는다. anon·publishable 어느 쪽도 쓰지 못한다.
-- 관리자 작업은 secret 키로만 한다(RLS를 우회한다). 그 키는 서버에서만
-- 쓰고 브라우저로 내보내지 않는다.

-- ── 목록용 뷰 ───────────────────────────────────────────────
-- 화면은 「최저가부터」와 「살 수 있나」를 알아야 하는데, 그걸 매번
-- 앱에서 계산하면 규칙이 화면마다 흩어진다. 한 군데에 둔다.
--
-- security_invoker=true — 뷰가 아니라 **조회하는 사람**의 권한으로
-- 아래 테이블을 읽는다. 없으면 RLS 를 우회해 감춘 상품이 새어 나간다.
create view products_public
  with (security_invoker = true)
as
select
  p.*,
  min(v.price_krw)               as min_price_krw,
  min(v.price_usd)               as min_price_usd,
  coalesce(sum(v.stock), 0)      as total_stock,
  count(v.id)                    as variant_count
from products p
join product_variants v on v.product_id = p.id
group by p.id;
