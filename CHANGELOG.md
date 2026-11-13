# Changelog

All notable changes to Snap-it will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-13

### Added
- Complete platform release integrating ephemeral photo sharing, real-time camera filters, and social graphs.
- Humanizer skill integration (`.skills/humanizer/`, `.claude/skills/humanizer/`, `extensions/humanizer/`) for natural documentation and commit standards.
- Full community and governance documentation suite: `SECURITY.md`, `CODE_OF_CONDUCT.md`, `PROPRIETARY.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `GOVERNANCE.md`, `SUPPORT.md`, `PRIVACY.md`, `DEVELOPMENT.md`, `API.md`, `TESTING.md`, `DEPLOYMENT.md`, `STYLEGUIDE.md`, `PERFORMANCE.md`, `COMMUNITY.md`.
- Structured GitHub pull request template and issue templates (bug reports, feature requests, security reports).
- Safe environment template `.env.example` and enhanced `.gitignore` to prevent secret leaks.

### Changed
- Standardized camera filter pipeline to run purely in hardware-accelerated CSS space at 60fps.
- Refined discovery queries to enforce zero-location rules, displaying only public interest tags.

### Security
- Enforced strict database-level blocking in Postgres triggers: blocking immediately drops friendships and revokes media signed URLs.
- Locked private gallery storage bucket under `<uid>/` with short-lived 60-second signed URLs.

## [0.3.0] - 2026-11-12

### Added
- Ephemeral 24-hour stories with automatic database expiration checks.
- Direct messaging between verified friends with ephemeral chat windows.
- Daily story points reward trigger awarding points on first story post of the day.
- Unit and integration test suite verifying social rules and privacy blocking.

## [0.2.0] - 2026-11-11

### Added
- Real-time CSS filter presets: vintage, noir, neon, warm, chrome, pastel.
- `useCamera` media stream adapter with front/back camera toggling and permission error handling.
- Radix UI component library styled with Tailwind CSS v4.
- Friend action modals, tag picker, and points summary cards.

## [0.1.0] - 2026-11-09

### Added
- Initial project scaffolding with TanStack Start, React 19, TypeScript, and Bun.
- Supabase database configuration and Drizzle ORM migration scripts.
- Auth middleware and session handling with Lovable Cloud Auth connector.
