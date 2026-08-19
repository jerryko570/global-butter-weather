# 03. RLS (Row Level Security) — 행 단위 보안

> 한 줄: **RLS = DB 앞에 세우는 문지기. "누가 어떤 행을 읽고/쓸 수 있나"를 행(row)마다 검사하는 규칙.**

---

## 0. SQL은 3층 — RLS는 그중 "보안" 층

| 층 | SQL | 하는 일 | 비유 |
| --- | --- | --- | --- |
| ① 구조 | `create table` (+pk·fk) | 테이블·칸·연결 만들기 | 창고 짓기 🏢 |
| ② 데이터 | `insert`/`update`/`delete` | 행에 값 넣고 빼기 | 물건 넣고 빼기 📦 |
| ③ 보안 | **RLS (policy)** | 누가 뭘 보고/만지나 | 경비·출입규칙 🛂 |

→ `create`+`insert`(①②)랑 RLS(③)는 **완전 다른 일**. 헷갈리지 말 것.

---

## 1. 왜 Supabase는 RLS가 필수인가

```
보통 서버:  브라우저 → [내 서버(경비)] → DB      (DB는 안쪽에 숨음)
Supabase:  브라우저 → DB에 직접!                (중간 경비 없음)
```

- Supabase는 브라우저가 `.env`의 **anon key(공개 열쇠)**로 **DB랑 직접 대화**.
- 그 열쇠는 사이트 코드에 있어서 **누구나 봄** → 마음먹으면 DB에 직접 명령 가능("상품 다 지워줘", "남의 전화번호 보여줘").
- RLS가 없으면 DB가 다 들어줌 😱 → **RLS = 그 직통 통로에 세우는 유일한 문지기.**

---

## 2. policy(정책) = 경비 규칙 — 조각 총정리

```sql
create policy "이름"          -- 라벨 (사람이 알아보라고)
on 테이블                     -- ① on   : 어느 테이블 (필수)
as permissive|restrictive     -- ⑤ as   : 성격 (기본 permissive)
for select|insert|...|all     -- ② for  : 어떤 동작 (기본 all)
to public|authenticated|...   -- ③ to   : 누구 (역할, 기본 public)
using ( 조건 )                -- ④ using     : 읽기/기존행 검사
with check ( 조건 );          -- ⑥ with check: 쓰기/새값 검사
```

| 조각 | 질문 | 기본값 |
| --- | --- | --- |
| **`on`** | 어느 테이블? | (필수) |
| **`for`** | 어떤 동작? (select/insert/update/delete/all) | `all` |
| **`to`** | 누구한테? | `public` |
| **`using`** | (읽기) 이 행 봐도/고쳐도/지워도 돼? | 없으면 다 통과 |
| **`as`** | permissive(여러 정책 중 하나만 통과=OR) / restrictive(다 통과=AND) | `permissive` |
| **`with check`** | (쓰기) 이 새 값 저장해도 돼? | — |

### ⭐ `using` vs `with check` — 도서관 비유 🏛️
- **`using`** = 책을 **꺼낼 때** 검사 (읽기 방향) 👀 → select·delete·update
- **`with check`** = 책을 **꽂을 때** 검사 (쓰기 방향) ✍️ → insert·update

| 동작(`for`) | using | with check |
| --- | --- | --- |
| select (읽기) | ✅ | ❌ |
| insert (넣기) | ❌ | ✅ |
| update (고치기) | ✅ | ✅ |
| delete (지우기) | ✅ | ❌ |

→ **꺼낼 땐 using, 꽂을 땐 with check, 고칠 땐 둘 다.**

---

## 3. 우리 `products` 실제 정책 2개 (경비원 2명)

| 정책 | for | to | 조건 | 뜻 |
| --- | --- | --- | --- | --- |
| `products_public` | SELECT | public | `using (is_active=true)` | 손님은 공개상품 읽기만 |
| `admin manage products` | ALL | authenticated | `using`+`with check`: `auth.jwt()->>'email' = 'seora0825@gmail.com'` | 오직 나만 상품 전권 관리 |

