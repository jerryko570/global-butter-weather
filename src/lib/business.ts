/**
 * 사업자 정보. **전자상거래법이 표기를 요구한다** (제10조).
 *
 * ---
 *
 * ## 왜 코드에 두는가
 *
 * **비밀이 아니라 공개 의무다.** 손님이 언제든 볼 수 있어야 하는 값이라
 * 환경변수나 DB 가 아니라 여기 둔다 — 바뀌는 일이 드물고, 바뀌면 그것이
 * PR 에 남는 편이 낫다.
 *
 * ---
 *
 * ## 결제 심사의 요건이기도 하다 ★
 *
 * 토스페이먼츠·카드사 심사는 **사이트 하단에 이 값들이 떠 있는지** 본다.
 * 비어 있으면 심사가 막힌다 — 코드를 다 만들어도 실연동이 안 열린다.
 *
 * 함께 보는 것 둘.
 *
 * - **판매 상품이 1개 이상 노출돼 있을 것** — 이미 있다
 * - **상품 상세에 배송·교환·환불 정책이 있을 것** — `ProductTabs` 에 있다
 *
 * ---
 *
 * ## ⚠️ 비면 아무것도 그리지 않는다
 *
 * 빈 값에 라벨만 띄우면 **「상호: 」** 같은 것이 손님에게 보인다.
 * 채워진 것만 그린다 (`Footer`).
 */
export interface BusinessInfo {
  /** 상호명 */
  name: string
  /** 대표자명 */
  owner: string
  /** 사업자등록번호 */
  registrationNo: string
  /** 통신판매업 신고번호 */
  mailOrderNo: string
  /** 사업장 주소 */
  address: string
  /** 유선번호. **심사에서 유선을 본다** */
  phone: string
  /** 전자우편 */
  email: string
}

/**
 * ⚠️ **아직 비어 있다.** 실연동 전에 채워야 한다 (2026-10-02).
 *
 * 값은 이나래가 가지고 있다 — 사업자등록증과 통신판매업 신고증에 있는
 * 그대로 적는다. **다르게 적으면 심사에서 걸린다.**
 */
/**
 * 개인정보 보호책임자. **지정이 의무다** (개인정보보호법 제31조).
 *
 * **작은 가게는 대표자가 겸하는 것이 보통이라** 따로 적지 않으면
 * 대표자와 이메일을 그대로 쓴다. 다른 사람을 두면 여기를 채운다.
 */
export const PRIVACY_OFFICER = {
  name: '',
  email: '',
} as const

export function privacyOfficer(): { name: string; email: string } {
  return {
    name: PRIVACY_OFFICER.name || BUSINESS.owner,
    email: PRIVACY_OFFICER.email || BUSINESS.email,
  }
}

/**
 * 개인정보처리방침 시행일. **내용을 고치면 이 날짜도 고친다** —
 * 언제부터의 방침인지가 방침의 일부다.
 */
export const PRIVACY_EFFECTIVE_DATE = '2026-10-25'

export const BUSINESS: BusinessInfo = {
  name: '버터웨더',
  owner: '이나래',
  registrationNo: '247-41-01130',
  // ⚠️ 아직 못 받았다. 통신판매업 신고증의 번호 그대로
  mailOrderNo: '',
  address: '인천광역시 부평구 부일로29번길 15, 202호',
  phone: '010-7105-0536',
  // ⚠️ 아직 못 받았다
  email: '',
}

/** 채워진 줄만 돌려준다. 비어 있으면 빈 배열이다 */
export function businessRows(): [string, string][] {
  const rows: [string, string][] = [
    ['상호', BUSINESS.name],
    ['대표자', BUSINESS.owner],
    ['사업자등록번호', BUSINESS.registrationNo],
    ['통신판매업 신고번호', BUSINESS.mailOrderNo],
    ['주소', BUSINESS.address],
    ['전화', BUSINESS.phone],
    ['이메일', BUSINESS.email],
  ]
  return rows.filter(([, v]) => v.trim().length > 0)
}
