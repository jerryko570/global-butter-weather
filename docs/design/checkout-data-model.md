# 주문서(체크아웃) 데이터 모델 설계

> 작성 2026-07-08. 로드맵 #1 "주문을 담는 그릇" 확정 설계.
> UI 레퍼런스(네이버페이 주문/결제) → 배송지 / 주문상품 N개 / 동의+결제 3영역 기준.
> 결정: **로그인 필수(회원만) · 상품 옵션 포함 · 개인정보 필수+마케팅 선택**.

---

## 큰 그림 — purchases(단일) → orders + order_items(합구매)

```
지금:  purchases (주문1 = 상품1)              ← 합구매 불가
확정:  orders(영수증 표지) 1 ─< order_items(줄들) N   ← 합구매 O
                              └ product_id(fk) → products (JOIN으로 현재 사진·재고)
```
(영수증 비유: [[01-db-schema]] / 박제·JOIN: [[04-join]])

---

## UI → 데이터 매핑

| UI 부분 | 데이터 | 테이블 |
| --- | --- | --- |
| 배송지 (이름·전화·주소·배송메모) | name, phone, address, zipcode, memo | `orders.shipping_info` (jsonb) |
| 주문 상품 N개 (이름·옵션·수량·가격) | product_id, product_name, option, quantity, price | `order_items` (여러 줄) |
| 총 주문금액 | total_krw | `orders` |
| 약관·개인정보 동의 | agree_privacy, agree_marketing | `orders` |

---

## 확정 스키마

### orders (영수증 표지 🧾)
```
id              uuid pk
user_id         uuid  NOT NULL  → auth.users     ← 로그인 필수 (회원만)
status          text  'pending'|'paid'|'shipped'|'done'|'cancelled'
total_krw       integer
currency        text  default 'KRW'
shipping_info   jsonb { name, phone, address, zipcode, memo }   ← memo(배송메모) 추가
agree_privacy   boolean NOT NULL   ← 필수 (true여야 주문 가능, 전자상거래법)
agree_marketing boolean default false   ← 선택
payment_id      text   (PortOne 결제ID)
created_at      timestamptz
```

### order_items (영수증 줄들) — 실DB 실측(2026-07-08) 반영
```
id                uuid pk
order_id          uuid  → orders.id (on delete CASCADE)   ← 어느 영수증
product_id        uuid  → products.id (on delete RESTRICT) ← 번호표(fk)
product_name      text NOT NULL  ← 박제 📸 (그때 이름)
option            text  ← 박제, nullable (선택한 옵션: 예 '그린')  [추가함]
quantity          integer NOT NULL default 1
price_at_purchase integer NOT NULL  ← 박제 📸 (그때 단가). ※내 설계의 price_krw = 이 컬럼
created_at        timestamptz
```
> 박제(product_name·option·price_at_purchase) = 주문 시점 고정. 현재 사진·재고는 product_id로 JOIN.
> ⚠️ 가격 컬럼 이름은 `price_at_purchase` (price_krw 아님).

### products (옵션 추가)
```
+ options  text[]   ← 선택지 목록 (예 ['그린','블루'], 없으면 '{}')
```
> MVP: 옵션 1차원(단순 목록). 나중에 색상+사이즈 같은 다차원 필요하면 구조 확장.

---

## RLS (로그인 필수라 "자기 것만")
- `orders`: SELECT/INSERT — `user_id = auth.uid()` (자기 주문만)
- `order_items`: SELECT — 부모 order의 user_id가 자기 것일 때 (order_id로 연결)
- 관리자(어드민)는 service role로 전체 조회 (배송·송장)

---

## 진행 상황 (2026-07-08)
- [x] Supabase 실제 컬럼 대조 완료 (Definition 탭)
- [x] **SQL 적용**: orders `agree_privacy`·`agree_marketing`, order_items `option`, products `options text[]` 추가 + `order_items_insert_own` INSERT 정책 생성
- [x] **RLS 확인**: `orders_own`(auth.uid()=user_id, ALL — 로그인 필수 자동강제) / `order_items_own`(SELECT, 부모 order 주인 확인 EXISTS) → INSERT 정책 추가함
- [x] **타입**: `Order`에 agree 필드 + `ShippingInfo.memo` + `OrderItem` 타입 신규 + `Product.options`
- [ ] 결제: `payment_method` 'toss'|'stripe' check → PortOne 기준 정리 (별개 이슈)
- [ ] 재고 차감 시점 / 정책 페이지 (나중)

---

## 미결/나중
- 재고 차감 시점 (결제 완료 시 stock 감소 — 오버셀링 방지, 로드맵 정책 체크리스트)
- 청약철회/개인정보처리방침 페이지
- 개인통관고유부호 = 해외직구 시에만 (지금 국내라 스킵)
