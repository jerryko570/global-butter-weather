# Butter Weather Shop — 프로젝트 컨텍스트

이 파일은 Claude Code가 매 작업마다 참고하는 프로젝트 기준 문서다.

## 개요

14년차 디자이너가 직접 설계·개발하는 디자인 편집샵. 비즈키링·팔찌 등 핸드메이드 악세사리 판매.

- **한국 시장 먼저** → 미국·중국 확장.
- 사이트는 다국가 대응이 가능한 구조로 짓되, 마케팅은 한 시장씩 순차로.

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + Storage) — DB / 인증 / 이미지 저장
- TanStack Query (서버 상태) + Zustand (클라이언트 상태)
- Framer Motion
- 결제: **Toss Payments (국내, 우선 구현)**, 해외(Stripe/PortOne)는 나중
- 배포: Vercel

## 아키텍처 핵심 (중요)

- **어드민과 판매 사이트는 같은 레포, 같은 Next.js 앱.** 어드민은 `/admin` 라우트일 뿐.
- 둘은 직접 연결되지 않는다. **공유 Supabase DB를 통해 연결됨**: 어드민이 쓰고(write), 사이트가 읽는다(read).
- 상품 CRUD는 `supabase-js` 직접 호출(`lib/queries` 훅). 이걸 위한 별도 API는 만들지 않는다.
- 직접 만드는 API(`app/api` Route Handlers)는 **결제·주문·웹훅에만** — 시크릿 키가 필요한 서버 작업만.
- 보안은 RLS로 처리: 공개는 published 상품 읽기만, 쓰기는 관리자 이메일만.

## 폴더 구조

```
src/
  app/
    (shop)/          # 공개 사이트 (홈, products 목록·상세, cart, checkout)
    admin/           # 어드민 (middleware로 보호)
    (auth)/          # 로그인
    api/             # 결제·웹훅 (Route Handlers)
    styles/theme.css # 브랜드 디자인 토큰
  components/        # 공유 UI 컴포넌트
  lib/
    supabase/        # client / server 분리
    queries/         # TanStack Query 훅 (어드민·사이트 공유)
    utils/           # cn, formatPrice 등
  middleware.ts      # /admin 보호
```

## 디자인 시스템

- 컬러: Butter `#F5C842` (메인), Sky `#A8D8EA` (서브), Cloud `#F7F7F7` (배경), Ink `#1A1A1A` (텍스트)
- 폰트: Pretendard (국문), Inter (영문·숫자)
- **어드민은 기능 우선, 꾸밈 최소.** 고객용 사이트는 디자이너 본인이 디자인을 주도한다.

## DB 스키마 (Supabase)

현재 Supabase에 생성되어 있는 테이블:

| 테이블             | 역할                                                         |
| ------------------ | ------------------------------------------------------------ |
| `products`         | 상품 (아래 확정 스키마)                                      |
| `orders`           | 주문 헤더 (주문자·총액·상태)                                 |
| `order_items`      | 주문 항목 (주문 ↔ 상품, 수량·가격)                           |
| `purchases`        | 결제·구매 기록 (`payment_id` 유니크 인덱스 → 중복 결제 방지) |
| `profiles`         | 사용자 프로필 (`auth.users` 연동)                            |
| `analytics_events` | 커스텀 퍼널 분석 이벤트                                      |

⚠️ `products` 외 테이블의 **정확한 컬럼은 Supabase Table Editor에서 직접 확인**할 것. 아래는 확정된 `products` 스키마만 명시.

### products (확정 — 2026-06-15 실DB 실측 기준)

> ⚠️ 이 프로젝트는 다국가 대응으로 진화해서, 초기 설계(단일 `price`/`is_published`/`sort_order`)와 컬럼이 달라졌다. 아래가 **실제 라이브 DB**다. 위쪽 대화 로그에 남은 옛 스키마는 무시할 것.

