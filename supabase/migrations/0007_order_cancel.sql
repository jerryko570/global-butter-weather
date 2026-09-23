-- 0007 — 주문 취소. **깎았던 재고를 되돌린다**
--
-- 웹훅이 생기면서 필요해졌다. 포트원 콘솔에서 취소를 걸거나 결제사가
-- 취소를 통지하면 우리 쪽도 따라가야 하는데, `mark_order_paid()` 가
-- 깎아둔 재고를 **되돌리는 쪽이 없었다.**
--
-- 2026-09-22에 실제로 그랬다. 콘솔에서 환불했는데 주문은 `paid` 인 채
-- 재고가 깎여 있었고, 손으로 되돌렸다.
--
-- ⚠️ **다시 실행해도 되게 썼다.** 컬럼은 `if not exists`, 함수는
-- `create or replace` 다.

-- ── 취소의 흔적 ─────────────────────────────────────────────
-- 언제·왜 취소됐는지가 남지 않으면 나중에 아무도 설명하지 못한다
alter table orders add column if not exists cancelled_at  timestamptz;
alter table orders add column if not exists cancel_reason text;

-- ── mark_order_cancelled ────────────────────────────────────
--
-- `mark_order_paid()` 의 거울이다. 그쪽이 깎았으면 이쪽이 되돌린다.
--
-- **되돌리는 것은 `paid` 였을 때뿐이다.** `pending` 은 애초에 깎은 적이
-- 없어서 되돌릴 것이 없다 — 그때 재고를 더해주면 **없던 재고가 생긴다.**
--
-- 두 번 불려도 괜찮다. 결제사는 같은 통지를 여러 번 보낸다.
create or replace function mark_order_cancelled(
  p_order_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  cur  order_status;
begin
  select status into cur from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 이미 취소됐으면 아무것도 하지 않는다. **여기서 그냥 돌아가지 않으면
  -- 재시도가 올 때마다 재고가 늘어난다**
  if cur = 'cancelled' then
    return;
  end if;

  -- 보낸 물건은 이 함수로 취소하지 않는다. 반품은 다른 일이다
  if cur in ('shipped', 'done') then
    raise exception 'ORDER_ALREADY_SHIPPED' using errcode = 'P0001';
  end if;

  if cur = 'paid' then
    for item in
      select variant_id, quantity from order_items where order_id = p_order_id
    loop
      -- 옵션이 지워진 뒤라면 되돌릴 자리가 없다. 주문 취소 자체는 계속한다
      if item.variant_id is not null then
        update product_variants
           set stock = stock + item.quantity
         where id = item.variant_id;
      end if;
    end loop;
  end if;

  update orders
     set status = 'cancelled',
         cancelled_at = now(),
         cancel_reason = p_reason
   where id = p_order_id;
end;
$$;

revoke all on function mark_order_cancelled(uuid, text) from public;
-- 손님이 직접 부르지 못한다. 재고를 늘리는 함수라 더욱 그렇다 —
-- 아무나 부를 수 있으면 재고를 무한히 만들 수 있다
grant execute on function mark_order_cancelled(uuid, text) to service_role;
