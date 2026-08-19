# 04. JOIN + 전체 데이터 흐름 (컴포넌트 ↔ DB)

> 한 줄: **JOIN = 번호표(fk) 따라 다른 테이블 정보를 붙여오는 것. Supabase에선 `.select('*, 테이블(칸들)')` 한 줄.**

---

## 1. JOIN이 왜 필요한가 — 스냅샷(박제) 때문

`purchases`(주문)는 상품 정보를 **일부 복사(박제)**해둔다:
```
product_id    ← 번호표 (products.id 가리킴 = fk)
product_name  ← 박제! (그때 산 이름)
price_krw     ← 박제! (그때 낸 가격)
```

**왜 박제?** 나중에 상품 가격이 바뀌어도 **과거 주문 영수증이 안 흔들리게** 🧾
```
[구매] 18,000원 → purchases에 18000 박제
[3개월 뒤] 상품가 25,000원으로 인상 → products.price_krw = 25000
→ 옛 주문 영수증: 박제된 18,000원 ✅ (products에서 live로 읽으면 25,000원 ❌ 대참사)
```

→ **거래 시점 정보(이름·가격)는 박제** → 그래서 영수증 화면엔 JOIN 필요 없음.
→ **박제 안 된 최신 정보**(현재 사진 `images`, 현재 재고 `stock`, 주소 `slug`)가 필요할 때 → **JOIN**.

---

## 2. 번호표 → 코트 (fk → pk)

```
purchases.product_id  ──참조(references)──▶  products.id
   fk (가리키는 번호표)                        pk (원본)
```

- **pk** = 원본, 자기 자리. (purchases의 pk는 `id`! product_id 아님 ⚠️)
- **fk** = 그 pk를 가리키는 번호표.
- 이 연결은 **테이블 만들 때 이미 걸림**(references). 쿼리 땐 **따라가기만** 함.

⚠️ **자주 틀림: `product_id`는 pk가 아니라 fk다.** (pk는 `id`, 열쇠🔑 아이콘 붙은 것)

---

## 3. Supabase JOIN 문법

```ts
supabase
  .from('purchases')                    // 메인 테이블 = purchases
  .select('*, products(images, slug)')  // ★ 이 한 줄이 JOIN
```

문자열 뜯어보기 (⚠️ **따옴표 하나로 감싼 한 덩어리**):
```
'  *  ,  products( images, slug )  '
   ▲  ▲     ▲          ▲
   │  │   테이블      그 테이블의 칸
   │  └ "그리고 또"
   └ 메인(purchases) 전체 칸
```
- `*` = **메인 테이블(purchases)** 전체 칸 (products 전체가 아님!)
- `products(images, slug)` = 연결된 products에서 **그 칸만**
- `products(*)` = products 전체 칸

⚠️ **이 JOIN은 메인이 purchases일 때 씀.** `useProducts.ts`는 `.from('products')`라 여기 안 씀 → **purchases 읽는 새 훅**(예: `usePurchases`)에 넣는다.

---

## 4. 결과 = 중첩 객체 (상자 안 상자 📦📦)

```js
{
  id: "주문1",
  product_id: "ABC-123",           // ┐
  product_name: "버터 드롭 키링",   // │ purchases 것 (바깥 상자)
  quantity: 2,                      // ┘
  products: {                       // ← 조인해온 것 (안에 든 작은 상자)
    images: ["사진.jpg"],           // ┐ products 것
    slug: "butter-drop"             // ┘
  }
}
```
- 두 테이블에서 왔으니 **안 섞고**, products 것은 `products` 상자에 담아줌.

### 꺼내 쓰기 — `.`(점) = "~의"
```js
p.product_name      // 이 주문의 이름 (박제)      → 바깥 바로
p.products.images   // 이 주문의 products의 images (조인) → 상자 열고
p.products.slug     // → /products/[slug] 링크에 사용
```
- `p` = 목록에서 `.map((p) => …)`로 꺼낸 **주문 하나**의 별명. (JS 문법, 백엔드 아님)

---

## 5. 실제 적용 = 훅 안에 그 select 한 줄

```ts
export const useMyPurchases = () => {
  const supabase = createClient()
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, products(images, slug)')   // ← JOIN
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
```
```tsx
{purchases.map((p) => (
  <div key={p.id}>
    <span>{p.product_name} · {p.quantity}개</span>   {/* 박제 */}
    <img src={p.products.images[0]} />                {/* 조인: 현재 사진 */}
    <Link href={`/products/${p.products.slug}`}>다시 보기</Link> {/* 조인: 주소 */}
  </div>
))}
```

---

## 6. ⭐ 전체 데이터 흐름 (컴포넌트 → PostgreSQL → 컴포넌트)