```
손님(anon)     → [products_public]  → 공개상품 읽기만 ✅, 수정 막힘 ❌
로그인 관리자(나) → [admin manage]    → 넣기·고치기·지우기 다 됨 ✅
```

- `admin`은 `to authenticated` + 이메일 이중 확인 → 딴 손님이 로그인해도 상품 못 건드림.
- `auth.jwt()` = 로그인한 사람 신분증 / `->>'email'` = 거기서 email 꺼내기 / `::text` = 타입 맞추는 도장.

### ⚠️ 함정 — `public`이 두 번, 뜻이 다름
```sql
on "public"."products"   -- public = 스키마(테이블 묶음) 📦
to public                -- public = 역할(익명 손님 포함 누구나) 👥
```
같은 글자, 완전 다른 뜻!

---

## 4. create / alter / drop + "for는 왜 못 바꾸나"

| 동사 | 뜻 | 비유 |
| --- | --- | --- |
| `create policy` | 새로 만들기 | 경비 채용 🆕 |
| `alter policy` | 고치기 | 근무규칙 수정 ✏️ |
| `drop policy` | 지우기 | 해고 🗑️ |

- **동작(`for`)·테이블(`on`)은 만들 때만 정함 → 나중에 못 바꿈.**
  - 그래서 **Update(alter) 화면**에선 `for` 버튼이 회색(잠김), **Create 화면**에선 열려 있음.
  - 동작 바꾸려면 → drop 하고 새로 create.
- 대시보드 옵션박스("USE OPTIONS ABOVE") = 아래 SQL을 대신 써주는 것. UI = SQL, 속은 같음.

---

## 5. RLS 관리 화면 — 두 입구, 같은 방

- **Database → Policies** = 전 테이블 정책 한눈에 (배치도 🔭)
- **Table Editor → 테이블 → RLS policies** = 그 테이블 것만 (🔬)
- ※ **Schema Visualizer는 여기 아님!** 거긴 ①구조(테이블·fk 연결선) 보는 곳.

---

## 6. ⭐ RLS ↔ 커스텀 훅 "주문서"의 관계 (오늘 핵심)

### 둘은 "종류가 다른 물건"이지만 실행 땐 **만난다**
```
A. RLS 정책 (규칙표)  = create policy로 DB에 미리 붙여둠. 안 바뀜. "허용 규칙"
B. 훅 주문서 (요청)   = .from/.select/.eq/.order. 매번 코드가 보냄. "요청"
```

### 닮았지만 역할이 다름 (= 이중 잠금)
| 코드(주문서 B) | ↔ | 정책(규칙 A) |
| --- | --- | --- |
| `.from('products')` | ↔ | `on products` |
| `.select('*')` | ↔ | `for select` |
| `.eq('is_active', true)` | ↔ | `using (is_active=true)` |
| (접속 열쇠/로그인이 정함) | ↔ | `to public` ← 코드 줄 아님! |

### 실행 흐름 — 필터 2개가 쌓임 🥞
```
주문서: .from('products').select('*').eq('is_active',true)
              ↓ DB 도착
   [필터1] 내 주문서 조건(.eq)  → is_active=true 요청
   [필터2] RLS 문지기(using)    → 그중 봐도 되는 행만
              ↓
   결과 = 둘 다 통과한 행(교집합)
```

### 읽기 vs 쓰기 — 행동이 다름
- **읽기(select)**: 입구컷 아님. 볼 수 있는 행만 **조용히 골라줌**(숨김). 에러 X, 결과만 줄어듦. 🙈
- **쓰기(insert/update/delete)**: 권한 없으면 **엄격히 막고 에러**. = 진짜 입구컷 🛑

### ⚠️ RLS는 "주문서 양식"이 아니라 "행"을 본다
- ❌ "너 .select 형식 맞게 썼어?" (아님)
- ✅ "이 행(상품), 너한테 보여줘도 돼?" 행마다 검사 → 그래서 **Row(행) Level** Security.

