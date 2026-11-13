## Summary of Changes

Describe what this pull request changes and why. Focus on the problem solved, not just a list of files modified.

## Context & Motivation

- Fixes issue #
- Related PR / Discussion:

## Type of Change

- [ ] `feat`: New feature or user-facing functionality
- [ ] `fix`: Bug fix
- [ ] `perf`: Performance improvement
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [ ] `docs`: Documentation update or addition
- [ ] `test`: Adding missing tests or correcting existing tests
- [ ] `chore`: Tooling, build pipeline, or dependency maintenance

## Key Architectural & Privacy Checks

- [ ] **Zero-Location Invariant:** Confirmed no geolocation, GPS, or IP-based coordinate lookups were introduced.
- [ ] **Camera Adapter Boundary:** Camera updates stay inside `src/lib/camera` using the `useCamera` adapter and CSS filter pipeline.
- [ ] **Row-Level Security (RLS):** All new or touched database tables/queries enforce owner or friend-scoped RLS policies.
- [ ] **Signed URLs:** Private media remains in the `gallery` bucket under `<uid>/` and uses short-lived signed URLs.
- [ ] **Blocking & Disconnect:** Verified blocking rules serialize against active sends and cut off mutual visibility.

## Verification & Testing

### Automated Checks
- [ ] `npm run lint` / `bun run lint` passes without errors or warnings
- [ ] `npm run format` / `bun run format` formatted all changed files
- [ ] `npm test` / `bun test` passes all unit and integration tests

### Manual Verification
- [ ] Tested on Desktop Chrome / Firefox / Safari
- [ ] Tested on Mobile viewport (iOS Safari / Android Chrome)
- [ ] Verified camera stream initialization and facing-mode toggle
- [ ] Verified CSS filter transitions at 60fps

## Screenshots / Video Demos

| Before | After |
| ------ | ----- |
| *Attach screenshot* | *Attach screenshot* |

## Humanizer Writing Check
- [ ] All new documentation, comments, and commit messages have been audited for natural human voice (no AI fluff or repetitive filler).
