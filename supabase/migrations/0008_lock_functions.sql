-- 0008 — **함수를 손님에게서 닫는다.** 보안 수정
--
-- ⚠️ 이것은 실제로 뚫려 있던 구멍이다. 2026-09-23에 확인했다.
--
-- `mark_order_paid()` 는 `security definer` 라 RLS 를 지나간다. 그래서
-- 「service_role 만 부를 수 있다」고 적고 이렇게 썼다.
--
--     revoke all on function mark_order_paid(...) from public;
--     grant execute on function mark_order_paid(...) to service_role;
--
-- **`from public` 은 모자랐다.** Supabase 는 새 함수의 실행 권한을
-- `anon` · `authenticated` 에게 **따로** 준다(default privileges). `public`
-- 에서 거둬들여도 그 둘의 권한은 남는다.
--
-- 실측으로 확인한 것 — 로그인하지 않은 키로 `mark_order_paid()` 를 불렀더니
-- 권한 오류가 아니라 **함수 안에서 나온 `ORDER_NOT_PENDING`** 이 돌아왔다.
-- 함수가 실행됐다는 뜻이다.
--
-- ## 무엇을 할 수 있었나
--
-- 손님은 RLS 로 **자기 주문의 `id` 를 읽을 수 있다.** 그 id 로
-- `mark_order_paid(id, 'x', 'y')` 를 부르면 **결제하지 않고 주문이 완료된다.**
-- 재고까지 깎인다. `mark_order_cancelled()` 는 반대로 **재고를 늘릴 수 있다.**
--
-- ## 왜 이렇게 고치나
--
-- 역할마다 명시적으로 거둬들인다. 남기는 것은 `service_role` 뿐이고,
-- 그 키는 서버에만 있다 (`lib/supabase/admin.ts`).
--
-- ⚠️ **앞으로 `security definer` 함수를 만들 때마다 이 세 줄을 같이 쓸 것.**
-- `revoke ... from public` 하나로는 닫히지 않는다.

-- ── 돈과 재고를 움직이는 함수 ───────────────────────────────
revoke execute on function mark_order_paid(uuid, text, text) from public, anon, authenticated;
grant  execute on function mark_order_paid(uuid, text, text) to service_role;

revoke execute on function mark_order_cancelled(uuid, text) from public, anon, authenticated;
grant  execute on function mark_order_cancelled(uuid, text) to service_role;

-- ── 주문번호 ────────────────────────────────────────────────
-- 손님이 직접 부를 일이 없다. 번호는 trigger 가 매긴다.
-- `set_order_no()` 가 security definer 라 **표의 주인 권한으로** 부르므로,
-- 여기서 닫아도 주문 생성은 그대로 된다.
revoke execute on function next_order_no() from public, anon, authenticated;
revoke execute on function set_order_no() from public, anon, authenticated;

-- ── 그대로 두는 것 ──────────────────────────────────────────
-- `is_admin()` 은 로그인한 사람이 직접 불러야 한다 — 어드민 화면의
-- 서버 동작이 「이 사람이 관리자인가」를 이걸로 묻는다 (`0003`).
-- 읽기만 하고 아무것도 바꾸지 않으므로 열어 두어도 된다.
grant execute on function is_admin() to authenticated;

-- `set_updated_at()` 은 trigger 전용이라 같이 닫는다
revoke execute on function set_updated_at() from public, anon, authenticated;