```sql
create table products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,            -- /products/[slug]
  name           text not null,                   -- 국문 이름
  name_en        text,                            -- 영문 이름 (nullable)
  description    text,                             -- 국문 설명 (nullable)
  description_en text,                             -- 영문 설명 (nullable)
  price_krw      integer not null,                -- 원 단위 정수 (소수점 X)
  price_usd      numeric,                          -- USD 가격 (nullable) ※ 정확한 정밀도는 Table Editor 확인
  stock          integer not null default 0,
  images         text[] not null default '{}',    -- Storage public URL 배열
  category       text,                            -- 'keyring' | 'bead' | 'etc' (nullable)
  tags           text[] not null default '{}',
  status         text not null default 'active',  -- 판매 상태: 'active' | 'sold_out' (공개여부 아님!)
  is_active      boolean not null default false,  -- ★ 공개(노출) 여부 = "published" 플래그
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table products enable row level security;

-- 공개: 노출(is_active=true) 상품만 읽기. 초안은 손님에게 안 보임.
create policy "public read published"
on products for select
using (is_active = true);

create policy "admin manage"
on products for all
to authenticated
using    ( (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE' )
with check ( (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE' );
```

- **공개 여부 = `is_active`** (옛 문서의 `is_published` 아님). 목록·상세 훅은 항상 `.eq('is_active', true)`로 published만 가져온다.
- **`status`는 판매 상태**(`active`/`sold_out`)일 뿐, 공개 여부와 무관 — 혼동 금지.
- 가격: 국내는 `price_krw`(원 단위 정수). 해외는 `price_usd`.
- Storage 버킷 `product-images` — **공개 읽기로 생성됨(2026-06-15).** 업로드 제한(관리자만) 정책은 어드민 구현 시 추가. 기본값은 service-role 외 쓰기 차단이라 그때까진 안전.
- `ADMIN_EMAIL_HERE`는 실제 관리자 이메일로 교체.
- RLS 실측(2026-06-15): 읽기는 `is_active=true`만 노출, anon 쓰기는 차단됨 — 정상 동작 확인.

## 빌드 순서 (전체)

1. **Supabase 토대** — products 스키마 + RLS + Storage 버킷 + `lib/supabase` 클라이언트 + `lib/queries` 상품 훅. ← **오늘 여기까지**
2. **얇은 어드민** — `/admin` 보호 + 상품 목록 + 등록/수정 폼 + 이미지 업로드.
3. **사이트** — products 목록 + 상세, 실제 상품 데이터 위에. 브랜드 디자인 적용.
4. **장바구니(Zustand) → Toss 체크아웃** — orders/purchases + 결제 + 웹훅.

## 🎯 오늘 작업 범위 (여기까지만)

**목표: Supabase 토대 완성. 어드민·사이트·결제는 절대 손대지 않는다.**

이미 완료:

- Supabase 프로젝트 생성, `.env.local` → 클라이언트 연결
- 테이블 생성 (`products` 포함)
  오늘 마무리할 것:
- `products` RLS 정책 + `product-images` Storage 버킷 적용 확인
- `lib/supabase` — `@supabase/ssr` 기반 브라우저/서버 클라이언트 분리
- `lib/queries` — 상품 목록 select 훅 + slug 상세 select 훅 (TanStack Query, published만)
  오늘 **하지 않을 것**:
- 어드민 UI(`/admin`), 로그인, 사이트 페이지, 결제 — 전부 다음 작업으로.

## 작업 원칙

- **한 번에 한 기능씩.** 정해진 "오늘 작업 범위"를 넘지 말 것.
- 어드민은 절대 부풀리지 말 것 — v1은 상품 CRUD + 이미지 업로드만. (대시보드·통계·일괄업로드·권한관리 금지)
- RLS는 대충 넘기지 말 것. 쓰기는 반드시 관리자 이메일로 제한.
- 가격은 원 단위 정수로 다룬다.
- 커밋 컨벤션: ✨ Feature / ♻️ Refactor / 🐛 Fix / 🎨 Style / 📝 Docs / ⚙️ Chore
