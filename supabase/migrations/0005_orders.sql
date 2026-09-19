-- 주문. 설계 근거는 docs/dev/schema.md 「주문」절.
--
-- **옛 레포의 설계를 계승한다** — butter-weather-shop 의
-- `docs/design/checkout-data-model.md` (2026-07-08). 거기서 이미
-- orders(영수증 표지) + order_items(줄들) 로 정해 두었다.
--
-- 우리 쪽에서 달라진 곳은 **옵션**이다. 옛 쪽은 products.options 가
-- text[] 였고 order_items.option 이 그 문자열을 박제했다. 우리는
-- product_variants 테이블이 있어 어느 옵션이었는지 가리킬 수 있다.

-- ── 주문 상태 ───────────────────────────────────────────────
create type order_status as enum (
  'pending',    -- 주문서를 만들었고 결제를 기다린다
  'paid',       -- 결제됨. **이때 재고가 깎인다**
  'shipped',    -- 보냄
  'done',       -- 끝
  'cancelled'   -- 취소
);

-- ── orders — 영수증 표지 ────────────────────────────────────
create table orders (
  id          uuid primary key default gen_random_uuid(),

  -- **회원만 산다 (2026-09-19 확정).** 구글·카카오 OAuth 로 들어오므로
  -- 가입이라는 단계가 따로 없다 — 누르면 1~2초에 끝난다. 비회원 주문을
  -- 허용하면 「주문을 무엇으로 찾을 것인가」를 따로 만들어야 하는데,
  -- 그 값어치가 OAuth 한 번보다 크지 않다고 봤다.
  user_id     uuid not null references auth.users(id) on delete restrict,

  status      order_status not null default 'pending',

  -- 합계는 계산해서 다시 구하지 않고 **박제한다.** 나중에 가격이 바뀌어도
  -- 영수증의 숫자는 그때 그대로여야 한다.
  total_krw   integer not null check (total_krw >= 0),
  currency    text not null default 'KRW',

  -- 배송지. **회원 정보에서 끌어오지 않고 주문할 때 받는다** — OAuth 는
  -- 이름과 이메일만 주고, 주소는 어차피 주문마다 다를 수 있다.
  -- { name, phone, address, zipcode, memo }
  shipping_info jsonb not null,

  -- 전자상거래법상 개인정보 동의는 **필수**다. 마케팅은 선택이다.
  agree_privacy   boolean not null default false check (agree_privacy),
  agree_marketing boolean not null default false,

  -- 결제사를 스키마가 고르지 않는다. 무엇을 쓸지는 아직 미정이고
  -- (CLAUDE.md 1절), 둘 이상을 붙일 수도 있다
  payment_provider text,
  payment_id       text,
  paid_at          timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index orders_user_idx on orders (user_id, created_at desc);

-- ── order_items — 영수증의 줄들 ─────────────────────────────
--
-- **박제(snapshot)가 이 표의 존재 이유다.** 주문한 뒤에 상품 이름이나
-- 가격이 바뀌어도 영수증은 그때 그대로여야 한다. 그래서 이름·옵션 이름·
-- 단가를 복사해 들고 있고, **바뀌어도 되는 것(사진)만** product_id 로
-- 이어 본다.
create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,

  -- 상품이 지워져도 영수증은 남아야 한다. 그래서 restrict 가 아니라
  -- set null 이다 — 「그때 그 상품」은 아래 박제가 말해 준다
  product_id  uuid references products(id) on delete set null,
  variant_id  uuid references product_variants(id) on delete set null,

  -- 박제 📸
  product_name text    not null,
  variant_name text    not null,
  price_krw    integer not null check (price_krw >= 0),

  quantity    integer not null check (quantity between 1 and 999),
  created_at  timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table orders enable row level security;
alter table order_items enable row level security;

-- 손님은 **자기 주문만** 본다. 회원 필수라 이 한 줄로 끝난다
create policy orders_own on orders
  for select to authenticated
  using (user_id = auth.uid());

create policy orders_insert_own on orders
  for insert to authenticated
  with check (user_id = auth.uid());

-- 줄은 **부모 영수증이 자기 것일 때만** 보인다. 이게 없으면 남의 주문
-- 내역이 order_id 를 통해 새어 나간다
create policy order_items_own on order_items
  for select to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create policy order_items_insert_own on order_items
  for insert to authenticated
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- 손님은 주문을 **고치거나 지우지 못한다.** update·delete 정책을 만들지
-- 않는다. 취소는 관리자가 status 를 바꾸는 것이다 (아래 정책).
create policy orders_admin_all on orders
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy order_items_admin_all on order_items
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ── 결제 완료 ───────────────────────────────────────────────
--
-- **재고는 여기서 깎는다 (2026-09-19 확정).** 담을 때 깎으면 안 사고
-- 나간 사람의 재고가 묶이고, 주문 생성 때 잡아두려면 만료를 따로
-- 만들어야 한다. 지금은 동시에 주문이 몰리는 상황이 아니다.
--
-- 그래도 **조건부로 깎는다** — `where stock >= quantity` 다. 조건이
-- 안 맞으면 0행이 바뀌고, 그것이 곧 「재고 없음」이다. 읽고 나서 빼면
-- 그 사이에 남이 사 갈 수 있는데, 조건부 update 는 그 틈이 없다.
-- 공짜로 얻는 안전이라 안 쓸 이유가 없다.
--
-- 한 줄이라도 모자라면 **전체가 되돌아간다.** 함수 안에서 예외를
-- 던지면 트랜잭션이 통째로 취소되므로, 절반만 깎인 상태가 남지 않는다.
create or replace function mark_order_paid(
  p_order_id uuid,
  p_provider text,
  p_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  affected integer;
begin
  -- 같은 주문을 두 번 처리하지 않는다. 결제사가 완료 통지를 두 번
  -- 보내는 일은 드물지 않다
  perform 1 from orders
   where id = p_order_id and status = 'pending'
   for update;
  if not found then
    raise exception 'ORDER_NOT_PENDING' using errcode = 'P0001';
  end if;

  for item in
    select variant_id, quantity, product_name, variant_name
      from order_items where order_id = p_order_id
  loop
    -- 옵션이 지워졌으면 깎을 대상이 없다. 그것도 팔 수 없는 상태다
    if item.variant_id is null then
      raise exception 'VARIANT_GONE:%', item.product_name using errcode = 'P0002';
    end if;

    update product_variants
       set stock = stock - item.quantity
     where id = item.variant_id
       and stock >= item.quantity;

    get diagnostics affected = row_count;
    if affected = 0 then
      raise exception 'OUT_OF_STOCK:% %', item.product_name, item.variant_name
        using errcode = 'P0002';
    end if;
  end loop;

  update orders
     set status = 'paid',
         payment_provider = p_provider,
         payment_id = p_payment_id,
         paid_at = now()
   where id = p_order_id;
end;
$$;

revoke all on function mark_order_paid(uuid, text, text) from public;
-- 손님이 직접 부르지 못한다. **결제가 실제로 됐는지는 서버만 안다** —
-- 결제사 통지를 받은 서버가 secret 키로 부른다
grant execute on function mark_order_paid(uuid, text, text) to service_role;
