-- 배송비. 설계 근거는 docs/dev/schema.md 7-3절 「배송비」.
--
-- 다시 실행해도 되게 쓴다 (0004 에서 겪은 일, 0005 주석 참조).
--
-- **`total_krw` 의 뜻이 바뀐다.** 지금까지는 상품 합계였는데 이제
-- **손님이 내는 총액(상품 + 배송비)**이다. 영수증에 찍히는 숫자가
-- 그것이기 때문이다.
--
-- 기존 행은 배송비가 0 이라 값이 그대로 맞다.

alter table orders
  add column if not exists items_krw integer not null default 0
    check (items_krw >= 0);

alter table orders
  add column if not exists shipping_fee_krw integer not null default 0
    check (shipping_fee_krw >= 0);

-- 이미 있던 주문은 배송비가 없었다. 상품 합계 = 총액이다
update orders
   set items_krw = total_krw
 where items_krw = 0 and total_krw > 0;

comment on column orders.items_krw is
  '상품 합계. 배송비 판정(5만원 이상 무료)의 기준이 되는 값';
comment on column orders.shipping_fee_krw is
  '주문 시점의 배송비. **규칙이 바뀌어도 이 값은 그대로다** (박제)';
comment on column orders.total_krw is
  '손님이 내는 총액 = items_krw + shipping_fee_krw';
