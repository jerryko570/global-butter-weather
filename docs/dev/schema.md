# 데이터베이스 스키마

확정 SQL은 [`supabase/migrations/`](../../supabase/migrations/)에 있다. **이 문서는 왜 그렇게 짰는지**를 적는다.

> ⚠️ 아직 Supabase 프로젝트가 없다. 이 문서와 마이그레이션은 **설계이고 아직 실행되지 않았다.** 프로젝트가 생기면 실행하고 이 줄을 지운다.

## 0. 옛 레포에서 계승한다

[`jerryko570/butter-weather-shop`](https://github.com/jerryko570/butter-weather-shop)에 이미 돌아가는 스키마가 있었다. `src/types/product.ts`가 실제 테이블 컬럼과 1:1로 적혀 있어 그대로 읽을 수 있었다. 디자인을 계승한 것과 같은 이유로 **데이터 모델도 계승한다.** 이미 한 번 장사에 쓰인 모양이라 새로 상상하는 것보다 낫다.

**다만 한 가지는 고친다.** 옛 쪽은 테이블을 Supabase 대시보드에서 손으로 만들어 **재현할 방법이 없었다.** 프로젝트가 날아가면 기억으로 다시 만들어야 한다. 여기서는 `.sql` 파일로 남긴다.

## 1. products

### 카테고리는 형태다

```sql
create type product_category as enum ('keyring', 'bracelet', 'necklace');
```

2026-09-16에 확정됐다 (foundation.md 8절 1번). 옛 쪽은 `'keyring' | 'bead' | 'etc'`였는데 **`bead`는 소재 이름**이었다. 지금은 형태로 나눈다 — 비즈로 만들지 않은 팔찌가 나와도 카테고리는 그대로다.

**`etc`를 두지 않는다.** 빈 칸이 있으면 애매한 것이 거기로 밀려나 분류가 흐려진다. 형태가 다른 것이 나오면 그때 enum 값을 늘린다.

> enum으로 둔 것은 **값을 늘릴 때 반드시 마이그레이션을 거치게** 하려는 것이다. `text`로 두면 오타가 그대로 새 카테고리가 된다.

### 판매 상태와 노출 여부는 다른 축이다 ★

```sql
status     product_status not null default 'active'   -- active | sold_out
is_active  boolean not null default false             -- 공개 여부
```

옛 쪽 타입에 *"is_active=노출여부와 혼동 주의"*라고 적혀 있었다. 실제로 둘은 섞이기 쉬운데 **섞으면 안 된다.**

|                              |                                          |
| ---------------------------- | ---------------------------------------- |
| **품절인데 보여야 한다**     | 있었다는 것을 알려야 재입고를 기다린다   |
| **팔 수 있는데 감춰야 한다** | 사진이 아직 없거나 공개 시점을 맞추는 중 |

`is_active`의 기본값이 **`false`(감춤)**인 것이 중요하다. 실수로 만든 행이 손님에게 보이지 않는다.

### 가격은 정수, 통화별 컬럼

```sql
price_krw  integer not null check (price_krw >= 0),
price_usd  integer check (price_usd >= 0)   -- 센트 단위
```

CLAUDE.md 8절 그대로다. **환율로 계산하지 않는다** — 통화마다 값을 따로 정한다. 1,200원짜리를 환율로 바꾸면 $0.87 같은 값이 나오는데 그렇게 팔지 않는다.

`price_usd`는 null이 될 수 있다. 해외에 안 파는 물건이 있을 수 있다.

### 언어는 컬럼으로 붙인다

```sql
name     text not null,
name_en  text
```

3절 「지역별 사이트가 아니라 하나의 카탈로그에 언어가 옵션으로 붙는 구조」다. **언어별로 행을 나누지 않는다.** 한국어가 기준이고 영어는 없을 수 있다.

### 이미지가 두 종류다

```sql
images         text[]   -- 대표·갤러리
detail_images  text[]   -- 상세 설명용
```

성격이 다르다. 앞은 목록과 상세 상단에 쓰는 정사각·세로 사진이고, 뒤는 **세로로 길게 쌓이는 스마트스토어식 설명 이미지**다. 한 배열에 섞으면 목록에 설명 이미지가 썸네일로 뜬다.

## 2. RLS — 읽기만 열고 쓰기는 닫는다

```sql
alter table products enable row level security;

create policy products_read_public on products
  for select using (is_active = true);
```

**읽기는 누구나, 단 공개된 것만.** `is_active = false`인 행은 밖에서 아예 보이지 않는다 — 숨김 처리가 아니라 조회 자체가 안 된다.

**쓰기 정책은 만들지 않는다.** 정책이 없으면 RLS가 전부 막는다. 관리자 작업은 `service_role` 키로 하고, 그 키는 **서버에서만 쓰고 브라우저로 내보내지 않는다.**

> 관리자 화면이 생기면 그때 「관리자만 쓰기」 정책을 따로 판단한다. 지금은 관리자 화면이 없으므로 **아무도 못 쓰는 상태가 가장 안전하다.**

## 3. 아직 짜지 않은 것

- **orders · order_items** — 결제가 붙을 때. 옛 레포에 설계가 있다(주문 시점 가격·이름을 박제하는 스냅샷 구조). 계승할 것
- **이미지 저장소** — Supabase Storage 버킷과 정책
- **재고 차감** — `stock` 컬럼만 있고 줄이는 로직이 없다. 주문과 같이 판단한다

## 4. 프로젝트가 생기면 할 일

1. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `next.config.ts`의 이미지 호스트를 **새 프로젝트 도메인으로 교체** — 지금 옛 프로젝트 도메인(`ljjpgsmufioeixspkrpw.supabase.co`)이 박혀 있다 (CLAUDE.md 2절)
3. `supabase/migrations/0001_products.sql` 실행
4. 이 문서 맨 위의 「아직 실행되지 않았다」 줄 삭제
