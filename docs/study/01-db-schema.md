# 01. DB 스키마 & 제약(constraint) 읽기

> 2026-07-03 학습. Supabase `products` / `orders` / `order_items` 테이블로 공부함.
> 목표: 스키마·제약을 **혼자 읽고 이해**하기. (아키텍처 감각 잡기)

---

## 1. 테이블 = 창고, 행 = 하나, 컬럼 = 속성

- **가로 한 줄(row)** = 데이터 1개 (예: 상품 1개)
- **세로 칸(column)** = 그 데이터의 속성 (이름·가격·재고…)
- `products`의 "17 records" = 상품 17개

---

## 2. 좋은 스키마 설계 4원칙 — "뭘·누구·어떤값·언제"

1. **한 테이블 = 한 종류만** (상품은 products, 주문은 orders — 섞지 마)
2. **모든 행엔 고유 id** (안 겹치는 이름표)
3. **값 성격에 맞는 타입** (참/거짓=boolean, 가격=integer, 여러개=배열)
4. **시간 기록** (created_at, updated_at)

> 💡 디자인의 **"컴포넌트 단일 책임"** = DB의 **"테이블 단일 책임"**. 같은 원리.
> 테이블마다 문맥(역할)이 딱 하나여야 함.

---

## 3. `is_active` — 공개 스위치 (soft delete)

```sql
is_active boolean null default false
```

- `true` = 공개(손님한테 보임) / `false` = 숨김(초안, 나만 봄)
- **default를 `true` → `false`로 바꿈** (2026-07-03): 새 상품은 숨김으로 태어나게 → 완성 후 수동 공개
- 코드에서: 손님용 훅 `useProducts`는 `.eq('is_active', true)` (공개만), 어드민 훅은 필터 없음(초안도 봄)

**왜 delete 안 하고 스위치로?** (soft delete)
1. 되돌릴 수 있음 (재입고)
2. 데이터 안 날아감 (사진·가격 보존)
3. 주문 기록이 안 깨짐 (팔린 상품 지우면 주문이 유령을 가리킴)

---

## 4. `id` / `uuid`

- **id** = 각 행의 "주민등록번호". 안 겹치고 **안 바뀜**.
  - 이름으로 구분 ❌ (이름은 겹칠 수 있고, 바뀌면 연결이 끊어짐)
- **uuid** = id의 타입. `0725510c-0672-...` 같은 **랜덤 식별번호**.
  - 컴퓨터가 자동 생성(`default uuid_generate_v4()`), 전 세계에서 안 겹침
  - 순번(1,2,3)보다 나은 점: 예측 불가(보안) + 충돌 없음

### 타입 정리
| 타입 | 담는 것 | 예시 |
|---|---|---|
| `uuid` | 안 겹치는 랜덤 id | `0725510c-...` |
| `text` | 글자 | `"버터 키링"` |
| `integer` | 정수 | `15000` |
| `boolean` | 참/거짓 | `true` |

---

## 5. `CREATE` vs `ALTER` (⚠️ 꼭 구분)

| 하고 싶은 것 | 명령어 |
|---|---|
| 테이블/컬럼 **처음 만들기** | `CREATE` |
| 이미 있는 걸 **고치기** | `ALTER` |
| 데이터(행) 넣기/바꾸기/지우기 | `INSERT` / `UPDATE` / `DELETE` |

- **`ALTER`** = 그릇 **모양(구조)** 바꾸기 (컬럼 추가·기본값 변경…)
- **`UPDATE`** = 그릇 **내용물(데이터)** 바꾸기

```sql
-- 오늘 한 것: 기본값 변경 (구조 수정이라 ALTER)
alter table products alter column is_active set default false;
```

> ⚠️ Table Editor의 `Definition`은 **읽기 전용(설명서)**. 거기 글자 고친다고 안 바뀜.
> 수정은 **SQL Editor**에서 `ALTER`로. (`Definition`의 `CREATE TABLE`을 복사해 실행하면 "이미 있음" 충돌남)

---

## 6. `constraint`(제약) = 실수 막는 규칙

**본질**: DB한테 "이런 이상한 데이터는 받지 마" 하고 정해두는 **문지기 규칙**.
→ 규칙 어기는 데이터를 DB가 **거부**해줌. 내가 매번 검사 안 해도 됨.

