# 소셜 로그인 설정 — 구글 · 카카오

손님은 **회원만 산다**. 다만 가입이라는 단계를 따로 두지 않고 구글·카카오로 받는다. 근거는 [schema.md 7-3절](schema.md).

이 문서는 **한 번 하고 끝나는 설정**을 적어둔 것이다. 프로젝트를 다시 만들거나 도메인이 바뀌면 또 필요하다.

> 2026-09-19 작성. 절차는 [Supabase 공식 문서](https://supabase.com/docs/guides/auth/social-login/auth-google)를 보고 확인했다. **콘솔 화면은 바뀐다** — 여기 적힌 메뉴 이름이 안 보이면 문서를 다시 볼 것.

## 먼저 — 양쪽이 같이 쓰는 주소

```
https://ghrpcggsjgiiitxjqdsw.supabase.co/auth/v1/callback
```

구글·카카오 **양쪽 콘솔의 Redirect URI 칸에 이 주소를 넣는다.**

**우리 사이트 주소가 아니다.** 로그인이 끝나면 구글이 Supabase 로 보내고, Supabase 가 다시 우리 사이트로 보낸다. 사이트 주소를 여기 넣으면 로그인이 끝나고 갈 곳을 잃는다.

> 앞의 `ghrpcggsjgiiitxjqdsw` 는 프로젝트 ref 다. 프로젝트를 새로 만들면 이 값이 바뀐다 — `.env.local` 의 `NEXT_PUBLIC_SUPABASE_URL` 에 있다.

---

## 구글

### 1. [Google Cloud Console](https://console.cloud.google.com) → 프로젝트

없으면 만든다.

### 2. OAuth consent screen (동의 화면)

- **Audience: External**
- **Scopes**: `openid` · `userinfo.email` · `userinfo.profile` — 이 셋이면 된다. 더 넣지 말 것. 손님에게 보이는 동의 항목이 늘어난다
- **Branding**(로고·앱 이름)을 채우면 동의 화면이 버터웨더로 보인다. **검증에 며칠 걸릴 수 있으므로** 급하면 나중에 한다

### 3. Clients → Create client

⚠️ **애플리케이션 유형을 「웹 애플리케이션」으로 고른다.** 「데스크톱 앱」을 고르면 **주소를 넣는 칸이 아예 안 나온다** (2026-09-19에 실제로 헷갈렸다).

| 칸                     | 넣을 것                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| 애플리케이션 유형      | **웹 애플리케이션**                                                          |
| 이름                   | `butter-weather-web` — 콘솔에서만 보인다                                     |
| 승인된 JavaScript 원본 | `https://global-butter-weather.vercel.app`<br>`http://localhost:3000` (로컬) |
| 승인된 리디렉션 URI    | 맨 위의 Supabase 콜백 주소                                                   |

### 4. Client ID · Client Secret 복사

**Secret 은 그 화면을 닫으면 다시 못 본다.**

---

## 카카오

### 1. [developers.kakao.com](https://developers.kakao.com) → 애플리케이션 추가

앱 이름 · 회사명 · 카테고리 · 주 도메인을 채운다.

### 2. 앱 설정 → 플랫폼 키 → **REST API 키**

⚠️ **이것이 Client ID 다.** JavaScript 키도 Native 키도 아니다. 셋이 나란히 있어서 틀리기 쉽다.

### 3. 「카카오 로그인 클라이언트 시크릿」 활성화

같은 화면에서 켜고 코드를 복사한다.

### 4. Redirect URI 등록

맨 위의 Supabase 콜백 주소.

### 5. 동의항목

- `profile_nickname` · `profile_image`
- ⚠️ **`account_email` 은 비즈니스 앱만 쓸 수 있다.** 개인 앱이면 **이메일 없는 손님이 들어온다** — 아래 「알아둘 것」 참조

---

## Supabase

### Authentication → Sign In / Providers

Google · Kakao 를 각각 켜고 위에서 복사한 **Client ID / Secret** 을 넣는다.

카카오를 개인 앱으로 쓴다면 같은 화면의 **「이메일 없이 사용자 허용」을 켜야** 로그인이 된다.

### Authentication → URL Configuration

| 칸            | 넣을 것                                          |
| ------------- | ------------------------------------------------ |
| Site URL      | `https://global-butter-weather.vercel.app`       |
| Redirect URLs | 프리뷰 주소도 넣으면 PR 프리뷰에서 로그인이 된다 |

⚠️ **Site URL 이 프리뷰 주소로 들어가 있으면 안 된다.** 로그인이 끝나고 돌아가는 곳이라, 프리뷰 주소면 손님이 프리뷰로 떨어진다.

### ❌ OAuth Server 는 켜지 않는다

`Authentication → OAuth Server` 는 **우리 Supabase 가 남의 앱에게 로그인을 내어주는** 기능이다. 우리가 필요한 것은 반대 방향이라 쓸 일이 없다. **2026-09-19에 한 번 잘못 켰다** — 안 쓰는 기능을 열어두면 공격면만 늘어난다.

---

## 알아둘 것 — 카카오 손님은 이메일이 없을 수 있다

비즈니스 앱이 아니면 `account_email` 을 받지 못한다.

**주문 자체는 문제없다.** 배송지·연락처를 회원 정보가 아니라 **주문할 때 받기 때문이다**(`orders.shipping_info`). 설계가 원래 그렇다.

**문제는 알림이다.** 주문 확인 메일을 보낼 주소가 없다. 알림을 붙일 때 카카오 알림톡이나 문자로 가야 할 수 있고, 그건 별도 심사와 비용이 든다. **M3 에서 결제를 붙일 때 같이 판단한다.**
