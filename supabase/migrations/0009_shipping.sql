-- 0009 — 송장. **어느 택배사든 담을 수 있는 자리**
--
-- 택배사는 GS 포스트너로 정했지만(shipping-providers.md 2-5절), 물량이
-- 붙으면 계약 택배가 더 싸질 수 있다. **그때 스키마를 다시 고치지 않도록
-- 택배사를 값으로 담는다.**
--
-- 코드 목록은 `src/lib/carriers.ts` 에 있고 여기서 제약하지 않는다. DB 가
-- 목록을 들고 있으면 택배사 하나 늘릴 때마다 마이그레이션을 써야 한다.
--
-- ⚠️ **다시 실행해도 된다.** 전부 `if not exists` 다.

alter table orders add column if not exists carrier     text;
alter table orders add column if not exists tracking_no text;
alter table orders add column if not exists shipped_at  timestamptz;

-- 송장번호로 주문을 찾는 일이 생긴다 (고객 문의·오배송 확인)
create index if not exists orders_tracking_idx on orders (tracking_no)
  where tracking_no is not null;

comment on column orders.carrier is
  '택배사 코드. src/lib/carriers.ts 의 code 와 맞춘다 (cvsnet · cj · epost …)';
comment on column orders.tracking_no is
  '송장번호. 사람이 어드민에서 넣는다 — 발행 API 는 계약 물량이 있어야 열린다';
