import Label from '@/components/Label'
import { BUSINESS, TERMS_EFFECTIVE_DATE } from '@/lib/business'
import { FREE_SHIPPING_OVER_KRW, SHIPPING_FEE_KRW } from '@/lib/shipping'

/**
 * 이용약관. **법이 꼭 요구하지는 않지만 전자상거래에서는 사실상 필요하다.**
 *
 * 환불 분쟁이 생겼을 때 기준이 되고, 결제 심사에서 볼 수도 있다.
 *
 * ---
 *
 * ## 지어내지 않았다 ★
 *
 * 두 군데에서만 가져왔다.
 *
 * | 어디서                 | 무엇                                       |
 * | ---------------------- | ------------------------------------------ |
 * | **법**                 | 청약철회 7일, 대금 환급 3영업일 (전자상거래법) |
 * | **이미 사이트에 있는 것** | 배송 기간·배송비·교환 조건·재고 처리        |
 *
 * 「이미 있는 것」은 \`ProductTabs\` 의 배송·교환 안내와 \`lib/shipping.ts\` 다.
 * **약관이 상세 화면과 다른 말을 하면 그것이 분쟁의 씨앗이다** — 그래서
 * 배송비는 글자로 적지 않고 상수를 읽는다.
 *
 * ---
 *
 * ## ⚠️ 제가 정하지 않고 비워둔 것
 *
 * **관할 법원을 적지 않았다.** 소비자 분쟁은 소비자 주소지 관할이
 * 원칙이고(민사소송법), 그보다 불리하게 정하는 조항은 무효가 될 수 있다.
 * **괜히 적어 불리해지느니 적지 않는 편이 낫다**고 봤다.
 *
 * **회원 탈퇴 조항은 적었지만 화면에 기능이 없다.** 지금은 메일로 받는다.
 */
export const metadata = {
  title: '이용약관 — 버터웨더',
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

export default function TermsPage() {
  const fee = SHIPPING_FEE_KRW.toLocaleString('ko-KR')
  const free = FREE_SHIPPING_OVER_KRW.toLocaleString('ko-KR')

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-7 py-5">
        <h1 className="text-ink text-title font-serif">이용약관</h1>
        <Label>시행 {TERMS_EFFECTIVE_DATE}</Label>
      </div>

      <Section title="1. 이 약관은 무엇입니까">
        <p>
          {BUSINESS.name}가 운영하는 이 사이트에서 물건을 사고파는 데 적용되는
          약속입니다.
        </p>
        <p>
          여기 적지 않은 것은 전자상거래법과 소비자 보호에 관한 법령을 따릅니다.{' '}
          <strong>이 약관이 법보다 손님께 불리한 부분은</strong> 그 부분이
          효력을 갖지 않습니다.
        </p>
      </Section>

      <Section title="2. 회원">
        <p>
          구글이나 카카오 계정으로 로그인하시면 회원이 됩니다. 따로 가입하실
          것은 없습니다.
        </p>
        <p>
          <strong>주문은 회원만 하실 수 있습니다.</strong> 주문 내역을
          확인하시고 배송 상황을 보시려면 주문이 누구 것인지 알아야 하기
          때문입니다.
        </p>
        <p>
          그만두고 싶으시면 아래 연락처로 말씀해 주세요. 바로 처리합니다. 다만
          법이 보관하라고 정한 거래 기록은 그 기간 동안 남습니다.
        </p>
      </Section>

      <Section title="3. 주문과 결제">
        <p>
          주문서를 쓰고 결제까지 끝나야 주문이 확정됩니다. 결제가 끝나기
          전까지는 주문이 성립하지 않습니다.
        </p>
        <p>
          <strong>카드로만 결제하실 수 있습니다.</strong>
        </p>
        <p>
          재고는 <strong>결제가 끝나는 순간</strong> 빠집니다. 그 사이에 물건이
          모두 팔려 보내드릴 수 없게 되면{' '}
          <strong>결제를 자동으로 취소하고 알려드립니다.</strong>
        </p>
      </Section>

      <Section title="4. 배송">
        <p>결제가 확인되면 2~5일 안에 보내드립니다.</p>
        <p>
          배송비는 {fee}원이고, 상품 금액이 {free}원을 넘으면 받지 않습니다.
          제주와 도서 지역은 추가 비용이 들 수 있으며, 그때는 미리 알려드립니다.
        </p>
        <p>
          보내드리면 주문 내역에 송장번호가 올라갑니다. 받으실 분의 주소나
          연락처가 잘못되어 배송이 되지 않은 경우는 다시 보내는 비용이 들 수
          있습니다.
        </p>
      </Section>

      <Section title="5. 취소·교환·반품">
        <p>
          <strong>보내드리기 전에는 언제든 취소하실 수 있습니다.</strong> 아래
          연락처로 말씀해 주세요.
        </p>
        <p>
          받으신 뒤에는 <strong>7일 안에</strong> 교환이나 반품을 신청하실 수
          있습니다. 법이 정한 기간입니다.
        </p>
        <p>
          단순히 마음이 바뀌어 돌려보내시는 경우에는 오고 가는 배송비를
          부담하십니다. 물건에 문제가 있거나 주문과 다른 것이 갔다면{' '}
          <strong>저희가 부담합니다.</strong>
        </p>
        <p>
          다만 <strong>착용하거나 사용한 흔적이 있는 경우</strong>, 또는{' '}
          <strong>포장이 훼손되어 다시 팔 수 없는 경우</strong>에는 돌려받기
          어렵습니다.
        </p>
        <p>
          <strong>손으로 만드는 물건입니다.</strong> 색이나 크기에 아주 작은
          차이가 있을 수 있고, 그것은 불량이 아닙니다. 사진과 크게 다르다면
          말씀해 주세요.
        </p>
      </Section>

      <Section title="6. 환불">
        <p>
          반품하신 물건을 받고 확인하면{' '}
          <strong>3영업일 안에 돌려드립니다.</strong> 카드 결제는 카드사 사정에
          따라 취소가 반영되기까지 며칠 더 걸릴 수 있습니다.
        </p>
      </Section>

      <Section title="7. 저희가 책임지는 범위">
        <p>물건과 배송에 관한 일은 저희가 책임집니다.</p>
        <p>
          다만 천재지변처럼 어쩔 수 없는 일이나, 손님 쪽 사정으로 생긴 일까지
          책임지지는 못합니다. 그런 경우에도{' '}
          <strong>법이 정한 책임은 그대로 집니다.</strong>
        </p>
      </Section>

      <Section title="8. 무엇을 올리실 수 있습니까">
        <p>
          남의 권리를 해치거나 법을 어기는 내용은 올리실 수 없습니다. 그런
          내용은 알리고 지울 수 있습니다.
        </p>
      </Section>

      <Section title="9. 다툼이 생기면">
        <p>먼저 아래 연락처로 말씀해 주세요. 빠르게 해결하려 하겠습니다.</p>
        <p>
          해결되지 않으면 소비자분쟁해결기준(공정거래위원회 고시)과 관련 법령에
          따릅니다. 한국소비자원(1372)에 도움을 요청하실 수도 있습니다.
        </p>
      </Section>

      <Section title="10. 바뀌면 알려드립니다">
        <p>
          내용이 바뀌면 이 화면에 바뀐 내용과 시행일을 올립니다. 지금 약관은{' '}
          <strong>{TERMS_EFFECTIVE_DATE}</strong>부터 적용됩니다.
        </p>
        <p>
          문의: <strong>{BUSINESS.email}</strong>
        </p>
      </Section>
    </>
  )
}
