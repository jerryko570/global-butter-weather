# 06. Route Handler — 통로② (클라이언트 ↔ 서버 통신)

> 한 줄: **쓰기(주문 등)는 `fetch`로 서버 주소(`/api/...`)에 요청 → 서버 `route.ts`가 받아 검증·DB저장·응답. 손님(fetch)과 가게(POST)는 한 통화의 양쪽 끝.**
> 상세 흐름 전체는 [[00-flow-map]] · 쓰기 훅은 [[05-mutation]].

---

## 🍔 배달 주문 비유 (전체 그림)

```
손님 (브라우저)  = postPurchase   → 주문 전화 거는 사람
가게 (서버)      = POST 함수       → 주문 전화 받는 사람
주방 (DB)        = createPurchase  → 실제로 만드는 곳
```

```
손님 ──"버터 드롭 2개요!"(편지)──▶ 가게
                                    가게: 봉투 열기 → 검증 → 주방(DB) 저장
손님 ◀──"접수완료! 번호 12345"───── 가게
손님: "번호 받았다!" → 결제하러 감
```

---

## 1. `/api/purchases` = 주소, route.ts = 서버 파일

```
/api/purchases  (URL)  =  src/app/api/purchases/route.ts  (서버 코드)
```
- **Next.js 규칙: 폴더 경로 = URL.** `app/api/purchases/route.ts` → `/api/purchases`.
- `route.ts` 라는 이름 = "이건 API 주소야" 표시.

## 2. `method` ↔ 함수 이름 (창구 매칭)

```ts
// 손님             // 가게
method: 'POST'  →  export async function POST(request) {}
```
- fetch의 `method: 'POST'` = "이 요청은 POST 종류" 라벨 → 서버는 **같은 이름 함수**(`POST`) 실행.
- HTTP 메서드 = CRUD: **GET**(읽기) / **POST**(만들기) / **PUT·PATCH**(수정) / **DELETE**(삭제).
- 한 파일에 GET·POST·DELETE 여러 개 둘 수 있고, method가 어느 함수 부를지 고름.

## 3. postPurchase(손님) ↔ POST(가게) = 한 통화의 양쪽 끝

```
postPurchase (거는 쪽)              POST (받는 쪽)
    │──── fetch(body) ───────────────▶│  요청 받음
    │                                 │  검증 → createPurchase → DB
    │◀─── 응답(res) ──────────────────│  응답 돌려줌
```

### 짝지어지는 것 (포장 ↔ 풀기)
| 손님 (보낼 때) | 가게 (받을 때) |
| --- | --- |
| `JSON.stringify(input)` (객체→문자열 포장 📦) | `request.json()` (문자열→객체 풀기 📭) |
| `NextResponse.json(...)`을 받음 ← | `NextResponse.json(purchase, {status})` (응답 포장) |
| `res.ok` / `res.json()` | (상태코드로 성공/실패 신호) |
| `method: 'POST'` | `export function POST` |

→ **네트워크는 "문자"만 오감** → 보낼 땐 stringify(포장), 받으면 json()(풀기). 포장한 쪽이 있으면 푸는 쪽이 반대편에.

## 4. `request` = 손님이 보낸 봉투

- `POST(request)`의 `request` = 손님(fetch)이 보낸 **요청 전체(봉투)**. 안에 body·headers·method 다 있음.
- 서버(Next.js)가 **자동으로** 건네줌 (내가 안 만듦).
- `await request.json()` = 봉투 열어서 주문 데이터(body) 꺼냄.

## 5. 서버가 하는 일 (route.ts POST 안)

```ts
export async function POST(request) {
  try {
    const body = await request.json()          // ① 봉투 열기

    if (!body.product_id || !body.product_name  // ② 검증 (2차 방어선)
        || !body.quantity || !body.price_krw) {
      return NextResponse.json({ error: '...' }, { status: 400 })  // 빠지면 400
    }

    const purchase = await createPurchase(body) // ③ 주방(서비스)에 위임 → DB insert(pending)

    return NextResponse.json(purchase, { status: 201 })  // ④ 성공 201 + 주문정보
  } catch (error) {
    return NextResponse.json({ error: '...' }, { status: 500 })  // ⑤ 사고 나면 500
  }
}
```

- **② 검증** — `!`(없으면) `||`(또는): 필수 4개 중 하나라도 없으면 400. **왜 또 검증?** = 2차 방어선(프론트 안 거치고 직접 요청할 수도 있으니 서버도 검증). RLS 이중잠금과 같은 원리.
- **③ 위임** — 가게는 DB 직접 안 만짐. `createPurchase`(service)가 실제 `purchases`에 insert. 역할 분리 → 재사용·깔끔.
  - ⚠️ `createPurchase`는 **일반 서버 클라이언트**(anon+쿠키)로 insert. **service role 아님.** service role은 나중 `markPurchasePaid`(결제확정 UPDATE)에서만 — RLS가 UPDATE를 막아서. [[05-mutation]]
- **④⑤ 상태코드** — 201(만들어짐/성공) · 400(잘못된 요청/검증실패) · 500(서버 에러/catch).

---

## 🔑 오늘의 핵심 한 줄
**`fetch('/api/purchases', {method:'POST', body:stringify(input)})`(손님) → `route.ts`의 `POST(request)`가 받아 `request.json()`으로 풀기 → 검증(2차 방어선) → `createPurchase`에 위임해 DB insert → `NextResponse.json(purchase,201)` 응답. 손님·가게는 한 통화의 양쪽 끝, 포장(stringify)↔풀기(json())로 대화.**

---

## ▶ 다음에 여기서 시작
- 마지막 조각: 서버가 준 **201 응답이 다시 손님(postPurchase)한테 돌아가서** `res.ok` 확인 → `res.json()` 반환 → React Query가 `onSuccess`로 → 결제창. (이 왕복의 "돌아오는 길")
- 그다음: `createPurchase` 서비스 안(payment_id 생성, insert)과 결제 검증(`markPurchasePaid`, service role) 흐름.
