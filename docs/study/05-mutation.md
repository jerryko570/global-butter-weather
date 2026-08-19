# 05. useMutation — 쓰기 훅 (insert/update/delete)

> 한 줄: **useMutation = 쓰기용. useQuery(읽기·자동)와 달리 `mutate(데이터)`를 불러야 수동 실행. `mutationFn`은 연결만, `mutate()`가 방아쇠.**

---

## 1. useQuery vs useMutation — 읽기 vs 쓰기

| | `useQuery` (읽기) | `useMutation` (쓰기) |
| --- | --- | --- |
| 용도 | select (읽기) | insert/update/delete (쓰기) |
| 실행 시점 | **자동** (화면 뜨자마자) | **수동** (`mutate()` 불러야) |
| 함수 이름 | `queryFn` | `mutationFn` |
| 방아쇠 | 컴포넌트 마운트 | 버튼 클릭 등 |
| 꾸러미 | `data, isLoading` | `mutate, isPending, isError, data` |

### 왜 쓰기는 "수동"인가
상품 목록(읽기)은 화면 뜨면 바로 보여야 → 자동.
주문(쓰기)을 자동 실행하면 → **들어가자마자 결제됨** 😱 → 그래서 "주문 버튼 누를 때만" = `mutate()`.

### ⚠️ 호출 시점 차이 (같은 페이지 두 줄)
```ts
const { data: product } = useProduct(slug)  // useQuery → 부르는 순간 읽어옴 ✅
const purchase = usePurchase()               // useMutation → 도구만 준비, 아무것도 안 함
```
- 읽기 훅 = 부르면 **가져옴**. 쓰기 훅 = 부르면 **대기(배선)**, `mutate()`가 방아쇠.
- 비유: `useProduct()` = 자판기(부르면 음료 나옴) / `usePurchase()` = 리모콘 쥐기(나중에 버튼).

---

## 2. 도구 만들기 — `usePurchase.ts`

```ts
// 서버에 주문을 보내는 함수
async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {       // ② Route Handler 통로!
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),                     // input = 인자1(데이터)
  })
  if (!res.ok) {                                      // ❌ 실패
    const { error } = await res.json()
    throw new Error(error ?? '주문에 실패했습니다.')
  }
  return res.json()                                  // ✅ 성공 → 반환
}

export const usePurchase = () =>
  useMutation({ mutationFn: postPurchase })          // 연결(배선)만! () 없음
```

- `input: ...): Promise<Purchase>` = **타입 표시(annotation)**, 실행 중 검사 아님.
- `res` = 응답 봉투(상태·헤더) / `res.json()` = 봉투 속 진짜 데이터를 JS 객체로.

### ⭐ `mutationFn: postPurchase` — 함수 vs 함수()
- `postPurchase` (괄호 X) = **함수 자체를 연결**(레시피 건네기). 실행 X.
- `postPurchase()` (괄호 O) = **지금 즉시 실행** → 타이밍·input·타입 다 깨짐.
- 같은 원리: `onClick={handleClick}` ✅ vs `onClick={handleClick()}` ❌.

---

## 3. 도구 쓰기 — `page.tsx` (실행 주체)

```ts
import { usePurchase } from '@/hooks/usePurchase'   // (line 19) 가져오기
const purchase = usePurchase()                       // (line 37) 배선 (대기)

const handlePurchase = () => {                        // (line 82) 버튼 클릭 시 실행
  purchase.mutate(
    { product_id, product_name, quantity, price_krw, price_usd },  // 인자1 = 데이터
    { onSuccess: (createdPurchase) => { ... } }                     // 인자2 = 성공 콜백
  )
}
// <button onClick={handlePurchase}>주문하기</button>  ← 진짜 시작점
```

### 실행 주체 찾는 법 🔍
- **훅 이름 검색** (`usePurchase`) → 배선한 곳
- **`.mutate` 검색** → 방아쇠 당긴 곳
- VS Code: 우클릭 **Find All References** / **Cmd+Shift+F** / **F12**(정의로 이동)

---

## 4. ⭐ `mutate`의 두 인자는 다른 길로 간다

```ts
purchase.mutate(
  { ...데이터 },              // 인자1 → postPurchase의 input → fetch body
  { onSuccess: (r) => {} }    // 인자2 → postPurchase 안 감! RQ가 성공 후 실행
)
```

| 인자 | 어디로 |
| --- | --- |
| **인자1 (데이터)** | `postPurchase(input)`의 input → 서버로 전송 |
| **인자2 (onSuccess)** | postPurchase 아님. **React Query가 성공 시 실행** |

---

## 5. `return` → 성공 → `onSuccess(반환값)`

```
postPurchase: return res.json()   (반환값 = createdPurchase)
   ↓
React Query: "throw 안 났네 → 성공!" → isSuccess=true, data=반환값
   ↓
인자2의 onSuccess(반환값) 실행   ← 반환값이 createdPurchase로 주입됨
```