```
[컴포넌트]  usePurchases() 호출
     ↓
[React Query]  queryFn(async 함수) 실행
     ↓
   주문서 조립: .from('purchases').select('*, products(...)')  (아직 안 감)
     ↓
   await → 요청 발사 🚀 (createClient에서 품은 anon key가 자동으로 실림)
     ↓
[Supabase 클라우드 / PostgreSQL]
   ① RLS 검수: 정책 using 조건을 내 where에 AND로 붙여 행마다 통과 여부
   ② 창고(테이블)에서 통과한 행 꺼냄
   ③ JOIN: product_id(fk) 따라 products의 images·slug 붙임
     ↓
   supabase가 { data, error } 반환  (성공: error=null / 실패: data=null)
     ↓
[queryFn]  ① 구조분해: const { data, error } = await supabase…
           → if (error) throw / return data
     ↓
[React Query]  받아서 포장 → { data, error, isLoading, ... } + 캐시에 저장
   (데이터 내용을 바꾸는 "재가공"이 아니라, 상태 씌우기 + 캐시 관리)
     ↓
[컴포넌트]  ② 구조분해: const { data, error, isLoading } = usePurchases()
           → isLoading? 로딩 UI / error? 에러 UI / data? 화면 렌더
```

### 헷갈리기 쉬운 2가지
- **구조분해는 두 번, 다른 상자다:**
  - ① queryFn 안(DB층): supabase가 준 `{ data, error }` (2칸)
  - ② 컴포넌트(화면층): React Query가 준 `{ data, error, isLoading }` (더 많음)
- **보내는 건 "데이터"가 아니라 "요청(주문서)".** 데이터는 DB가 돌려준다.
- **`.from`은 테이블을 "만드는" 게 아니라 "메인으로 지정".** (만들기는 create table)

### 이게 "상태 관리"
React Query가 서버 데이터를 `data / error / isLoading`로 관리 + 캐시 → 다른 컴포넌트도 재요청 없이 캐시에서 씀.

---

## 7. 백↔프론트를 잇는 "두 통로"

데이터를 잇는 건 **주로 커스텀 훅**, 단 **비밀키가 필요한 건 서버(Route Handler)**가 잇는다.

```
① 커스텀 훅 (lib/queries)  ← 주 연결점 (지금까지 배운 것)
   브라우저 → supabase-js로 DB 직접 호출
   → 읽기(상품 조회), 간단한 쓰기
   → RLS가 지켜줌 (서버 안 거쳐도 안전)

② Route Handler (app/api)  ← 서버 경유 (아직 안 배운 것)
   브라우저 → 내 서버(app/api) → DB
   → 시크릿 키 필요한 것만: 결제 검증, service role, 웹훅
   → 왜? Toss·service role 키는 브라우저에 두면 안 되니까 서버에서
```

- **읽기·간단 쓰기 = 커스텀 훅** ✅
- **시크릿 필요한 서버 작업 = Route Handler** (예: `markPurchasePaid`가 service role로 purchases UPDATE → RLS 우회)

### ⚠️ "query" 단어 정리 (헷갈림 방지)
같은 `query`인데 가리키는 게 다르다. 공통 뿌리 = "데이터 물어보기/요청".

| 어디서 본 `query` | 정체 |
| --- | --- |
| `lib/queries` (폴더) | 조회 훅들이 사는 **폴더 이름** (React Query 훅을 모아둠) |
| React Query (`useQuery`) | **라이브러리** (TanStack Query) — 서버 상태·캐시 관리 |
| `let query = supabase…` | supabase **쿼리 빌더** (주문서 조립 중인 변수) |
| SQL query | DB에 보내는 **실제 요청** (`select …`) |

→ `lib/queries` = "React Query로 만든 훅들을 모아둔 폴더"지, 폴더 자체가 React Query인 건 아님.

### supabase 클라이언트 3개 (`lib/supabase/`)
두 통로가 쓰는 실제 클라이언트. 환경·키·RLS가 다르다.

| 파일 | 어디서 | 키 | RLS |
| --- | --- | --- | --- |
| `client.ts` | 브라우저 (훅) | anon | ✅ 적용 |
| `server.ts` | 서버 (쿠키 세션) | anon | ✅ 적용 |
| `admin.ts` | 서버만 (시크릿 작업) | **service role** | ❌ 우회 |

- `client.ts` = `createBrowserClient` — **커스텀 훅(useProducts 등)이 씀.** 브라우저는 localStorage.
- `server.ts` = `createServerClient` + 쿠키 — 서버 컴포넌트·Route Handler. 서버는 쿠키로 세션 유지 → 그래서 client와 분리.
- `admin.ts` = `createClient`(supabase-js) + **service role key** — Route Handler에서만. RLS 우회(예: `markPurchasePaid`). ⚠️ `NEXT_PUBLIC_` 아님 — 브라우저로 나가면 안 됨.
- **두 통로 연결:** ① 커스텀 훅 → `client.ts` / ② Route Handler(시크릿) → `server.ts`·`admin.ts`.

