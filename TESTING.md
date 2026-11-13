# Testing Strategy & Test Suite Guide

Snap-it employs a tiered testing strategy designed to verify user privacy, relationship constraints, camera filters, and UI workflows.

## Test Pyramid

1. **Unit Tests:** Fast, isolated tests targeting pure helper functions, social rules, and filter transforms.
2. **Integration Tests:** Database and API tests validating Postgres RLS policies, pair guards, and blocking triggers against an active or mock Supabase backend.
3. **Component & Routing Tests:** React component and route navigation tests using Vitest and React Testing Library.

## Test Suite Structure

```
src/test/
├── setup.ts                      # Test environment setup, mocks, and custom matchers
├── social-rules.test.ts          # Unit tests for story expiry, audience targeting, and permissions
├── phase2.integration.test.ts    # Integration tests for mutual blocking, tag counts, and signed URLs
└── app-routing.test.tsx          # Component tests for TanStack Router flows and route guards
```

## Running the Tests

Execute the full test suite locally:

```bash
bun test
# or
npm run test
```

Run in interactive watch mode during development:

```bash
bun run test:watch
# or
npm run test:watch
```

## Critical Test Cases

### 1. 24-Hour Story Expiry (`social-rules.test.ts`)
- Verifies stories expire at exactly 24 hours (86,400,000 milliseconds) regardless of client clock manipulation.
- Confirms stories marked for selected friends are never delivered to strangers or unselected friends.

### 2. Privacy & Blocking Enforcement (`phase2.integration.test.ts`)
- Confirms blocking immediately severs existing friendships.
- Verifies blocked users cannot fetch signed URLs for the blocker's media.
- Verifies private tags (`is_public = false`) are excluded from aggregate `tag_counts()` responses.
- Verifies private fields (`birth_year`, unshared `bio`) cannot be queried through direct API calls.

### 3. Route Guard Validation (`app-routing.test.tsx`)
- Confirms unauthenticated users are redirected from `/_authenticated/*` routes to `/auth`.
- Confirms authenticated users without completed profiles are redirected to `/onboarding`.

## Writing New Tests

When adding features, adhere to these rules:
- **No Hardcoded Secrets:** Integration credentials belong in environment variables (`LENS_QA_ACCOUNTS`, `LENS_QA_FIXTURE`), never committed to test files.
- **Isolated State:** Each test suite should clean up test records or run inside transactional rollbacks.
- **Mock External Hardware:** Use mock MediaStreams when testing camera components in headless environments.
