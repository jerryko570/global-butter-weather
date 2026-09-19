-- 상품 사진 저장소. 설계 근거는 docs/dev/schema.md 「이미지」절.
--
-- 지금 사진은 레포 안(public/photos/)에 있다. 그 방식은 **사진을 한 장
-- 추가할 때마다 코드를 고쳐 배포해야 한다.** 상품이 늘면 못 버틴다.
-- 대시보드에서 올리고 바로 쓰는 쪽으로 옮긴다.

-- ── 버킷 ────────────────────────────────────────────────────
-- public = true. 상품 사진은 감출 것이 아니고, 공개 버킷이어야
-- /storage/v1/object/public/... 주소로 바로 받을 수 있다. 서명 주소는
-- 만료가 있어 CDN 캐시와 next/image 에 얹기 나쁘다.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ── 정책 ────────────────────────────────────────────────────
-- 읽기 — 누구나. 공개 버킷이라 공개 주소는 RLS 를 타지 않지만,
-- 목록 조회(API)에도 열어두어 두 경로가 어긋나지 않게 한다.
create policy product_images_read_public on storage.objects
  for select
  using (bucket_id = 'product-images');

-- 쓰기 — 정책을 만들지 않는다. products 와 같은 규칙이다
-- (docs/dev/schema.md 4절). publishable 키로는 못 올린다.
--
-- **대시보드 업로드는 이 제한을 받지 않는다.** 대시보드는 secret 권한으로
-- 움직이므로 정책이 없어도 올라간다. 지금은 그것으로 충분하다 —
-- 관리자 화면이 생기면 그때 「관리자만 쓰기」를 따로 판단한다.
