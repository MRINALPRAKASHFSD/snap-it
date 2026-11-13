# Contributing to Snap-it

Thanks for taking the time to contribute to Snap-it. We appreciate bug reports, feature suggestions, documentation fixes, and code improvements.

This guide outlines our development workflow and quality expectations.

## Code of Conduct

All contributors are expected to uphold the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

## Getting Started

1. **Prerequisites**
   - Node.js (version 20 LTS or newer)
   - [Bun](https://bun.sh) (version 1.1+) or npm (version 10+)
   - Git installed and configured with your name and email
   - A free Supabase account for testing backend triggers and schemas

2. **Clone and Install**
   ```bash
   git clone https://github.com/MRINALPRAKASHFSD/snap-it.git
   cd snap-it
   bun install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your local or staging Supabase credentials in .env
   ```

4. **Start the Local Development Server**
   ```bash
   bun run dev
   ```
   Open `http://localhost:3000` in your browser.

## Architectural Boundaries to Respect

Before making code changes, please review the rules in [AGENTS.md](AGENTS.md):

- **Zero Location Tracking:** Never introduce GPS coordinates, reverse geocoding, or IP-based geolocation. Discovery must rely solely on interest tags.
- **Camera Abstraction:** Camera logic stays in `src/lib/camera` using the `useCamera` adapter and CSS filter pipeline. This ensures future mobile wrappers (Capacitor/React Native) can swap in native drivers cleanly.
- **Private Gallery Buckets:** User media lives in the private `gallery` bucket under `<uid>/`. We only access media via short-lived signed URLs. Never make buckets or photos public.
- **Database Migrations:** Schema changes must stay in sync between `drizzle/schema.ts` and `supabase/config.toml`.

## Git Workflow & Branching

We follow a trunk-based development pattern with short-lived feature branches:

1. Always branch off the latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   ```

2. Branch naming conventions:
   - `feat/description` for new features
   - `fix/description` for bug fixes
   - `docs/description` for documentation
   - `refactor/description` for code cleanup
   - `perf/description` for performance work
   - `test/description` for test additions

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description in present tense>

[optional body explaining motivation and technical approach]

[optional footer referencing issue numbers]
```

### Types:
- `feat`: A new user-facing feature
- `fix`: A bug fix
- `docs`: Documentation updates
- `style`: Formatting, semicolons, spacing (no logic change)
- `refactor`: Restructuring code without behavior changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Tooling, build config, dependency bumps

### Example:
```
feat(camera): add vintage sepia filter to css pipeline

Adds the vintage sepia filter preset with warm saturation and grain overlay.
Maintains 60fps rendering during live viewfinder preview.

Closes #42
```

## Writing Style & The Humanizer Standard

We use the [Humanizer](.skills/humanizer/SKILL.md) guidelines for all documentation, commit messages, and PR summaries:
- Write plainly and directly. Avoid corporate buzzwords, excessive em dashes, and generic AI filler phrases ("stands as a testament", "crucial milestone", "evolving landscape").
- Explain the actual technical reason behind decisions instead of hyping them up.

## Verification Checklist Before Submitting a PR

Run these checks locally before opening your pull request:

```bash
bun run lint      # Check ESLint rules
bun run format    # Format code with Prettier
bun test          # Run test suite
```

## Submitting Your Pull Request

1. Push your branch to GitHub:
   ```bash
   git push -u origin feat/your-feature-name
   ```
2. Open a Pull Request using GitHub's web interface or the `gh` CLI:
   ```bash
   gh pr create
   ```
3. Fill out the PR template completely, including test verification and relevant screenshots.
4. Maintainers will review your submission and provide actionable feedback.
