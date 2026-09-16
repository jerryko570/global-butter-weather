-- 상품 한 개를 넣는 예시. **그대로 실행하지 말고 값을 고쳐 쓴다.**
--
-- 이 파일은 마이그레이션이 아니다. 「상품과 옵션이 어떻게 붙는지」를
-- 보여주는 본보기다. 실제 상품은 이 꼴로 하나씩 넣으면 된다.
--
-- Supabase 대시보드의 **Table Editor** 로 손으로 넣어도 된다.
-- 다만 products 를 먼저 만들고 그 id 를 product_variants 에 넣어야 한다 —
-- 아래처럼 SQL 로 하면 그 연결을 손으로 복사할 일이 없다.

-- ── 상품 하나 + 옵션 둘 ─────────────────────────────────────
with p as (
  insert into products (
    slug, name, name_en, description,
    category, images, is_active
  ) values (
    'flower-bead-keyring',          -- 주소에 들어간다. 영문 소문자·하이픈
    '꽃 비즈 키링',
    'Flower Bead Keyring',
    '유리 비즈를 하나씩 꿰어 만들었습니다.',
    'keyring',                      -- keyring | bracelet | necklace
    array['/photos/keyring-on-paper.jpg'],
    -- ⚠️ **기본값이 false(감춤)다.** true 로 해야 손님에게 보인다.
    -- 사진과 값이 다 채워졌을 때 켜는 것을 권한다.
    true
  )
  returning id
)
insert into product_variants (product_id, name, price_krw, stock, position)
select p.id, v.name, v.price_krw, v.stock, v.position
from p, (values
  -- 옵션마다 가격과 재고가 다르다. 옵션이 하나뿐이어도 한 줄은 있어야
  -- 한다 — **variant 가 없는 상품은 화면에 나오지 않는다.**
  ('그린', 21000, 3, 0),
  ('블루', 23000, 1, 1)
) as v(name, price_krw, stock, position);

-- ── 확인 ────────────────────────────────────────────────────
-- 목록 화면이 읽는 것과 같은 뷰다. 최저가와 총재고가 계산돼 나온다.
select slug, name, min_price_krw, total_stock, variant_count
from products_public;

-- ── 지우고 다시 하려면 ──────────────────────────────────────
-- variant 는 딸려서 같이 지워진다 (on delete cascade).
-- delete from products where slug = 'flower-bead-keyring';
