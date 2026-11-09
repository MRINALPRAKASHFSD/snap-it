# Project Governance

This document describes how decisions are made and how the Snap-it project is maintained.

## Maintainer Roles

### Lead Architect / Project Owner
- **Owner:** Mrinal Prakash (`mrinalprakash9123@gmail.com`)
- **Responsibilities:** Sets strategic product direction, architectural boundaries, and final approval on breaking changes, database migrations, and releases.

### Core Maintainers
- **Responsibilities:**
  - Triage incoming issues and pull requests.
  - Review code for architectural compliance, privacy invariants, and security standards.
  - Maintain build pipelines, linting, and automated testing infrastructure.

### Contributors
- Anyone who submits pull requests, files bug reports, proposes features, or updates documentation in accordance with our [Contributing Guidelines](CONTRIBUTING.md).

## Decision-Making Process

We follow a consensus-seeking model:

1. **Bug Fixes & Minor Changes:** Handled directly through pull requests. Any core maintainer can approve and merge after automated checks pass.
2. **Major Architectural Changes & New Capabilities:** Require an RFC (Request for Comments) issue before code is written. Topics requiring RFCs include:
   - Changes to the camera adapter boundary (`src/lib/camera`).
   - Adding or modifying database tables, functions, or RLS policies in `drizzle/` or `supabase/`.
   - Introducing external service integrations or analytics.
   - Any modification that touches location, privacy, or media storage rules.

## The RFC Workflow

1. Open a GitHub issue titled `[RFC] <Feature or Architecture Name>`.
2. Outline:
   - The motivation and problem solved.
   - Detailed technical design and schema changes.
   - Impact on privacy (specifically verifying our zero-location invariant).
   - Alternatives considered and trade-offs.
3. The community and maintainers have a minimum 7-day review window.
4. The Lead Architect makes the final determination (Approved, Changes Requested, or Closed).

## Release Management

- Releases follow Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Tags are cut directly from `main` after all verification suites pass.
- Release notes are compiled in [CHANGELOG.md](CHANGELOG.md).
