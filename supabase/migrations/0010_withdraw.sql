-- 0010 — 회원 탈퇴. **개인정보는 지우고 거래 기록은 남긴다**
--
-- 법이 거래 기록을 5년 보관하라고 한다(전자상거래법). 그래서 주문을
-- 통째로 지울 수 없다. 대신 **누구 것인지 알 수 없게 만든다.**
--
-- ⚠️ **다시 실행해도 되게 썼다** (schema.md 7-8절).

-- ── 걸림돌 ──────────────────────────────────────────────────
-- orders.user_id 가 `not null references auth.users on delete restrict`
-- 였다. **주문이 하나라도 있으면 계정을 지울 수 없다.**
--
-- `set null` 로 바꾼다 — 계정을 지우면 주문은 남고 연결만 끊어진다.
-- 그러면 RLS 의 `user_id = auth.uid()` 가 아무에게도 참이 되지 않아
-- **남은 주문은 관리자만 볼 수 있다.** 그게 맞는 상태다.
alter table orders alter column user_id drop not null;

do $$ begin
  alter table orders drop constraint if exists orders_user_id_fkey;
  alter table orders
    add constraint orders_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;
end $$;

-- ── 탈퇴 흔적 ───────────────────────────────────────────────
-- 언제 지워졌는지가 없으면 「이 주문은 왜 주인이 없나」에 답하지 못한다
alter table orders add column if not exists withdrawn_at timestamptz;

-- ── 개인정보를 지운다 ───────────────────────────────────────
--
-- **금액·상품·날짜는 그대로 둔다.** 그것이 법이 보관하라는 「거래 기록」
-- 이고, 개인을 가리키지 않는다.
--
-- 지우는 것은 배송지다 — 이름·연락처·주소·메모. 메모에도 개인정보가
-- 들어갈 수 있으므로 함께 비운다.
--
-- ⚠️ **되돌릴 수 없다.** 그래서 부르는 쪽에서 배송 중인 주문이 없는지
-- 먼저 본다 (`account/actions.ts`).
create or replace function anonymize_orders_of(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  touched integer;
begin
  update orders
     set shipping_info = jsonb_build_object(
           'name', '탈퇴한 회원',
           'phone', '',
           'zipcode', '',
           'address', '',
           'addressDetail', '',
           'memo', ''
         ),
         withdrawn_at = now()
   where user_id = p_user_id
     and withdrawn_at is null;

  get diagnostics touched = row_count;
  return touched;
end;
$$;

-- **손님이 직접 부르지 못한다.** 남의 주문을 지울 수 있는 함수다.
-- 역할을 이름으로 적어 거둬들인다 (schema.md 7-6절)
revoke execute on function anonymize_orders_of(uuid) from public, anon, authenticated;
grant  execute on function anonymize_orders_of(uuid) to service_role;
