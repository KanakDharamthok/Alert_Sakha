
# Plan: User-Scoped Data + Realtime Sync

## 1. Database changes (migration)

**New tables:**
- `chat_messages` — emergency_id, user_id, sender_name, sender_avatar, sender_role, message, created_at
- `assistance_requests` — emergency_id, user_id, requester_name, message, status (pending/acknowledged/resolved), created_at

**RLS policies:**
- `chat_messages`: any authenticated user can SELECT messages in a room; INSERT only with own `user_id`.
- `assistance_requests`: requester can SELECT/INSERT own rows; staff/manager/security/admin can SELECT all and UPDATE status.
- `notifications` / `emergencies`: extend SELECT policy so regular users (guest role) only see rows where `user_id = auth.uid()` or `assigned_to = auth.uid()`; staff roles see all.

**Realtime:**
- `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages, assistance_requests;`
- `REPLICA IDENTITY FULL` on both.

## 2. Frontend

**Notifications (`NotificationsPage` + `notificationStore`):** Filter feed by role — guests see only `user_id = me OR assigned_to = me`; staff/admin see all.

**Analytics (`AnalyticsPage`):** When role is guest, scope queries (incidents, donut chart, tables) to `reported_by = auth.uid()`. Staff roles unchanged.

**EmergencyChat:** Switch from mock to Supabase-backed:
- Load existing messages for `emergencyId` on mount.
- Insert new message with `user_id`, `sender_name` (from profile), `sender_avatar`, `sender_role`.
- Subscribe to `postgres_changes` INSERT on `chat_messages` filtered by `emergency_id`.

**Request Assistance button (`EmergencyDetailPage`):** Replace toast-only with INSERT into `assistance_requests` carrying current user id + name.

**Staff dashboard:** Add realtime listener on `assistance_requests` to show toast/notification when a new row arrives (only for staff roles).

## Technical notes

- Use `useAuthStore` for current user (id, name, avatar, role).
- Use `isStaffRole` helper to gate behavior.
- Chat subscription cleanup on unmount via `supabase.removeChannel`.
- For notifications/emergencies user-scoping, check current schema first — may already have `reported_by`/`user_id` columns.
