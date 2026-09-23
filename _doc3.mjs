import fs from 'node:fs'
function edit(p,pairs){let s=fs.readFileSync(p,'utf8');for(const[a,b]of pairs){if(!s.includes(a)){console.error(`${p} 못 찾음:\n${a}\n`);process.exit(1)}s=s.replace(a,()=>b)}fs.writeFileSync(p,s)}

// ── .env.example ─────────────────────────────────────────────
edit('.env.example', [
  [`# PORTONE_API_SECRET — 결제가 진짜인지 포트원에 직접 물어보는 데 쓴다.`,
`# PORTONE_WEBHOOK_SECRET — 포트원이 보낸 통지가 맞는지 확인한다.
# 이 주소는 인터넷에 열려 있어서, 없으면 아무나 「결제됐다」고 보낼 수 있다.
# admin.portone.io → 결제 연동 → 연동 관리 → 결제알림(Webhook) 관리
#   → [웹훅 시크릿 발급]
PORTONE_WEBHOOK_SECRET=

# PORTONE_API_SECRET — 결제가 진짜인지 포트원에 직접 물어보는 데 쓴다.`],
  [`# | PORTONE_API_SECRET              | Secret |`,
`# | PORTONE_API_SECRET              | Secret |
# | PORTONE_WEBHOOK_SECRET          | Secret |`],
])

// ── schema.md 7-5절 ──────────────────────────────────────────
{
  const p='docs/dev/schema.md'
  let s=fs.readFileSync(p,'utf8')
  const anchor='## 8. 아직 짜지 않은 것'
  if(!s.includes(anchor)){console.error('앵커 없음');process.exit(1)}
  s=s.replace(anchor,()=>`## 7-5. 웹훅 (2026-09-23)

**브라우저가 돌아오지 않아도 주문이 맞춰진다.** \`POST /api/payments/webhook\`.

7-4절까지는 확정이 **브라우저가 돌아오는 것**에 걸려 있었다. 두 방향 모두 구멍이었다.

| 언제                               | 웹훅이 없으면                                      |
| ---------------------------------- | -------------------------------------------------- |
| 결제하고 창을 닫는다               | 돈은 나갔는데 주문이 \`pending\` 으로 남는다         |
| 콘솔에서 환불한다                  | 주문은 \`paid\` 이고 **재고는 깎인 그대로**다        |

아래 칸은 2026-09-22에 실제로 일어났고 손으로 되돌렸다.

### 웹훅을 믿지 않는다 ★

이 주소는 인터넷에 열려 있다. **아무나 「결제됐다」고 보낼 수 있다.** 두 겹으로 막는다.

1. **서명 검증** — \`@portone/server-sdk\` 의 \`Webhook.verify()\` 로 포트원이 서명한 것인지 확인한다 (\`PORTONE_WEBHOOK_SECRET\`)
2. **다시 물어본다** — 서명이 맞아도 본문의 말을 믿지 않고 포트원 API 로 조회해 **상태와 금액**을 직접 확인한다

**2를 빼지 말 것.** 서명은 「포트원이 보냈다」까지만 보장하고 **「얼마가 결제됐는가」는 보장하지 않는다.**

⚠️ **본문을 그대로 읽어야 한다** (\`req.text()\`). 서명은 글자 하나까지 같은 문자열로 계산된 것이라, JSON 으로 파싱했다가 다시 만들면 검증이 깨진다.

### 무엇을 하는가

| 통지                   | 무엇을                                                   |
| ---------------------- | -------------------------------------------------------- |
| \`Transaction.Paid\`     | 금액·카드 확인 후 \`mark_order_paid()\` — 재고를 깎는다    |
| \`Transaction.Cancelled\`| \`mark_order_cancelled()\` — **깎았던 재고를 되돌린다**     |
| \`Transaction.Failed\`   | **아무것도 하지 않는다.** \`pending\` 이어야 다시 결제한다 |
| 그 밖                  | 200 만 돌려준다                                          |

거절할 때는 **돈을 돌려준다** — 카드가 아니거나 재고가 모자라면 취소를 건다. 화면이 없는 경로라고 손님 돈을 들고 있을 수는 없다.

### 같은 통지가 여러 번 온다

포트원은 실패하면 **최대 5회 재전송**한다 (0→1→4→16→64→256분). 그래서 두 함수 모두 **두 번 불려도 괜찮게** 돼 있다 — \`mark_order_paid()\` 는 \`pending\` 일 때만 움직이고, \`mark_order_cancelled()\` 는 이미 취소면 그냥 돌아간다.

**\`mark_order_cancelled()\` 에서 그 조기 반환을 빼지 말 것.** 재시도가 올 때마다 **재고가 늘어난다.**

**200 을 돌려줘야 재전송이 멈춘다.** 그래서 다루지 않는 종류도 200 이다 — 모르는 것이지 실패가 아니다. 예외는 시크릿이 없을 때로, 그때는 500 을 줘서 **설정이 붙는 동안 통지가 버려지지 않게** 한다.

### \`mark_order_cancelled()\` — \`mark_order_paid()\` 의 거울

**되돌리는 것은 \`paid\` 였을 때뿐이다.** \`pending\` 은 애초에 깎은 적이 없어서, 거기에 더해주면 **없던 재고가 생긴다.** \`shipped\`·\`done\` 은 거절한다 — 보낸 물건을 무르는 것은 반품이지 취소가 아니다.

\`service_role\` 만 부를 수 있다. **재고를 늘리는 함수**라 더욱 그렇다 — 아무나 부를 수 있으면 재고를 무한히 만들 수 있다.

${anchor}`)
  fs.writeFileSync(p,s)
}

// ── 로드맵 ───────────────────────────────────────────────────
edit('docs/plan/roadmap.md', [
  ['| **`feature/payment`** ✅ | **포트원 + 토스.** 테스트 채널로 검증 완료 |',
   `| **\`feature/payment\`** ✅ | **포트원 + 토스.** 테스트 채널로 검증 완료 |
| **\`feature/payment-webhook\`** ✅ | 브라우저 없이도 주문이 맞춰진다 |`],
])
console.log('ok')
