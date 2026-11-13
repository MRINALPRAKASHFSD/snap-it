# Snap-it (Lens)

> A privacy-first, ephemeral camera and social sharing platform built with TanStack Start, React 19, Tailwind CSS v4, and Supabase.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154.svg)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](PROPRIETARY.md)
[![Writing: Humanizer](https://img.shields.io/badge/Content-Humanized-success.svg)](.skills/humanizer/SKILL.md)

---

## Overview

Snap-it reimagines ephemeral photo sharing with strict privacy guarantees built into the architecture:

- **Zero Location Tracking:** We do not request, store, or infer GPS coordinates or IP geolocations. Discovery operates purely through user-chosen interest tags.
- **Hardware-Accelerated 60fps Filters:** Live viewfinder previews run on GPU-accelerated CSS filter matrices, delivering smooth transitions without burning mobile CPU cycles.
- **24-Hour Ephemeral Stories:** Stories expire automatically after 24 hours via Postgres timestamps. View history and media cleanup are handled at the database level.
- **Owner-Scoped Private Media:** Photos are stored in a private Supabase `gallery` bucket under `<uid>/`. Media access requires short-lived (60s) signed URLs generated only after authorization checks.
- **Database-Level Blocking:** Blocking is enforced directly by Postgres foreign keys, unique pair guards, and RLS policies, severing connections instantly.

---

## Key Features

- **Instant Camera Viewfinder:** Switch between front and rear cameras with automatic fallback on desktop browsers.
- **Real-Time Photo Filters:** Six photographic presets (Vintage, Noir, Neon, Warm, Chrome, Pastel) baked directly into captured WebP images.
- **Interest-Based Discovery:** Find other creators through opt-in public interest tags (`#photography`, `#art`, `#tech`) without sharing location data.
- **Ephemeral Chat & Snaps:** One-on-one direct messaging with confirmed friends.
- **Gamified Daily Points:** Earn daily story points and connection rewards tracked via an immutable database ledger.
- **Built-in Humanizer Extension:** Bundled with the [Humanizer](.skills/humanizer/SKILL.md) skill to ensure all documentation, commit messages, and PR summaries remain clear, direct, and free of AI buzzwords.

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| **Framework** | [TanStack Start](https://tanstack.com/start) with SSR & file-based routing |
| **UI Library** | React 19, [Radix UI Primitives](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with modern CSS variables |
| **Backend & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth, Storage) |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) |
| **State Management** | [@tanstack/react-query](https://tanstack.com/query) |
| **Testing** | [Vitest](https://vitest.dev/) for unit, routing, and integration suites |
| **Runtime & Tooling** | [Bun](https://bun.sh/) & Node.js 20+ |

---

## Quick Start

### 1. Prerequisites
- Node.js 20+ or Bun 1.1+
- Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/MRINALPRAKASHFSD/snap-it.git
cd snap-it

# Install dependencies
bun install
# or
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
```ini
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PUBLISHABLE_KEY="your-anon-publishable-key"
SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-publishable-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### 4. Run Development Server
```bash
bun run dev
# or
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Project Structure

```
├── .github/                 # PR and Issue templates
├── .skills/humanizer/       # Bundled Humanizer extension
├── drizzle/                 # Schema definitions and database migrations
├── public/                  # Static assets and icons
├── src/
│   ├── components/          # Reusable application components and UI primitives
│   ├── hooks/               # Custom React hooks (viewport, mobile detection)
│   ├── integrations/        # Supabase and Lovable service clients
│   ├── lib/
│   │   ├── camera/          # useCamera adapter and CSS filter presets
│   │   ├── profile.ts       # User profiles and privacy RPCs
│   │   ├── social.ts        # Social feeds, stories, and chats
│   │   └── social-rules.ts  # Friendship state machine & audience checks
│   ├── routes/              # TanStack Start file-based routing tree
│   └── test/                # Unit and integration test suites
├── supabase/                # Supabase configuration
└── vitest.config.ts         # Vitest test runner configuration
```

---

## Documentation Index

We maintain comprehensive documentation for developers, architects, and contributors:

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) - Deep dive into system layers, camera pipeline, and database RLS.
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) - Branching strategy, PR guidelines, and conventional commits.
- **Local Development:** [DEVELOPMENT.md](DEVELOPMENT.md) - Setup guide, test runner, and camera mocking.
- **API Reference:** [API.md](API.md) - Database schemas, tables, RPCs, and query contracts.
- **Privacy Architecture:** [PRIVACY.md](PRIVACY.md) - Zero-location commitment and signed URL storage rules.
- **Testing Guide:** [TESTING.md](TESTING.md) - Test pyramid, Vitest configurations, and security verification.
- **Production Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md) - Building, hosting on Vercel/Lovable, and CSP policies.
- **Performance:** [PERFORMANCE.md](PERFORMANCE.md) - 60fps filter budgets and image downsampling pipelines.
- **Style Guide:** [STYLEGUIDE.md](STYLEGUIDE.md) - Code style, TypeScript standards, and component patterns.
- **Product Roadmap:** [ROADMAP.md](ROADMAP.md) - Upcoming phases, WebRTC snaps, and mobile app roadmap.
- **Changelog:** [CHANGELOG.md](CHANGELOG.md) - Version history and release notes.
- **Security Policy:** [SECURITY.md](SECURITY.md) - Reporting vulnerabilities, response SLAs, and safe harbor.
- **Code of Conduct:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Contributor Covenant v2.1 community pledge.
- **Governance:** [GOVERNANCE.md](GOVERNANCE.md) - Decision making, maintainer roles, and RFC workflow.
- **Support & Troubleshooting:** [SUPPORT.md](SUPPORT.md) - FAQ, troubleshooting camera issues, and getting help.
- **Proprietary Terms:** [PROPRIETARY.md](PROPRIETARY.md) / [LICENSE](LICENSE) - Intellectual property terms.
- **Community:** [COMMUNITY.md](COMMUNITY.md) - Discussions, collaboration etiquette, and contributions.

---

## Humanizer Extension

This repository bundles the **[Humanizer](.skills/humanizer/SKILL.md)** extension (from `blader/humanizer`). It provides automated and editorial guidelines to eliminate AI-generated writing patterns, bloated buzzwords, and repetitive phrasing, ensuring all project documentation and pull request narratives maintain an authentic, direct, and human voice.

---

## License & Ownership

Copyright (c) 2026 Mrinal Prakash. All Rights Reserved.  
See [LICENSE](LICENSE) and [PROPRIETARY.md](PROPRIETARY.md) for complete proprietary licensing terms.