- **넣어주는 주체 = React Query** (내가 부르는 게 아님, 정의만 함)
- **넣어주는 값 = mutationFn의 반환값**
- **조건 = 성공했을 때만** (throw면 onSuccess 대신 isError/onError)
- 즉 **`return`한 값 = 성공 신호 + onSuccess의 인자**, 동시에.

| 결과 | RQ 반응 | 다음 |
| --- | --- | --- |
| `throw` (실패) | `isError` | 에러 UI / onError |
| `return` (성공) | `isSuccess`, `data` 채움 | **onSuccess(반환값)** |

---

## 6. 콜백 체인 — 성공이 성공을 부른다 🔗

```ts
onSuccess: (createdPurchase) => {          // ① 주문 성공 → 결제창
  payment.mutate(createdPurchase, {
    onSuccess: () => {                      // ② 결제 성공 → 팝업
      trackEvent('purchase', {...})
      setShowSuccess(true)
    },
  })
}
```
```
주문 성공 → ① onSuccess(주문) → 결제창
             결제 성공 → ② onSuccess() → 이벤트 기록 + 성공 팝업
```
- ① 은 `(createdPurchase)` **받음**(결제창에 넘겨야) / ② 는 `()` **비움**(반환값 안 씀, 사이드이펙트만).
- → **인자는 필요할 때만 받는다.** RQ가 넣어줘도 안 받으면 그만.

---

## 🔑 오늘의 핵심 한 줄
**useMutation = 쓰기. `usePurchase()`로 배선(대기) → 버튼 클릭 → `mutate(데이터, {onSuccess})` 발사 → 데이터(인자1)는 postPurchase의 input으로 fetch → `return res.json()` 성공 시 RQ가 onSuccess(반환값) 실행 → 콜백 체인(주문→결제→팝업). 쓰기는 fetch로 Route Handler(② 통로) 경유.**

---

## 전체 흐름 한 장 🗺️
```
[버튼 클릭] handlePurchase()
   ↓
purchase.mutate(데이터, {onSuccess})     ← 인자1 데이터 / 인자2 콜백
   ↓ 배선된 mutationFn 발사
postPurchase(데이터)                      ← 인자1이 input
   ↓ fetch POST
/api/purchases (route.ts, 서버)           ← ② Route Handler 통로
   ↓
DB에 주문 저장 → 응답
   ↓ return res.json() (성공)
React Query: isSuccess + onSuccess(createdPurchase) 실행
   ↓
payment.mutate(createdPurchase) → 결제창 → (성공) 팝업
```

---

## ⭐ 내 설명 (교정본) — 10단계로 직접 엮기 (2026-07-08 복습)

> 스스로 전체 흐름을 말로 재현한 것. "노트 보고 재현" 단계 통과 = 95점.
> 교정 2군데: ⑤ mutate가 실행(useMutation 재실행 아님) / ⑩ 팝업은 결제 성공 후.

```
1. usePurchase 커스텀 훅 생성
2. import { usePurchase }  — 구조분해로 "함수 자체" 꺼냄 (실행 X)
3. const purchase = usePurchase()  — 도구가 필요해서 실행(괄호O), 결과 꾸러미를 purchase에 저장
4. const handlePurchase = () => {...}  — 화살표 함수 정의, 버튼 클릭 시(onClick) 실행 → purchase.mutate(구매내용)
5. mutate()가 배선된 postPurchase를 발사 (⚠️ useMutation 재실행 아님, 이미 3번에서 배선됨)
6. postPurchase(input): input = mutate 인자1(사용자가 입력한 구매 데이터)
7. await fetch → '/api/purchases'로 body에 실어 전송
8. 실패(!res.ok) → throw Error → isError
9. 성공 → return res.json() → React Query가 자동으로 onSuccess(반환값) 실행
       → createdPurchase = res.json() 값 (RQ가 주입)
10. onSuccess → payment.mutate(createdPurchase) 결제창
       → 결제 성공 → (안쪽) onSuccess → trackEvent('purchase') + setShowSuccess(true) 팝업
```

### 헷갈렸던 2가지 (다시)
- **⑤** `mutate()`는 이미 배선된 `postPurchase`를 **실행**시키는 것. `useMutation()`을 다시 부르는 게 아님.
- **⑩** `trackEvent` + `setShowSuccess(팝업)`은 **주문 성공이 아니라 결제까지 성공한 뒤**(안쪽 onSuccess)에 실행. onSuccess가 2겹(주문→결제 / 결제→팝업).

---

## ▶ 다음에 여기서 시작
- 아직 안 판 것: **캐시 무효화**(`invalidateQueries` — 쓰기 후 목록 자동 갱신), **update/delete** 뮤테이션, **낙관적 업데이트**.
- `useAdminProducts.ts`에 delete 뮤테이션 있음 → 그걸로 update/delete + 캐시 무효화 실습.
- 실습 목표: 이 10단계를 **노트 안 보고** 빈 화면에 타이핑(사다리 5단계).
