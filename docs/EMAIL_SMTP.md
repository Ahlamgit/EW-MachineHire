# Email & SMTP (Titan + Supabase Auth)

**Audience:** Operators wiring Auth invite / password-reset mail without new recurring fees.  
**Assessed:** 2026-11-04  
**Preference:** Zero ongoing app service fees ([`PREFERENCES.md`](./PREFERENCES.md)). Existing company Titan / `ew.com.zm` email is **out of scope** (already paid). Do **not** purchase Resend, SendGrid, or other paid mail SaaS for this preference.  
**Preserve:** public site `ew.com.zm` / `www`, nameservers, and **Titan MX / SPF** — do not change DNS for mail.

**Status of delivery:** **UNTESTED** on this project. Do **not** claim invitation or password-reset email works until a human runs the staging checks in §6 and records pass/fail.

**Related:** [`AUTH_SETUP.md`](./AUTH_SETUP.md) · [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md) · [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md) · [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) Q13 · [`FREE_TIER_CONSTRAINTS.md`](./FREE_TIER_CONSTRAINTS.md)

---

## 1. Recommendation (no new fees)

| Need | Path | Fee impact |
|------|------|------------|
| Auth emails (invite, confirm, reset) | **Existing Titan mailbox** as Supabase **custom SMTP** | Uses existing company email (out of scope). **No new recurring fee.** |
| Operational alerts (compliance, hire, maintenance) | **In-app only** for v1 | $0. Email alerts stay **optional** until Q13 is Confirmed. |
| Marketing / bulk mail | Out of scope for Auth | Do not mix with Auth SMTP ([Supabase custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp)). |

**Preferred setup location:** Supabase Dashboard → **Authentication → SMTP / Emails** (UI labels vary slightly by Studio version). Put mailbox password **only** in the dashboard (or a private ops vault). **Never** paste SMTP passwords into chat, tickets, or git.

App-side env vars for SMTP are **not required** when Auth sends via dashboard custom SMTP. See §5.

---

## 2. Why default Supabase SMTP is not enough

Sources (verify if Studio copy changes):

| Restriction | Detail | Source |
|-------------|--------|--------|
| Team-only destinations | Without custom SMTP, Auth refuses addresses that are not org team members (`Email address not authorized`) | [Supabase: Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) |
| Rate limit | Built-in provider: **2 emails/hour** (may change without notice) | Same + [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits) |
| Intent | Non-production / exploration only; no SLA | [Custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp) |
| After custom SMTP | Initial Auth email rate limit often **30/hour**; adjust under **Authentication → Rate Limits** | Same docs |

Staging and any real staff invite/reset **require** custom SMTP before treating Auth mail as working.

---

## 3. Titan SMTP requirements (existing provider)

Use the company’s **existing** Titan mailbox for `ew.com.zm` (e.g. `machinehire@ew.com.zm` or a dedicated Auth sender on the same domain). Do **not** create a new paid mailbox solely for this preference unless ops already owns the decision.

### 3.1 Server settings (documented)

