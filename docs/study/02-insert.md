# 02. INSERT — 행에 데이터 넣기

> 한 줄: **INSERT = 테이블에 새 행(row) 하나(또는 여러 개)를 넣는 것.**
> "어디에" 짝 "무엇을" 구조만 잡으면 끝.

## 0. 전체 모양 한눈에

```sql
insert into  public.products  (slug, name, price_krw)  values  ('butter-drop', '버터 드롭', 18000);
   넣어라      어느 테이블에         어느 칸에(이름표)              이 값을(무엇을)
```

괄호가 **두 개**인 게 핵심 — 하나는 "어디에", 하나는 "무엇을".

| 위치 | 이름 | 뜻 |
| --- | --- | --- |
| `products (...)` 바로 뒤 괄호 | 이름표(컬럼 목록) | **어디에** |
| `values (...)` 뒤 괄호 | 값 | **무엇을** |

---

## 1. `public.products` — 스키마(묶음) . 테이블

```
public . products
 ▲묶음    ▲그 안의 테이블
```

- `public` = 폴더 아님! **테이블들을 담는 묶음 = 스키마(schema)**. (폴더 같은 느낌은 맞음)
- Supabase는 기본 테이블을 전부 `public`에 넣어둠 → 그냥 `products`라고만 써도 되고, `public.products` 풀네임으로 써도 똑같음. (별명 vs 풀네임)

---

## 2. 이름표(컬럼 목록) — "칸을 만드는 게 아니라 고르는 것"

```sql
(slug, name, name_en, price_krw, stock)
```

- 칸을 **새로 만드는 게 아님** (그건 `create table`).
- 이미 있는 칸들 중 **이번에 값을 넣을 칸을 고르는 이름표**.

---

## 3. `values` — "실제 값들이 여기서부터다"

- `values` = 신호어. 그 뒤 괄호 안이 진짜 데이터.
- 비유(택배 송장 📦): 이름표 = `받는사람·주소·전화`, values = `홍길동·서울…·010…`

### ⭐ 순서로 짝짓는다 (제일 중요)

```
(slug,          name,        price_krw,  stock)
('butter-drop', '버터 드롭',   18000,      10)
   ↓ 1번끼리      ↓ 2번끼리      ↓ 3번끼리    ↓ 4번끼리
```

첫째 칸 ↔ 첫째 값, 둘째 칸 ↔ 둘째 값 … **위치(순서)로 자동 매칭**.
→ 순서 어긋나면 엉뚱한 칸에 들어감(예: 가격 칸에 이름).

---

## 4. 여러 행 한 번에 = 괄호를 쉼표로 이어붙임

```sql
insert into products (slug, name, price_krw)
values
  ('butter-drop', '버터 드롭', 18000),   -- 행 1  ┐
  ('cloud-bead',  '클라우드',  24000),   -- 행 2  ├─ 쉼표로 이어짐
  ('sunny-charm', '써니 참',   16000);   -- 행 3  ┘ 세미콜론으로 끝
```

- **괄호 `( )` 한 묶음 = 행 하나 = 상품 한 개**
- 쉼표 `,` = "다음 행도 있어"
- 세미콜론 `;` = 끝
- 1개만 넣으려면 → 괄호 하나만, 세미콜론.

---

## 5. `default` — "값 안 주면 대신 넣어줄 기본값"

`create table` 할 때 "아무도 값을 안 넣으면 이걸로 채워둬" 하고 미리 정한 예비 값.

비유(카페 ☕): 손님이 "아이스요" → 아이스 / 아무 말 없으면 → **기본 따뜻한 걸로**(= default)

우리 실제 테이블:

```sql
stock      integer  not null  default 0        -- 안 주면 → 0
images     text[]   not null  default '{}'     -- 안 주면 → 빈 배열
status     text     not null  default 'active' -- 안 주면 → 'active'
is_active  boolean  not null  default false    -- 안 주면 → false
id         uuid     not null  default uuid_generate_v4()  -- 안 주면 → 랜덤 uuid 생성
created_at timestamptz        default now()     -- 안 주면 → 지금 시각
```

→ 그래서 INSERT 때 `id`, `created_at`, `stock` 안 적어도 자동으로 채워짐.

### "값 안 주면" 3갈래

| 칸 상태 | 값을 안 주면 |
| --- | --- |
| `default` 있음 | 그 기본값으로 채움 ✅ |
| `default` 없음 + `not null` | **에러!** "빈칸인데 채우라고도 안 함" ❌ |
| `default` 없음 + null 허용 | 그냥 비어있음(null) |

→ `slug`, `name`, `price_krw`는 `not null`인데 default 없음 → **반드시 값을 줘야 함.**

---

## 6. ⚠️ `default` vs `foreign key` — 헷갈리기 쉬움 (역할 완전 다름)

```sql
id uuid not null default uuid_generate_v4()          -- 값 채워주는 애
foreign key (product_id) references products (id)     -- 값 검사하는 애
```

| 구분 | 역할 | 비유 |
| --- | --- | --- |
| `default` | 값이 없으면 **채워줌** | 빈칸 자동완성 ✍️ |
| `foreign key` | 넣는 값이 **진짜 있는지 검사** | 입구 경비원 🛂 |

- `id`가 자동 생성되는 이유 = **`default`** 때문 (foreign key 아님!).
- `foreign key (product_id) references products(id)` = "넣는 product_id가 products에 실제 존재하는 id인지 검사, 없으면 막음."

---

## 🔑 오늘의 핵심 한 줄

**INSERT = `(어디에 = 이름표)` + `values (무엇을 = 값)`, 순서로 짝. 안 적어도 되는 칸 = `default` 붙은 칸.**

---

## ▶ 다음에 여기서 시작 (원래 하려던 JOIN)

- INSERT 하다 잠깐 샜음. 원래 다음 주제는 **JOIN**.
- 감각: `purchases`엔 `product_id`(번호표=암호)만 있고, 사진·이름·현재가격은 `products`에 흩어져 있음 → id 따라가서 **합치는 것 = JOIN** ("번호표 내밀면 코트 받기").
- 열린 질문(다음에 이걸로 시작): `purchases`엔 `product_id`가 있는데도 `product_name`·`price_krw`를 **왜 또 복사해 넣었을까?**
  → 답: 일부러. 나중에 상품 가격이 바뀌어도 "이 주문은 그때 얼마였는지"가 안 흔들리게 **스냅샷(그 순간 박제)**. 이 개념에서 JOIN 감각으로 이어감.
