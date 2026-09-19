-- 입력값의 최대·최소. 설계 근거는 docs/dev/schema.md 「입력값 정책」절.
--
-- 지금까지는 아무 제한이 없었다. 가격에 999999999 도, 이름에 1만 자도
-- 들어간다. **화면에서만 막으면 소용이 없다** — 화면의 검사는 우회할 수
-- 있고 DB 의 검사는 못 한다 (CLAUDE.md 5절과 같은 이유다).
--
-- 값은 핸드메이드 가게 기준으로 **넉넉하게** 잡았다. 좁게 잡으면 언젠가
-- 정상적인 물건이 막힌다. 여기서 막는 것은 「있을 수 있는 값」이 아니라
-- **「손이 미끄러진 값」**이다 — 0 을 하나 더 친 가격, 붙여넣다 만 설명.

-- ── 상품 ────────────────────────────────────────────────────

-- slug 는 주소이자 **저장소 폴더 이름**이다 (schema.md 7절). 여기에
-- 대문자나 슬래시가 들어가면 경로가 깨진다.
alter table products
  add constraint products_slug_shape
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$');

-- 이름은 비어 있으면 안 된다. 공백만 넣는 것도 막는다
alter table products
  add constraint products_name_len
    check (char_length(btrim(name)) between 1 and 100);

alter table products
  add constraint products_name_en_len
    check (name_en is null or char_length(name_en) <= 100);

alter table products
  add constraint products_description_len
    check (description is null or char_length(description) <= 2000);

alter table products
  add constraint products_description_en_len
    check (description_en is null or char_length(description_en) <= 2000);

-- 사진은 10장까지. 상세가 세로로 길어지는 것을 막는다.
-- **설명 이미지(detail_images)는 따로 20장까지** — 그쪽은 길어도 되는 자리다
alter table products
  add constraint products_images_count
    check (array_length(images, 1) is null or array_length(images, 1) <= 10);

alter table products
  add constraint products_detail_images_count
    check (
      array_length(detail_images, 1) is null
      or array_length(detail_images, 1) <= 20
    );

alter table products
  add constraint products_tags_count
    check (array_length(tags, 1) is null or array_length(tags, 1) <= 20);

-- ── 옵션 ────────────────────────────────────────────────────

alter table product_variants
  add constraint product_variants_name_len
    check (char_length(btrim(name)) between 1 and 40);

alter table product_variants
  add constraint product_variants_name_en_len
    check (name_en is null or char_length(name_en) <= 40);

-- 0001 에 이미 price_krw >= 0 이 있다. 여기서는 **위쪽**을 막는다.
-- 1천만 원은 이 가게의 물건이 닿을 일이 없는 값이고, 0 을 하나 더
-- 친 실수(119,000 → 1,190,000)는 여전히 통과한다. **그건 사람이 본다.**
alter table product_variants
  add constraint product_variants_price_krw_max
    check (price_krw <= 10000000);

alter table product_variants
  add constraint product_variants_price_usd_max
    check (price_usd is null or price_usd <= 1000000);

alter table product_variants
  add constraint product_variants_stock_max
    check (stock <= 9999);

-- position 은 화면 순서다. 음수가 들어가면 정렬이 뒤집힌다
alter table product_variants
  add constraint product_variants_position_range
    check (position between 0 and 99);