| Setting | Value | Source |
|---------|-------|--------|
| Host | `smtp.titan.email` (EU-region accounts may use `smtp0101.titan.email` — confirm in Titan panel) | [Titan: Configuring Titan on Email Scripts](https://support.titan.email/hc/en-us/articles/4405162224665-Configuring-Titan-on-Email-Scripts) |
| Port + encryption (option A) | `465` + **SSL** | Same |
| Port + encryption (option B) | `587` + **STARTTLS** | Same |
| Username | Full Titan email address | Same / [Outlook setup](https://support.titan.email/hc/en-us/articles/900001311526-Configure-Titan-Mail-on-Outlook) |
| Password | Mailbox password, or **application password** if 2FA is on | Scripts article + Titan app-password docs |
| Third-party access | Must be enabled (“Enable Titan on other apps”) | Scripts article |

**Suggested Supabase Sender email:** same address as the Titan mailbox (or an address already allowed to send on that domain). **Sender name:** `EW Machine Hire`.

**Preserve MX/SPF:** Current company DNS already points MX at Titan and includes Titan SPF (`include:spf.titan.email`). Do not rewrite MX/NS for staging or Auth. DKIM/DMARC remain Titan/hosting-panel concerns — improve them with Titan if deliverability fails; do not buy a separate ESP.

### 3.2 Sending restrictions (plan-dependent)

Titan enforces hourly/daily caps that depend on **plan** and **same-domain vs external** recipients. Official table: [How many emails can I send and receive?](https://support.titan.email/hc/en-us/articles/360038836914-How-many-emails-can-I-send-and-receive).

Illustrative (confirm against your live Titan plan before relying on volume):

| Scope | Typical order of magnitude (external / different domain) |
|-------|----------------------------------------------------------|
| Free / Starter / trials | Low tens per hour (e.g. ~50/hour) and low hundreds per day |
| Higher paid mailbox tiers | Hundreds per hour / up to ~2000/day (plan table) |
| Same-domain | Often ~1000/hour, ~2000/day across many plans |

**Implications for EW Machine Hire**

- Auth invites/resets for a small staff set (working assumption ~4 users) fit low caps **if** SMTP is correctly configured.
- High-volume **email notifications** (Q13) could hit Titan external limits — another reason to keep operational alerts **in-app** initially.
- New domains on Titan may start with **lower** limits until reputation builds (same Titan article).
- Failed auth / blocked IPs: Titan may block client IPs after repeated failed sign-ins; firewalls may block 465/587 ([scripts troubleshooting](https://support.titan.email/hc/en-us/articles/4405162224665-Configuring-Titan-on-Email-Scripts)).

Do **not** upgrade Titan solely for this preference without an explicit stakeholder purchase decision.

---

## 4. Configure Supabase custom SMTP (dashboard — preferred)

Credentials stay in Supabase / private vault. **Do not** ask anyone to paste the mailbox password into chat.

1. Open the **staging/dev** Supabase project (never point staging SMTP tests at a future production project until Phase 9).
2. Go to **Authentication** → **SMTP** / **Emails** → enable **Custom SMTP**  
   (path often like `/project/<ref>/auth/smtp` — follow current Studio labels).
3. Fill fields (names below match common Studio / Management API naming):

| Dashboard / API field | Titan value (example — do not commit secrets) |
|-----------------------|-----------------------------------------------|
| Sender email / `smtp_admin_email` | Existing Titan address (e.g. `machinehire@ew.com.zm`) |
| Sender name / `smtp_sender_name` | `EW Machine Hire` |
| Host / `smtp_host` | `smtp.titan.email` |
| Port / `smtp_port` | `587` (STARTTLS) or `465` (SSL) |
| Username / `smtp_user` | Full Titan email |
| Password / `smtp_pass` | From Titan (or app password) — enter **only** in dashboard |
| Minimum interval per user | Leave default (~60s) unless Auth rate-limit docs say otherwise |

4. Save. Note the Auth email rate limit bump (often to 30/hour) and adjust under **Authentication → Rate Limits** if needed — stay within Titan’s plan caps.
5. Confirm **Site URL** and **Redirect URLs** for staging Path A (`https://<site>.netlify.app` and `…/auth/callback`) per [`AUTH_SETUP.md`](./AUTH_SETUP.md) / [`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md).
6. Keep Auth email templates short and non-marketing ([Supabase guidance](https://supabase.com/docs/guides/auth/auth-smtp)).

Optional Management API exists (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, …) — still use a private token store; never commit tokens. Prefer the dashboard for this project.

---

## 5. App env — SMTP secrets not required

Auth mail is sent by **Supabase Auth**, not by the Next.js app. Prefer dashboard SMTP only.

| Variable | SMTP? | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPPORT_EMAIL` | No | Display / contact (`machinehire@ew.com.zm`) — already in `.env.example` |
| `NEXT_PUBLIC_APP_URL` | No | Must match Auth Site URL so invite/reset links land correctly |
| `EMAIL_PROVIDER_API_KEY` | **Do not use** for Auth | Placeholder in `.env.example` for a future app-side provider; conflicts with zero-fee preference if it implies paid SaaS |

If a future Phase needs **app-originated** mail (not Auth), document field names in `.env.example` comments only and still prefer existing Titan SMTP over a paid ESP. Until then, **no app-side SMTP env is required**.

---

## 6. How to test on staging (human) — mark results

**Status until you run these:** **UNTESTED**. Record date, staging URL, and pass/fail in the ops vault (not in git secrets).

Prerequisites: Path A staging live ([`STAGING_DEPLOY.md`](./STAGING_DEPLOY.md)), custom SMTP saved, Auth URLs set, Phase 2 migration applied, at least one admin profile.

### 6.1 Invitation

1. Supabase Dashboard → **Authentication → Users** → Invite user (use a real mailbox you control that is **not** necessarily on the Supabase org team — that is the point of custom SMTP).
2. Confirm the invite message arrives (check spam).
3. Open the link; complete signup; confirm redirect to staging `/auth/callback` then app.
4. Assign role in SQL if needed ([`AUTH_SETUP.md`](./AUTH_SETUP.md)).

**Result:** ☐ Pass / ☐ Fail — date: ________ — notes: ________

### 6.2 Password reset

1. On staging `/login`, use “Forgot password” / recover flow (or Dashboard → send recovery).
2. Confirm email arrives with a link to the **staging** host (not localhost).
3. Set a new password; sign in successfully.

**Result:** ☐ Pass / ☐ Fail — date: ________ — notes: ________

### 6.3 Negative / limits (optional)

- Attempt a second reset within ~60s — expect per-user throttle.
- Do not blast invites; respect Titan + Supabase hourly caps.

If either primary test fails, Auth email is **not** production-ready — keep using dashboard-created users / team-only default SMTP for internal exploration only, and fix SMTP/DNS/reputation before go-live.

---

## 7. Operational alerts (Q13)

| Channel | v1 posture |
|---------|------------|
| In-app notifications & alerts | **Selected** module — use this first ([`BUSINESS_RULES.md`](./BUSINESS_RULES.md) §9) |
| Email notifications | **Open** ([`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) Q13) — optional; do not implement paid providers |
| If Q13 Confirmed later | Prefer same Titan SMTP or in-app-only escalation; re-check Titan external send caps |

---

## 8. What this document does not claim

- Does **not** claim invite or reset mail works until §6 is executed and recorded.
- Does **not** authorize purchasing email SaaS, Titan upgrades, or DNS changes.
- Does **not** cover marketing mail, SMS, or push.
- Does **not** replace Titan mailbox backups — mailbox content is Titan’s responsibility; see [`BACKUP_RECOVERY.md`](./BACKUP_RECOVERY.md) for app/DB scope.