### 읽는 공식
```
constraint  [이름(라벨)]  [진짜 규칙]
```
- **이름은 무시해도 됨** (그냥 별명. 아무거나여도 작동)
- 이름 관례: `[테이블]_[칸]_[종류]` → 사람이 알아보기 쉬우라고
  - `_pkey` = primary key / `_fkey` = foreign key

---

## 7. pkey vs fkey — "나" vs "남"

```
order_items 테이블
┌──────┬──────────┐
│ id   │ order_id │
├──────┼──────────┤
│  a   │   #1     │
└──┬───┴────┬─────┘
   │        └─→ 남(orders)을 가리키는 손가락 = fkey
   └──────────→ 나 자신의 이름표             = pkey
```

- **primary key (pkey)** = "나 자신"의 대표 이름표 (안 겹침 + 안 빔)
- **foreign key (fkey)** = "남(다른 테이블)"을 가리키는 칸
  - ⚠️ fkey 칸(`order_id`)은 **우리 것**. 가리키는 대상(orders)만 남.

**구분법:** "이 칸이 나 자신 이름표야, 남을 가리키는 손가락이야?"

### 한 줄씩 해석 예시
```sql
constraint order_items_pkey primary key (id)
```
→ "규칙: order_items의 **메인 키는 id**다"

```sql
constraint order_items_order_id_fkey
  foreign KEY (order_id) references orders (id) on delete CASCADE
```
→ "order_items의 **order_id는 orders의 id를 가리키고**, 그 주문이 삭제되면 나도 같이 삭제된다"

> "메인/대표"는 **테이블이 아니라 키**를 꾸미는 말. (order_items = 어느 집 / pkey = 그 집의 대표 키)

---

## 8. `references` / `CASCADE` / `RESTRICT`

- **`references orders (id)`** = "orders **테이블의 id를 가리킨다**"

**삭제될 때 규칙 (부모-자식):**
| 규칙 | 뜻 | 예시 |
|---|---|---|
| **CASCADE** | 부모 지우면 → 자식도 **따라 삭제** (폭포수) | 주문 삭제 → 항목도 삭제 |
| **RESTRICT** | 자식이 물고 있으면 → 부모 삭제 **거부** | 팔린 상품은 삭제 안 됨 |

- 주문 항목 = 주문의 부품 → 주문 사라지면 같이 → **CASCADE**
- 상품 = 독립된 존재, 여러 주문에 물림 → 함부로 삭제 ❌ → **RESTRICT** (그래서 `is_active`로 끔)

---

## 9. NULLABLE vs NON-NULLABLE

- **NON-NULLABLE** = 비우면 안 됨 (반드시 값 필요) — 예: `id`
- **NULLABLE** = 비워도 됨 — 예: `order_id`
- `null` = "값 없음/비어있음"

Table Editor 뱃지 = SQL과 같은 내용:
| 뱃지 | SQL |
|---|---|
| 🔑 PRIMARY | `primary key (id)` |
| 🔗 FOREIGN KEY | `foreign key (order_id) references ...` |
| NON-NULLABLE / NULLABLE | `not null` 있음/없음 |

---

## 10. 테이블 관계 — 영수증 비유 🧾

| 테이블 | 영수증으로 | 담는 것 |
|---|---|---|
| `products` | 가게 진열대 | 파는 물건 목록 |
| `orders` | 영수증 표지 | 누가·언제·총액 |
| `order_items` | 영수증의 각 줄 | 이 주문에 뭘 몇 개 |

- 한 주문에 상품 여러 개 = **1:N (일대다)**. 그래서 orders(표지 1) + order_items(줄 N)로 나눔.
- 이렇게 나누는 것 = **정규화**. "한 테이블에 다 욱여넣지 말고, 종류별로 쪼개서 id로 잇는다."
- `order_items`는 `order_id`(→orders)와 `product_id`(→products) 두 손가락으로 양쪽을 연결하는 **다리**.

---

## 🔑 오늘의 핵심 한 줄
> **테이블은 역할별로 나누고(정규화), id로 연결하며(관계), constraint로 DB가 실수를 막는다.**
> 제약 한 줄 읽을 땐 **이름은 무시하고 뒤의 알맹이만** 읽으면 된다.

---

## 11. CREATE TABLE 전체 해석 (order_items 예시)

