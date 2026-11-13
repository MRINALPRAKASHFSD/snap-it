# Code Style & Quality Standards

This document outlines the coding standards, formatting guidelines, and architectural patterns expected in Snap-it.

## 1. Tooling & Enforcement

- **Formatter:** Prettier (`.prettierrc`) with 2-space indentation, semicolons enabled, and double quotes.
- **Linter:** ESLint 9 (`eslint.config.js`) with React hooks and TypeScript strict rules.
- **Pre-commit Checks:** Run `bun run lint && bun run format` before pushing code.

## 2. TypeScript Conventions

- **Strict Types:** Do not use `any`. Use `unknown` when input is truly unconstrained, then narrow with type guards.
- **Interfaces vs. Types:**
  - Use `interface` for object shapes, component props, and API response contracts that may be extended.
  - Use `type` for unions, intersections, tuples, and primitive aliases.
- **Explicit Returns:** Annotate return types for public library functions and server-side RPC handlers in `src/lib/`.

```typescript
// Good
export interface StoryAudienceFilter {
  readonly audience: 'friends' | 'selected';
  readonly selectedIds?: readonly string[];
}

export function isStoryExpired(createdAt: string | Date, now: Date = new Date()): boolean {
  const createdMs = new Date(createdAt).getTime();
  const diffMs = now.getTime() - createdMs;
  return diffMs >= 24 * 60 * 60 * 1000;
}
```

## 3. React Component Architecture

- **Functional Components:** All components are written as functional components with explicit prop typing.
- **Atomic Primitives in `src/components/ui/`:** Keep primitive UI elements completely decoupled from application business logic.
- **Custom Hooks for Side Effects:** Extract complex DOM or browser API interactions (like camera feeds or device orientation) into dedicated hooks under `src/hooks/` or `src/lib/camera/`.

```tsx
// Good: Clear props, isolated logic, semantic markup
interface SocialAvatarProps {
  readonly username: string;
  readonly avatarUrl?: string | null;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly isOnline?: boolean;
}

export function SocialAvatar({ username, avatarUrl, size = 'md', isOnline }: SocialAvatarProps) {
  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeMap[size])}>
        <AvatarImage src={avatarUrl ?? undefined} alt={username} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
      )}
    </div>
  );
}
```

## 4. Styling with Tailwind CSS v4

- **Utility Classes:** Use Tailwind v4 utility classes directly in `className`.
- **Class Merging:** Always wrap dynamic class names with `cn(...)` from `src/lib/utils.ts` to resolve conflicts predictably.
- **Color Palettes & Theme Tokens:** Use theme tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`) rather than hardcoded hex values to support dark and light modes cleanly.

## 5. Humanizer Documentation Standard

All documentation, README files, and commit messages must adhere to the [Humanizer](.skills/humanizer/SKILL.md) standard:
- Direct, clear statements.
- No AI cliché words ("delve", "testament", "pivotal", "evolving landscape", "beacon").
- Active voice with precise technical justification.