### service role 이란? (RLS 무시 마스터키)
Supabase는 열쇠 2종을 준다:

| 열쇠 | 성격 | RLS |
| --- | --- | --- |
| **anon key** | 공개키 (누구나 봄) | ✅ 적용 (문지기 통과해야) |
| **service role key** | 비밀키 (절대 공개 X, 서버만) | ❌ **무시 (전능)** |

- `service_role` = Postgres 역할인데 **RLS 정책에서 아예 면제**됨 → 모든 행 읽기/쓰기 가능.
- ⚠️ 브라우저로 나가면 DB 전체가 털림 → **서버에서만**, 꼭 필요할 때만("칼").

### server.ts vs admin.ts — "누구로서 행동하냐"가 다름
둘 다 서버에서 돌지만 정체가 반대다.

| | `server.ts` | `admin.ts` |
| --- | --- | --- |
| 키 | anon | **service role** |
| 로그인 세션 | ✅ 쿠키로 읽음 | ❌ 없음 |
| 누구로서? | **로그인한 그 사람** | **전능 관리자** |
| RLS | ✅ 적용 | ❌ 우회 |

**출입증 비유 🎫**
- `client.ts` = 손님 출입증 (문지기 통과)
- `server.ts` = 서버가 **로그인한 회원 출입증을 대신** 듦 → RLS 지키되 그 사람 권한
- `admin.ts` = **만능 마스터키** → 문지기 무시, 다 열림

**언제 뭘 쓰나**
```
server.ts: "내 주문목록" 보여주기 → 그 사람 세션 → RLS가 자기 것만 걸러줌 ✅ 안전
admin.ts:  결제 웹훅에서 상태 'paid'로 → 손님 권한은 RLS가 막음 → service role로 우회
           (이미 검증 끝난 신뢰 작업이라 우회 OK)
```
→ 기본은 `server.ts`(RLS 지킴), **꼭 뚫어야 할 신뢰 작업에만** `admin.ts`. 남발하면 RLS 보안이 무의미해짐.

---

## 8. 쿼리 빌더는 JS다 → `await`하면 SQL로 번역

`.from('products')`는 **SQL이 아니라 JavaScript**(supabase-js 쿼리 빌더). SQL을 대신 써주는 도구. `await` 순간 SQL로 번역돼 DB로 발사된다.

| JavaScript (쿼리 빌더) | → | SQL (번역 결과) |
| --- | --- | --- |
| `.from('products')` | → | `from products` |
| `.select('*')` | → | `select *` |
| `.eq('is_active', true)` | → | `where is_active = true` |
| `.single()` | → | `limit 1` |

```
.from().select().eq()   → JS로 조립 중 (아직 SQL 아님, DB 안 감)
        ↓ await
"select * from products where is_active = true"  → SQL 번역 → 발사 🚀
```

→ 왜 빌더? SQL 직접 안 쓰고 JS로 편하게(오타·인젝션 위험↓). 속은 결국 SQL이라, SQL 알면 빌더가 잘 보인다.

---

## 🔑 오늘의 핵심 한 줄
**JOIN = purchases 읽는 훅에서 `.select('*, products(images, slug)')` → fk 따라 products를 중첩 객체로 붙임. 전체 흐름 = 컴포넌트→RQ→queryFn→요청→(RLS+JOIN)DB→{data,error}→구조분해→RQ포장+캐시→컴포넌트 구조분해.**

---

## 🪜 "혼자 구현" 연습 사다리 (콜드로 빈 화면 X)

빈 화면에서 바로 못 짜는 게 정상이야. 이 순서로 계단 오르기:

1. **읽고 설명** (지금 단계 ✅) — 코드 보고 "왜 이래?" 답하기
2. **빈칸 채우기** — 이 노트의 훅에서 `.select(____)` 한 줄만 가려놓고 채워보기
3. **베끼며 타이핑** — useProducts.ts 보면서 usePurchases를 똑같이 쳐보기 (손이 문법 외움)
4. **노트 보고 재현** — 이 노트만 보고 훅 처음부터 쳐보기
5. **콜드 재현** — 아무것도 안 보고 쳐보기 (여기 오면 초중급 구현력)

→ 지금은 1~2단계. **매번 한 계단씩만.** 이해가 이미 앞서 있어서 손은 생각보다 빨리 따라온다.

---

## ▶ 다음에 여기서 시작
- 아직 안 판 것: **여러 행 JOIN**(주문 목록 전체), **UPDATE/DELETE**, **useMutation**(쓰기 훅), **집계**(count/sum).
- 실전 적용: 진짜 **주문내역 페이지**(`usePurchases` + JOIN) 만들며 위 사다리 3~4단계 연습.
