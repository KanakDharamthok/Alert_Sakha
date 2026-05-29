## AlertSakha Refactor Plan

A large multi-area refactor. Grouped into 4 workstreams matching the request.

### 1. Authentication & Signup

- **Email-not-confirmed handling** (`LoginPage`, `authStore.login`): catch the `email_not_confirmed` error from Supabase and render a friendly inline state ("Check your inbox to verify…") with a "Resend verification email" button calling `supabase.auth.resend({ type: 'signup', email })`.
- **Auto-session when confirm disabled**: `signup()` already returns a session if confirm is off — surface that to the UI so the user is routed straight to `/dashboard`; otherwise show the verification-pending screen.
- **Disposable-email blocklist** (`signup` form + zod schema): reject common throwaway domains (mailinator, tempmail, 10minutemail, guerrillamail, yopmail, ellbit, trashmail, dispostable, etc.). Centralize the list in `src/lib/disposableEmails.ts`.
- **Acknowledgment email (mock)**: add a toast + an in-app notification row written to the `notifications` store on successful signup ("Welcome to AlertSakha — verify your email to secure your account"). No real email infra changes — pure mock per request.

### 2. Role-Based UI (RBAC)

- Add a `useRole()` helper reading from `authStore`. Define `STAFF_ROLES = ['staff','security','manager','admin']`.
- **`EmergencyDetailPage` actions panel**: wrap "Update Status / Mark Resolved / Assign Staff" in `{STAFF_ROLES.includes(role) && …}`.
- **Guest fallback**: render a "Request Assistance" CTA + tracking/map view for `guest` role.

### 3. Interactivity

- **Notifications drill-in** (`NotificationsPage`): make rows clickable → open a `Sheet` (shadcn) with full payload — logs timeline, room/floor, coordinator name/phone, status badges.
- **Analytics drill-down** (`AnalyticsPage`): wire `onClick` on Recharts Pie slice + Bar segments. Selected category drives a filtered list of mock incidents shown below the chart with cards (title, location, status, time).
- **Live chat** (`EmergencyChat`): already mostly working (send + enter handled). Ensure timestamp uses current locale, autoscroll on send, optimistic render, and persist into local state so messages survive within session. Add subtle typing-indicator animation.

### 4. Profile Overhaul (`ProfilePage`)

- Sectioned layout: **Avatar/Identity → Contact → Emergency Contact → Work/Role → Security Settings**.
- Editable fields: avatar upload (uses existing storage bucket or a new `avatars` bucket — will reuse `id-proofs` pattern but add public `avatars` bucket via migration), Full Name, Phone, Alt Emergency Contact (name + phone), Employee/Citizen ID, Assigned Department, Role badge (read-only).
- **Security Settings** subsection: change password (`supabase.auth.updateUser({ password })`), MFA toggle (UI toggle that calls `supabase.auth.mfa.enroll/unenroll` — mock visual state if not yet configured).
- Persist new profile fields → extend `profiles` table with: `phone`, `emergency_contact_name`, `emergency_contact_phone`, `employee_id`, `department`. Migration includes proper GRANTs (already present pattern).

### Technical notes

- New migration: add columns to `public.profiles` + create `avatars` public storage bucket with RLS allowing owner write / public read.
- New files: `src/lib/disposableEmails.ts`, `src/lib/roles.ts`, `src/components/notifications/NotificationDetailSheet.tsx`, `src/components/profile/SecuritySettings.tsx`, `src/components/profile/AvatarUpload.tsx`.
- Edited: `LoginPage`, `authStore`, `ProfilePage`, `NotificationsPage`, `AnalyticsPage`, `EmergencyDetailPage`, `EmergencyChat` (polish only).
- All UI uses existing semantic tokens — no raw color classes.
- Framer-motion for sheet/modal entrance and chart drill-down list.

### Out of scope (confirm if you want included)

- Real transactional email infra (acknowledgment is mocked per your wording "Mock or setup a state trigger").
- Real MFA enrollment flow (UI scaffold only unless you want full TOTP).

Approve and I'll ship it.