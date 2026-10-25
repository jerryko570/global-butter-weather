import Label from '@/components/Label'
import {
  BUSINESS,
  PRIVACY_EFFECTIVE_DATE,
  privacyOfficer,
} from '@/lib/business'

/**
 * 개인정보처리방침. **개인정보보호법 제30조가 공개를 요구한다.**
 *
 * ---
 *
 * ## 지어내지 않았다 ★
 *
 * 수집 항목·위탁처·보유 기간은 **코드에서 확인한 것만** 적었다.
 *
 * | 적은 것        | 어디서 확인했나                            |
 * | -------------- | ------------------------------------------ |
 * | 배송지 항목    | `types/order.ts` 의 `ShippingInfo`          |
 * | 로그인 항목    | `AuthLinks` 가 읽는 `user_metadata`         |
 * | 결제 항목      | `orders.payment_id` · `payment_provider`    |
 * | 배송 항목      | `orders.carrier` · `tracking_no` (`0009`)   |
 * | 위탁처         | 실제로 붙어 있는 것들                        |
 * | 국외 이전(미국) | Vercel 응답 헤더 `x-vercel-id: icn1::iad1`  |
 *
 * **\`posthog-js\` 는 의존성에만 있고 코드에서 쓰지 않는다** — 그래서
 * 분석 도구를 적지 않았다. 쓰기 시작하면 여기를 먼저 고친다.
 *
 * ---
 *
 * ## ⚠️ 화면이 아직 못 하는 것
 *
 * 법은 열람·정정·삭제·처리정지를 요구하는데(제35~37조) **화면에 그
 * 기능이 없다.** 지금은 문의로 받아 사람이 처리한다고 적었다 —
 * 그것도 적법한 방법이지만, 회원 탈퇴만큼은 화면에 두는 편이 낫다.
 */