### "정책은 어디서 정해지나?" (타임라인)
```
[예전에 한 번] create policy ... for select using(...)  → 규칙표 벽에 붙임 (정해짐!)
                                                            ↓ DB에 영구 저장
[손님 방문]   useProducts 실행 → .select/.eq → DB 도착 → 벽의 규칙표 적용 → 결과
```
→ 정책은 `create policy`에서 정해짐. 코드는 **정하는 게 아니라 검사받는** 쪽. `.select()`는 "어떤 정책(읽기용)이 적용될지" 고를 뿐.

### ⭐ "만난다"의 정확한 정체 = RLS가 `AND`로 조건을 몰래 붙임
RLS는 주문서를 튕기는 게 아니라, **네 `where` 뒤에 자기 `using` 조건을 `AND`로 자동으로 붙인다.**

```sql
-- 내가 보낸 주문서
select * from products where is_active = true

-- DB 실행 직전, RLS가 끼어들어 이렇게 바꿈:
select * from products
where is_active = true         -- ← 내 주문서 조건 (.eq)
  and (is_active = true)       -- 👮 RLS가 몰래 붙인 경비 조건 (products_public의 using)
```

→ **"만난다" = 내 `where` + RLS `using`이 `AND`로 하나로 합쳐진다.** 둘 다 만족하는 행만 나옴(교집합).
→ 지금은 두 조건이 똑같아서 겹침 = **이중 잠금**. (코드에서 `.eq` 깜빡 지워도 RLS가 `and is_active=true`를 붙여줘서 초안 안 샘)

### 🗝️ anon key는 언제 붙나 — `createClient`에서 품고, `await`에서 실려 나감
`lib/supabase/client.ts`가 `createBrowserClient(URL, ANON_KEY)`로 key를 리모콘 안에 새김.

```
① const supabase = createClient()   → 🎮리모콘 생성 + 🗝️anon key를 안에 새김 (이때부터 품고 있음)
② supabase.from().select().eq()     → 📝주문서 작성만 (DB 안 감, key는 리모콘에 대기)
③ await query                        → 🚀발사! 품은 key를 요청에 자동으로 실어 DB로 전송
                                          → 경비(RLS)가 "이 key=손님" 확인 후 검사
```

→ **품는 건 ①(createClient), 내보내는 건 ③(await).** ②는 작성 단계라 아직 안 감.
→ key는 내가 손으로 안 붙임 — supabase-js가 발사 때 자동으로 요청 헤더에 넣어줌. 난 `createClient()`로 쥐여주기만 함.

---

## 7. `.select('*')` vs `.eq(...)` — 담당이 다름 (JOIN에서 또 나옴)
```
.select('*')            → 어떤 "칸(컬럼)"을 볼지   (전체 칸)
.eq('is_active', true)  → 어떤 "행(row)"을 꺼낼지  (활성만)
```
→ `.select('products')`에서 → 활성 제품(행)의, 모든 정보(칸)를 꺼내겠다.

---

## 🔑 오늘의 핵심 한 줄

**DB 스키마=`create`+`insert`. RLS 정책=`on/for/to/using`(+`as`,`with check`), create로 미리 만들어 DB에 저장한 "규칙표". 훅 주문서=`.from/.select/.eq/.order`, 매번 보내는 "요청". 종류는 다르지만 실행 땐 만나서 — 읽기는 볼 수 있는 행만 조용히 골라주고, 쓰기는 권한 없으면 막는다. RLS는 양식이 아니라 행을 본다.**

---

## ▶ 다음에 여기서 시작 (JOIN — 계속 미뤄둔 것)

- Schema Visualizer의 **연결선(fk)** = 우리가 배운 "번호표". 그 선 따라 정보 합치는 게 JOIN.
- 열린 질문: `purchases`엔 `product_id`(번호표)가 있는데 왜 `product_name`·`price_krw`도 또 복사?
  → 일부러. 상품 가격이 나중에 바뀌어도 "이 주문은 그때 얼마였는지" 안 흔들리게 **스냅샷(박제)**.
- 코드로: supabase `.select('*, products(*)')` = 번호표 따라 products 정보 붙여오기.
