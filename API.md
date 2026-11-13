# API & Database Reference

This document details the database tables, RPC functions, and queries that power Snap-it.

## 1. Database Schema

### `profiles`
User account profile information.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `uuid` | Primary Key, FK `auth.users(id)` | User identity identifier |
| `username` | `text` | Unique, Not Null | Unique user handle (lowercase alphanumeric) |
| `display_name` | `text` | | User display name shown in chat and stories |
| `avatar_url` | `text` | | Storage path to profile image in gallery bucket |
| `bio` | `text` | | Optional profile bio |
| `bio_public` | `boolean` | Default `false` | Whether strangers can view the bio |
| `birth_year` | `integer` | | Birth year (strictly private, owner-only) |
| `onboarded` | `boolean` | Default `false` | Whether onboarding flow is completed |
| `created_at` | `timestamptz` | Default `now()` | Account creation timestamp |

### `friendships`
Directional friendship connections between users.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `uuid` | Primary Key | Friendship connection ID |
| `requester_id` | `uuid` | FK `profiles(id)` | User who initiated the request |
| `recipient_id` | `uuid` | FK `profiles(id)` | User receiving the request |
| `status` | `text` | `pending` or `accepted` | Current state of friendship |
| `created_at` | `timestamptz` | Default `now()` | Request creation time |
| `updated_at` | `timestamptz` | Default `now()` | Last status transition timestamp |

### `blocks`
Mutual blocking records between users.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `uuid` | Primary Key | Block record ID |
| `blocker_id` | `uuid` | FK `profiles(id)` | User initiating the block |
| `blocked_id` | `uuid` | FK `profiles(id)` | User being blocked |
| `created_at` | `timestamptz` | Default `now()` | Timestamp block was enacted |

### `stories`
Ephemeral photo posts.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `uuid` | Primary Key | Story identifier |
| `owner_id` | `uuid` | FK `profiles(id)` | Creator of the story |
| `storage_path` | `text` | Not Null | Relative path inside `gallery` bucket |
| `caption` | `text` | | Story caption |
| `audience` | `text` | `friends` or `selected` | Target audience scope |
| `selected_ids` | `uuid[]` | | Array of recipient IDs if `audience = selected` |
| `created_at` | `timestamptz` | Default `now()` | Story creation timestamp |
| `expires_at` | `timestamptz` | Computed | Automatically set to `created_at + interval '24 hours'` |

### `user_tags`
Interest tags chosen by users for discovery without location.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `uuid` | Primary Key | Tag mapping ID |
| `user_id` | `uuid` | FK `profiles(id)` | User profile ID |
| `tag_name` | `text` | Not Null | Interest tag string (e.g. `photography`, `art`) |
| `is_public` | `boolean` | Default `true` | Visibility flag for discovery feeds |

### `point_events`
Ledger of earned gamification and engagement points.

| Column | Type | Constraints | Description |
| ------ | ---- | ----------- | ----------- |
| `id` | `uuid` | Primary Key | Event record ID |
| `user_id` | `uuid` | FK `profiles(id)` | User awarded points |
| `points` | `integer` | Not Null | Point quantity (e.g. `5` for daily story) |
| `reason` | `text` | Not Null | Reason string (`Daily story`, `Friend connected`) |
| `source_key` | `text` | | Deduplication key to prevent duplicate daily rewards |
| `created_at` | `timestamptz` | Default `now()` | Timestamp awarded |

---

## 2. Remote Procedure Calls (RPCs)

### `visible_profile(handle: text)`
Returns a public-safe view of a user's profile.
- Strips `birth_year` and unverified fields.
- Checks if the caller is blocked by the target user.
- If `bio_public` is false and caller is not a friend, `bio` is returned as `null`.

### `my_private_profile()`
Returns the complete private profile for the authenticated caller.
- Requires active authenticated JWT session.

### `accept_friend(request_id: uuid)`
Accepts an incoming pending friend request.
- Verifies caller is `recipient_id`.
- Updates `status` from `pending` to `accepted`.
- Fires trigger to award engagement points to both parties.

### `tag_counts()`
Returns aggregate counts of users per public interest tag.
- Excludes users with `is_public = false`.
- Used to populate the Discover screen without exposing private members.
