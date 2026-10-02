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
export const BUSINESS: BusinessInfo = {
  name: '',
  owner: '',
  registrationNo: '',
  mailOrderNo: '',
  address: '',
  phone: '',
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
