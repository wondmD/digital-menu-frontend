# Partner + Referral Flow Explanation

This document explains the complete partner/referral lifecycle, where owner referral code attribution is applied, and how Postman should be used to test it end-to-end.

## 1) Direct answer: where referral code is added on owner registration

The owner can send optional referral attribution fields in `POST /api/v1/auth/register`:

- `marketer_referral_code` (optional)
- `campaign` (optional)

### Code points

1. Request model accepts the fields:
   - `internal/models/user.go` (`CreateUserRequest`)
2. Registration validates referral code (if provided):
   - `internal/services/auth/service.go` in `Register(...)`
   - it calls `GetPartnerByReferralCode(...)`
3. Attribution is persisted at activation time (not immediate register time):
   - `internal/services/auth/service.go` in `ActivateUser(...)`
   - it calls `CreateOwnerPartnerReferral(...)`

So the flow is:

- register stores pending data (including referral/campaign)
- activate creates user + free plan
- activate then inserts/upserts owner-to-partner attribution

## 2) Why attribution is created on activation (not register)

At register stage, the user does not yet exist as an active account in DB; registration is pending-email-activation.

Attribution therefore happens in `ActivateUser(...)` after owner user creation, using the real owner id.

This prevents attributing unverified accounts.

## 3) End-to-end business flow

### A) Admin creates partner account

Endpoint group: `Admin` (requires admin token)

- `POST /api/v1/admin/partners` creates:
  - user with role `partner`
  - partner profile (`partners` table)
  - referral code (provided or auto-generated)

### B) Partner logs in

Endpoint group: `Partner -> Auth & Profile`

- `POST /api/v1/auth/login` with partner credentials
- partner token is stored in Postman variable `partner_access_token`

### C) Owner registers with optional referral code

Endpoint group: `Public -> Auth`

- `POST /api/v1/auth/register`
- include:
  - `marketer_referral_code` (optional)
  - `campaign` (optional)

### D) Owner activates account

- `GET /api/v1/auth/activate?token=...`
- activation creates final owner user row
- if pending registration had `marketer_referral_code`, service creates/upserts owner attribution in `owner_partner_referrals`

### E) Partner sees referrals

Endpoint group: `Partner -> Partner Program`

- `GET /api/v1/partners/me/referrals`
- reads owner-based attributions (`owner_partner_referrals`), not legacy restaurant-claim flow

### F) Commission event processing

Endpoint group: `Admin` for event recording

- `POST /api/v1/admin/commission-events`
- service resolves partner by restaurant owner attribution
- loads active commission rule
- enforces `max_months` window when configured
- writes commission ledger entry

### G) Partner dashboard / ledger / payouts

Partner endpoints:

- `GET /api/v1/partners/me/dashboard`
- `GET /api/v1/partners/me/ledger`
- `GET /api/v1/partners/me/payouts`

These aggregate referrals and commission lifecycle values.

## 4) Route/auth architecture

From router:

- Partner self-service routes are in an authenticated group with `RequireRole("partner")`
- Owner/Admin/Staff business routes remain under protected + active subscription middleware

This means partner self-service does not require owner subscription middleware.

## 5) Database model used by referral attribution

Migration: `migration/019_partner_owner_attribution_and_rule_windows.sql`

Adds:

- enum value `partner` in `user_role`
- `commission_rules.max_months`
- `owner_partner_referrals` table

`owner_partner_referrals` tracks owner->partner attribution (unique owner row).

## 6) Postman collection status

Collection now includes all requested referral fields and partner flow docs:

- owner registration request body includes:
  - `marketer_referral_code`
  - `campaign`
- register request description explains both optional fields
- collection variables include:
  - `marketer_referral_code`
  - `campaign`
- standalone top-level `Partner` folder contains:
  - `Auth & Profile` (Login Partner, Refresh Partner Token)
  - `Partner Program` endpoints

## 7) Logic checks and important caveats

### Verified logic consistency

- public register is owner-only (role constrained)
- optional referral code is validated at register
- attribution persists on activation
- partner referral views are owner-attribution based
- commission rule has `max_months` enforcement

### Caveats to keep in mind

1. Attribution happens only after activation.
   - If owner never activates, no referral row is created.
2. Activation currently tolerates attribution insertion failure silently.
   - In `ActivateUser(...)`, attribution insert errors are ignored.
3. If partner/referral code changes between register and activate, attribution may not be created.
   - register validates at submit time; activation re-queries partner by code.

## 8) Postman test sequence (recommended)

1. Admin login
2. Admin create partner (`/admin/partners`)
3. Partner login (optional immediate check)
4. Public owner register with `marketer_referral_code`
5. Activate owner via token
6. Partner `GET /partners/me/referrals`
7. Admin record commission event
8. Partner dashboard/ledger checks

