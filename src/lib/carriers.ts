/**
 * 택배사 목록. **DB 가 아니라 여기가 목록을 들고 있다.**
 *
 * 스키마에 제약을 걸면 택배사 하나 늘릴 때마다 마이그레이션을 써야 한다.
 * `orders.carrier` 는 그냥 text 이고 이 파일의 `code` 와 맞춘다.
 *
 * ---
 *
 * ## 지금 쓰는 것은 GS Postbox 다
 *
 * 비정기·소량·문앞이라는 조건에서 가장 싸다 (shipping-providers.md 2-5절).
 * 나머지는 **나중에 바꿀 자리를 미리 열어둔 것**이지 지금 쓰는 것이 아니다.
 *
 * ---
 *
 * ## ⚠️ 조회 주소는 확인되지 않았다
 *
 * 각 택배사의 조회 주소 형식은 **공개된 형태를 옮긴 것이고 실제 송장번호로
 * 눌러본 적이 없다.** 택배사가 주소를 바꾸면 조용히 깨진다.
 *
 * **첫 발송 때 반드시 한 번 눌러볼 것.** 깨져 있으면 이 파일만 고치면 된다.
 *
 * GS Postbox 는 조회가 팝업 스크립트라 번호를 주소에 실을 수 없다 —
 * 조회 화면까지만 보내고 번호는 손님이 붙여넣는다.
 */

export interface Carrier {
  code: string
  name: string
  /** 송장번호를 넣은 조회 주소. 번호를 실을 수 없으면 조회 화면만 */
  trackUrl: (trackingNo: string) => string
  /** 번호가 주소에 실리지 않는 경우 — 화면이 「번호를 붙여넣으세요」라고 알린다 */
  needsManualInput?: true
}

export const CARRIERS: Carrier[] = [
  {
    code: 'cvsnet',
    name: 'GS Postbox 편의점택배',
    trackUrl: () =>
      'https://www.cvsnet.co.kr/reservation-inquiry/delivery/index.do',
    needsManualInput: true,
  },
  {
    code: 'cj',
    name: 'CJ대한통운',
    trackUrl: (no) =>
      `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(no)}`,
  },
  {
    code: 'epost',
    name: '우체국택배',
    trackUrl: (no) =>
      `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(no)}`,
  },
  {
    code: 'lotte',
    name: '롯데택배',
    trackUrl: (no) =>
      `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(no)}`,
  },
  {
    code: 'hanjin',
    name: '한진택배',
    trackUrl: (no) =>
      `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${encodeURIComponent(no)}`,
  },
  {
    code: 'logen',
    name: '로젠택배',
    trackUrl: (no) =>
      `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(no)}`,
  },
]

export function findCarrier(code: string | null): Carrier | null {
  if (!code) return null
  return CARRIERS.find((c) => c.code === code) ?? null
}