export const metadata = {
  title: '개인정보처리방침 — 버터웨더',
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-gray-200 px-7 py-8">
      <h2 className="text-ink text-body mb-4 font-serif">{title}</h2>
      <div className="text-ink-muted text-caption flex flex-col gap-2 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="border-t border-gray-200">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-4 border-b border-gray-200 py-2.5">
          <dt className="text-ink-subtle w-32 shrink-0">{k}</dt>
          <dd className="text-ink-muted">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function PrivacyPage() {
  const officer = privacyOfficer()

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">개인정보처리방침</h1>
        <Label>시행 {PRIVACY_EFFECTIVE_DATE}</Label>
      </div>

      <Section title="1. 무엇을 받습니까">
        <p>필요한 것만 받습니다. 그 밖의 것은 받지 않습니다.</p>
        <Rows
          rows={[
            [
              '로그인할 때',
              '구글 또는 카카오가 알려주는 이메일, 이름, 프로필 사진',
            ],
            ['주문할 때', '받는 분 이름, 연락처, 우편번호와 주소, 배송 메모'],
            [
              '주문이 끝나면',
              '주문번호, 주문한 상품과 금액, 결제 수단과 결제 번호',
            ],
            ['물건을 보내면', '택배사와 송장번호'],
            ['원하시면', '새 상품 소식 수신 동의 여부'],
          ]}
        />
        <p>
          <strong>카드번호는 받지도 보관하지도 않습니다.</strong> 카드 정보는
          결제사 화면에서 결제사가 직접 처리하고, 저희에게는 결제가 끝났다는
          사실과 결제 번호만 남습니다.
        </p>
      </Section>

      <Section title="2. 무엇에 씁니까">
        <p>
          주문을 처리하고 물건을 보내는 데 씁니다. 결제와 환불, 그리고 문의에
          답하는 데 씁니다.
        </p>
        <p>
          새 상품 소식은 <strong>따로 동의하신 분께만</strong> 보냅니다.
          동의하지 않으셔도 주문에는 영향이 없습니다.
        </p>
      </Section>

      <Section title="3. 얼마나 가지고 있습니까">
        <p>법이 정한 기간 동안 보관하고, 지나면 지체 없이 파기합니다.</p>
        <Rows
          rows={[
            ['계약·청약철회 기록', '5년 (전자상거래법)'],
            ['대금결제·물품공급 기록', '5년 (전자상거래법)'],
            ['소비자 불만·분쟁처리 기록', '3년 (전자상거래법)'],
            ['표시·광고 기록', '6개월 (전자상거래법)'],
          ]}
        />
        <p>회원에서 나가시면 위 기간이 남은 기록을 빼고 지웁니다.</p>
      </Section>

      <Section title="4. 누구에게 맡깁니까">
        <p>
          물건을 보내고 결제를 처리하려면 아래 업체의 손을 거칩니다. 맡긴 일
          밖으로는 쓰지 못하게 하고 있습니다.
        </p>
        <Rows
          rows={[
            ['Supabase', '주문·회원 정보 보관'],
            ['Vercel', '사이트 운영'],
            ['포트원', '결제 중계'],
            ['토스페이먼츠', '결제 처리'],
            ['GS리테일', '배송'],
            ['구글 · 카카오', '로그인'],
          ]}
        />
      </Section>

      <Section title="5. 국외로 나갑니까">
        <p>
          <strong>나갑니다.</strong> 사이트와 데이터가 해외 서비스 위에서
          돌아갑니다.
        </p>
        <Rows
          rows={[
            [
              'Vercel',
              '미국 — 사이트 운영. 주문할 때 입력하신 정보가 거쳐 갑니다',
            ],
            ['Supabase', '주문·회원 정보 보관'],
          ]}
        />
        <p>
          옮기는 시점은 <strong>주문하시거나 로그인하시는 그때</strong>이고,
          보관 기간은 위 3번과 같습니다. 동의하지 않으실 수 있으나, 그 경우
          주문을 받을 방법이 없습니다.
        </p>
      </Section>

      <Section title="6. 쿠키와 브라우저 저장">
        <p>
          로그인을 유지하는 데 쿠키를 씁니다. 브라우저에서 쿠키를 막으면
          로그인이 풀립니다.
        </p>
        <p>
          <strong>장바구니는 손님 브라우저 안에만 있습니다.</strong> 저희 서버로
          보내지 않습니다 — 주문하실 때 어느 상품을 몇 개 사시는지만 전달됩니다.
        </p>
      </Section>

      <Section title="7. 어떻게 지킵니까">
        <p>
          데이터베이스가 <strong>본인 것만 보이도록</strong> 막고 있습니다. 남의
          주문은 주문번호를 알아도 열리지 않습니다.
        </p>
        <p>오가는 정보는 전부 암호화된 연결로 주고받습니다.</p>
      </Section>

      <Section title="8. 어떤 권리가 있습니까">
        <p>본인의 정보를 보고, 고치고, 지우고, 쓰지 말라고 하실 수 있습니다.</p>
        <p>
          <strong>아래 연락처로 말씀해 주시면</strong> 확인하고 처리합니다. 지체
          없이 처리하고 결과를 알려드립니다.
        </p>
      </Section>

      <Section title="9. 개인정보 보호책임자">
        {officer.name || officer.email ? (
          <Rows
            rows={(
              [
                ['책임자', officer.name],
                ['연락처', officer.email],
              ] as [string, string][]
            ).filter(([, v]) => v.trim().length > 0)}
          />
        ) : null}
        <p>
          개인정보와 관련해 궁금하거나 불편한 점이 있으시면 언제든 말씀해
          주세요.
        </p>
        <p className="text-ink-subtle">
          개인정보 침해로 도움이 필요하시면 개인정보침해신고센터 (118), 대검찰청
          사이버수사과(1301), 경찰청 사이버수사국 (182)에 문의하실 수 있습니다.
        </p>
      </Section>

      <Section title="10. 바뀌면 알려드립니다">
        <p>
          내용이 바뀌면 이 화면에 바뀐 내용과 시행일을 올립니다. 지금 방침은{' '}
          <strong>{PRIVACY_EFFECTIVE_DATE}</strong>부터 적용됩니다.
        </p>
        {BUSINESS.name ? (
          <p className="text-ink-subtle">{BUSINESS.name}</p>
        ) : null}
      </Section>
    </>
  )
}
