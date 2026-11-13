# Phase 1 — Foundation (camera-first social app for India)

Working name: **Lens** (rename anytime). Phase 1 only, as the brief asks. Phases 2–5 come later.

## What you'll get
- Sign up / sign in (email + password, Google).
- Onboarding: username, display name, birth year, pick interest tags, choose which tags are public.
- Camera as the home screen after sign-in: real browser camera, front/rear switch, flash where supported, photo capture, preview, retake, save to private gallery, permission/no-camera error states.
- Filter carousel above the shutter + expandable filter panel (real working image filters: color grading, vintage, cinematic, B&W, warm/cool, etc.), plus brightness/contrast/saturation/blur sliders.
- Profile: avatar, bio, public tags, private gallery grid.
- Discover: searchable tag categories (Tech, Entertainment, Education, Lifestyle, Indian Communities), trending tags, create/follow tags, people who share your public tags with shared-interest chips.
- Bottom nav: Camera, Chats, Discover, Stories, Profile. Chats and Stories show a "coming in Phase 2" state (no fake data).
- No location — never requested, stored, or used anywhere.

## Design system
- Dark-first: near-black/charcoal backgrounds, electric violet primary, subtle cyan accent, glass panels, rounded floating controls.
- Fonts: Sora (display) + Manrope (body); Noto Sans Devanagari/Bengali/Tamil fallbacks for Indic text.
- Mobile-first; on desktop the app sits in a centered phone-like shell.

## Architecture
```text
/auth              sign in / sign up (public)
/_authenticated
  /onboarding      profile + tags wizard
  /                Camera (default)
  /discover        tags + people
  /chats, /stories Phase 2 placeholders
  /profile         own profile + gallery
  /u/$username     other user's public profile
```
Camera code is isolated in a `camera` module (stream, capture, filter pipeline via canvas) so native/AR can plug in later.

## Database (Lovable Cloud)
- `profiles` (id → auth user, username unique, display_name, bio, avatar_url, birth_year, onboarded)
- `tags` (id, slug, name, category, created_by, follower_count)
- `user_tags` (user_id, tag_id, is_public) — strangers only ever see rows where is_public = true
- `media` (id, owner_id, storage_path, filter, created_at) — private, owner-only
- Storage buckets: `avatars` (public), `gallery` (private, owner-only)
- RLS on every table; seeded tag list from the brief.

## Integrations / environment
- Lovable Cloud (database, auth, storage). Google sign-in via managed provider. No API keys needed from you.
