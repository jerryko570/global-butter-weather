# 데이터베이스 스키마

확정 SQL은 [`supabase/migrations/`](../../supabase/migrations/)에 있다. **이 문서는 왜 그렇게 짰는지**를 적는다.

> ⚠️ **아직 실행되지 않았다.** Supabase 프로젝트는 만들어졌지만(`ghrpcggsjgiiitxjqdsw`) 테이블은 아직 없다. 실행하고 나면 이 줄을 지운다.

## 0. 옛 레포에서 계승한다

[`jerryko570/butter-weather-shop`](https://github.com/jerryko570/butter-weather-shop)에 이미 돌아가는 스키마가 있었다. `src/types/product.ts`가 실제 테이블 컬럼과 1:1로 적혀 있어 그대로 읽을 수 있었다. 디자인을 계승한 것과 같은 이유로 **데이터 모델도 계승한다.**

**다만 옛 쪽은 테이블을 Supabase 대시보드에서 손으로 만들어 재현할 방법이 없었다.** 프로젝트가 날아가면 기억으로 다시 만들어야 한다. 여기서는 `.sql` 파일로 남긴다.

## 1. 가장 크게 바꾼 것 — 옵션이 테이블이 됐다 ★

옛 쪽은 이랬다.

```ts
options: string[]   // ['그린','블루']
price_krw: number   // 상품에 하나
stock: number       // 상품에 하나
```

**이 구조로는 옵션마다 가격과 재고를 다르게 둘 수 없다.** 이나래의 요건이 그것이라(2026-09-16) 옵션을 테이블로 올렸다.

```
products            — 「물건」. 이름·설명·사진·카테고리
product_variants    — 「파는 단위」. 가격·재고
```

**가격과 재고가 `products`에 없다.** 그것은 파는 단위의 성질이지 물건의 성질이 아니다. 같은 팔찌라도 14cm와 16cm는 값과 남은 수가 다르다.

### variant 가 없는 상품은 팔 수 없다

옵션이 하나뿐인 물건도 **variant 를 하나 만든다** (이름은 `기본` 등).

번거로워 보이지만 이유가 있다 — **가격과 재고가 두 군데에 있으면 반드시 어긋난다.** 「variant 가 있으면 variant 값, 없으면 상품 값」 같은 규칙은 코드 여기저기에 흩어지고 언젠가 한쪽만 고쳐진다. 한 군데로 모은다.

제약으로 강제하지는 않았다. 대신 `products_public` 뷰가 variant 없는 상품을 **자동으로 걸러낸다.** 실수로 만들어도 손님에게 안 보인다.

## 2. products

### 카테고리는 형태다

```sql
create type product_category as enum ('keyring', 'bracelet', 'necklace');
```

2026-09-16 확정 (foundation.md 8절 1번). 옛 쪽은 `'keyring' | 'bead' | 'etc'`였는데 **`bead`는 소재 이름**이었다. 지금은 형태로 나눈다 — 비즈로 만들지 않은 팔찌가 나와도 카테고리는 그대로다.

**`etc`를 두지 않는다.** 빈 칸이 있으면 애매한 것이 거기로 밀려나 분류가 흐려진다. 형태가 다른 것이 나오면 그때 enum 값을 늘린다.

> `text`가 아니라 enum 인 것은 **값을 늘릴 때 반드시 마이그레이션을 거치게** 하려는 것이다. `text`면 오타가 그대로 새 카테고리가 된다.

### 판매 상태와 노출 여부는 다른 축이다 ★

```sql
status     product_status not null default 'active'   -- active | sold_out
is_active  boolean not null default false             -- 공개 여부
```

옛 쪽 타입에 *"is_active=노출여부와 혼동 주의"*라고 적혀 있었다. 둘은 섞이기 쉬운데 **섞으면 안 된다.**

|                              |                                          |
| ---------------------------- | ---------------------------------------- |
| **품절인데 보여야 한다**     | 있었다는 것을 알려야 재입고를 기다린다   |
| **팔 수 있는데 감춰야 한다** | 사진이 아직 없거나 공개 시점을 맞추는 중 |

`is_active`의 기본값이 **`false`(감춤)**인 것이 중요하다. 실수로 만든 행이 손님에게 보이지 않는다.

### 이미지가 두 종류다

```sql
images         text[]   -- 대표·갤러리
detail_images  text[]   -- 상세 설명용
```

앞은 목록과 상세 상단에 쓰는 사진이고, 뒤는 **세로로 길게 쌓이는 스마트스토어식 설명 이미지**다. 한 배열에 섞으면 목록 썸네일에 설명 이미지가 뜬다.

## 3. product_variants

```sql
price_krw  integer not null check (price_krw >= 0),
price_usd  integer check (price_usd >= 0),   -- 센트 단위
stock      integer not null default 0,
position   integer not null default 0,
unique (product_id, name)
```

- **가격은 정수, 통화별 컬럼.** CLAUDE.md 8절 그대로다. **환율로 계산하지 않는다** — 통화마다 값을 따로 정한다. 21,000원을 환율로 바꾸면 $15.23 같은 값이 나오는데 그렇게 팔지 않는다
- `price_usd`는 null 이 될 수 있다. 해외에 안 파는 물건이 있을 수 있다
- `position`은 화면에 보이는 순서. 이름순·가격순으로 정렬하면 「작은 것부터」 같은 의도를 담을 수 없다
- 한 상품 안에서 **옵션 이름은 겹치지 않는다**

## 4. RLS — 읽기만 열고 쓰기는 닫는다

```sql
create policy products_read_public on products
  for select using (is_active = true);
```

**읽기는 누구나, 단 공개된 것만.** `is_active = false`인 행은 조회 자체가 안 된다 — 숨김 처리가 아니다.

variant 에도 같은 정책을 걸되 **딸린 상품이 공개된 경우에만** 보이게 했다. 이게 없으면 **감춘 상품의 가격이 variant 를 통해 새어 나간다.**

**쓰기 정책은 만들지 않는다.** 정책이 없으면 RLS 가 전부 막는다. 관리자 작업은 secret 키로 하고, 그 키는 **서버에서만 쓰고 브라우저로 내보내지 않는다.**

> 관리자 화면이 생기면 그때 「관리자만 쓰기」 정책을 따로 판단한다. 지금은 관리자 화면이 없으므로 **아무도 못 쓰는 상태가 가장 안전하다.**

## 5. products_public 뷰

화면은 「얼마부터인가」와 「살 수 있나」를 알아야 한다. 그걸 매번 앱에서 계산하면 규칙이 화면마다 흩어진다.

```sql
create view products_public with (security_invoker = true) as
select p.*, min(v.price_krw) as min_price_krw, ...
from products p join product_variants v on v.product_id = p.id
group by p.id;
```

- `join` 이라서 **variant 없는 상품은 나오지 않는다** (1절)
- **`security_invoker = true` 가 핵심이다.** 없으면 뷰가 소유자 권한으로 읽어 **RLS 를 우회하고 감춘 상품이 새어 나간다.** 뷰를 새로 만들 때마다 이 옵션을 확인할 것

## 6. API 키 — publishable 을 쓴다 (2026-09-16 확인)

Supabase 가 `anon`·`service_role` 키를 **2026년 말에 제거**한다. 새 이름은 `sb_publishable_*`·`sb_secret_*`이다.

**실제로 쏴서 확인했다.** 둘 다 `supabase-js` 방식(`apikey` + `Authorization: Bearer`)으로 인증에 성공한다 — 없는 테이블을 조회해 `PGRST205`(인증은 됨, 테이블 없음)가 오는 것으로 확인했다.

> 새 키는 `Authorization: Bearer` 로 못 보낸다는 글이 있으나 **이 프로젝트에서는 동작했다.** 문서가 아니라 실측이 기준이다.

`.env.local` 과 Vercel 환경변수에 **publishable 키를 넣는다.** anon 키는 쓰지 않는다 — 지금 쓰면 올해 안에 다시 바꿔야 한다.

**secret 키는 저장소에도 이 문서에도 두지 않는다.** 필요해지면 Vercel 환경변수에 직접 넣는다.

## 7. 아직 짜지 않은 것

- **orders · order_items** — 결제가 붙을 때. 옛 레포에 설계가 있다(주문 시점 가격·이름을 박제하는 스냅샷 구조). 계승할 것
- **이미지 저장소** — Supabase Storage 버킷과 정책
- **재고 차감** — `stock` 컬럼만 있고 줄이는 로직이 없다. 주문과 같이 판단한다

## 8. 실행 순서

1. Supabase 대시보드 → **SQL Editor** 에 `0001_products.sql` 붙여넣고 실행
2. `.env.local` 에 `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Vercel 환경변수에도 같은 둘
4. `next.config.ts` 이미지 호스트를 새 프로젝트 도메인으로 교체
5. 이 문서 맨 위의 「아직 실행되지 않았다」 줄 삭제