```sql
create table public.order_items (          -- public 폴더에 order_items 테이블 생성
  id uuid not null default extensions.uuid_generate_v4(),  -- id: 필수, 안 적으면 랜덤 자동
  order_id uuid null,                       -- 어느 주문 소속 (비어도 됨)
  product_id uuid null,                     -- 어느 상품 (비어도 됨)
  product_name text not null,               -- 상품 이름 (필수)
  quantity integer not null default 1,      -- 수량, 안 적으면 1
  price_at_purchase integer not null,       -- 살 때 가격(스냅샷, 필수)
  created_at timestamp with time zone not null default now(),  -- 만든 시각, 안 적으면 지금
  constraint order_items_pkey primary key (id),  -- 대표 키는 id
  constraint order_items_order_id_fkey
    foreign KEY (order_id) references orders (id) on delete CASCADE,   -- orders 가리킴, 주문 삭제→항목도 삭제
  constraint order_items_product_id_fkey
    foreign KEY (product_id) references products (id) on delete RESTRICT  -- products 가리킴, 상품 삭제 막음
)
```

**괄호 `()`의 두 가지 쓰임:**
- `create table 이름 ( ... )` → **테이블 내용(칸·규칙)을 담는 상자** (함수 아님)
- `uuid_generate_v4()` → **진짜 함수 호출** (실행하면 값을 뱉음)
- `primary key (id)` / `foreign key (order_id)` → **"어느 칸"인지 담는 목록** (여러 칸도 가능해서 항상 괄호)

**`public` / `extensions`** = 스키마(=폴더). `public.order_items` = "public 폴더의 order_items". `extensions.uuid_generate_v4()` = "extensions 폴더에 있는 함수를 불러 씀"(저장 위치 아님).

## 12. ⭐ 핵심 통찰 — "삭제는 전부 행(row) 단위"

```
CASCADE:  orders 행 삭제(트리거)   → order_items 행 삭제(결과)
RESTRICT: products 행 삭제 시도    → 막힘 (products 행이 안 지워짐)
```

- **삭제되는 것도 행, 막히는 것도 행, 트리거도 행.** 칸(컬럼)은 삭제 대상이 아님.
- **칸(order_id, product_id) = "어느 행끼리 연결됐나"를 가리키는 기준(통로)일 뿐.**
- 헷갈렸던 것: "order_id가 삭제된다" ❌ → "order_id를 가진 그 **행**이 삭제된다" ✅
- id는 "어느 행인지 찾는 주소". `delete ... where id=#1`은 id로 행을 찾아 **그 행 전체**를 지움.

## 13. 연결의 정체 = `references`

- 두 테이블이 "연결됐다"를 만드는 건 **`references products (id)` 선언**.
- 이 선언이 있어야 → 관계도에 선이 그려지고 + DB가 짝인 걸 알고 + 없는 값은 못 넣게 막음.
- 비유: `references` = "혼인신고"(공식 등록). 값이 같은 건 그 선언 덕분에 짝지어지는 것.
- `product_id`에 들어있는 값 = products에서 고른 상품의 id(예: `ABC123`)를 그대로 적어둔 것 → 같은 값이라 연결됨.

---

## 잡담/메모
- SQL 키워드는 **대소문자 무시** (`KEY`=`key`). Supabase 자동생성이라 형식이 섞여있어도 동작 동일.
- constraint는 CREATE 안(테이블 만들며 정의) / ALTER(`add constraint`, 나중에 추가) 둘 다 가능. Definition에서 본 건 CREATE의 일부.
- 관계 확인 3가지 방법: SQL Definition(글자) / Table Editor 뱃지(PRIMARY·FOREIGN KEY) / Schema Visualizer(점선 관계도) — 전부 같은 내용.
- 다음 스터디 후보: (A) 훅의 쓰기 `useMutation`(insert/update/delete), (B) 페이지가 훅을 어떻게 쓰나, (C) JOIN(id 따라가며 흩어진 정보 조립).

## ▶ 다음에 여기서 시작 (JOIN — 진행 중이던 것)
- **JOIN = order_items의 암호(id)를 products에서 찾아, 진짜 이름으로 바꿔주는 것.**
- 비유: 옷 보관소 **번호표**(order_items의 `product_id`=암호) → 내밀면 진짜 코트(products의 "버터키링")를 받음.
- 상황: `order_items`엔 `product_id=ABC123`만 있고, 사진·이름·현재가격은 `products`에 흩어져 있음 → 화면에 다 보여주려면 id 따라가서 **합쳐야** 함 = JOIN.
- 다음 세션: 이 "번호표 → 코트" 감각에서 시작해서 실제 코드(supabase `.select('*, products(*)')` 또는 SQL `join`)로 연결하기. 천천히, 한 번에 하나씩.
