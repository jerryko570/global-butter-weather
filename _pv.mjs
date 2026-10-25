import fs from 'node:fs'
const p='src/app/(shop)/privacy/page.tsx'
let s=fs.readFileSync(p,'utf8')
function sub(a,b){if(!s.includes(a)){console.error('못 찾음:\n'+a);process.exit(1)}s=s.replace(a,()=>b)}

sub(`      <Section title="5. 국외로 나갑니까">
        <p>
          <strong>나갑니다.</strong> 사이트와 데이터가 해외 서비스 위에서
          돌아갑니다.
        </p>
        <Rows
          rows={[
            ['Vercel', '미국 — 사이트 운영. 주문할 때 입력하신 정보가 거쳐 갑니다'],
            ['Supabase', '주문·회원 정보 보관'],
          ]}
        />
        <p>
          옮기는 시점은 <strong>주문하시거나 로그인하시는 그때</strong>이고,
          보관 기간은 위 3번과 같습니다. 동의하지 않으실 수 있으나, 그
          경우 주문을 받을 방법이 없습니다.
        </p>
      </Section>`,
`      <Section title="5. 국외로 나갑니까">
        <p>
          <strong>보관은 한국에서 합니다.</strong> 다만 사이트를 돌리는
          서버가 미국에 있어, 주문하실 때 입력하신 정보가 그곳을 거쳐
          갑니다.
        </p>
        <Rows
          rows={[
            ['보관하는 곳', '한국 — 주문·회원 정보'],
            ['거쳐 가는 곳', '미국 — 사이트를 돌리는 서버'],
          ]}
        />
        <p>
          옮기는 시점은 <strong>주문하시거나 로그인하시는 그때</strong>이고,
          보관 기간은 위 3번과 같습니다. 동의하지 않으실 수 있으나, 그
          경우 주문을 받을 방법이 없습니다.
        </p>
      </Section>`)

sub(` * | 국외 이전(미국) | Vercel 응답 헤더 \`x-vercel-id: icn1::iad1\`  |`,
` * | 국외 이전(미국) | Vercel 응답 헤더 \`x-vercel-id: icn1::iad1\` — 함수가 \`iad1\` 에서 돈다 |
 * | 보관은 한국   | Supabase 까지 왕복이 12~36ms. 서울 기준 22ms, 미국 동부 223ms |`)

sub(` * 그것도 적법한 방법이지만, 회원 탈퇴만큼은 화면에 두는 편이 낫다.
 */`,
` * 그것도 적법한 방법이지만, 회원 탈퇴만큼은 화면에 두는 편이 낫다.
 *
 * ---
 *
 * ## ⚠️ 서버 지역을 옮기면 5절을 고친다
 *
 * Vercel 함수 지역을 서울(\`icn1\`)로 바꾸면 **거쳐 가는 곳도 한국이 된다.**
 * 그때 5절을 다시 써야 한다 — **방침은 실제와 같아야 한다.**
 */`)
fs.writeFileSync(p,s);console.log('ok')
