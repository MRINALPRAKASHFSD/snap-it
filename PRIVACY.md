# Privacy Architecture & Commitment

At Snap-it, user privacy is an architectural invariant, not a setting or an afterthought. We designed every layer of the platform to minimize data collection and enforce boundaries at the database level.

## 1. Zero Location Tracking Guarantee

Most social networks collect GPS coordinates, IP geolocations, and Wi-Fi triangulations to map your real-world movements. **Snap-it strictly prohibits location collection.**

- We do not call `navigator.geolocation`.
- We do not store latitude, longitude, city, country, or IP-derived geographical points in any table.
- Discovery runs purely through user-chosen **Interest Tags** (`user_tags`).
- Strangers only see tags that you explicitly mark as public (`is_public = true`).

## 2. Ephemeral Media & Automatic Expiration

- **Stories:** Stories expire automatically 24 hours after creation. Expiration is enforced by Postgres timestamp filtering (`expires_at > now()`). Once expired, stories are inaccessible to viewers.
- **Direct Snaps:** Messages and direct media are ephemeral and clear according to friendship lifecycle states.

## 3. Private Storage Architecture

- **Private Buckets Only:** All media files reside in the private `gallery` bucket under the owner's UID (`<uid>/<filename>.webp`).
- **No Public URLs:** Public bucket access is blocked in our Supabase configuration.
- **Short-Lived Signed URLs:** Media access requires signed URLs generated server-side with a strict 60-second expiration. URLs are issued only after database-verified relationship and audience checks.

## 4. Database-Level Blocking

Blocking is not just a UI visual filter. When User A blocks User B:
- An atomic Postgres trigger deletes any existing friendship between the pair.
- Both users become mutually invisible in search, tag discovery, stories, and chat.
- Any attempt by User B to sign a URL for User A's media fails immediately at the database level.

## 5. Data Retention & Account Deletion

When an account is deleted:
- All profile rows, user tags, active stories, and messages are removed via cascading foreign keys (`ON DELETE CASCADE`).
- Storage objects in the user's `gallery/<uid>/` directory are wiped permanently.

For questions regarding our privacy architecture, contact `mrinalprakash9123@gmail.com`.
