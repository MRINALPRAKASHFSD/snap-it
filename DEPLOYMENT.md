# Production Deployment Guide

This guide covers building and deploying Snap-it to production environments, including Lovable sync, Vercel, and Cloudflare Pages.

## 1. Production Build Pipeline

Snap-it uses Vite and Rolldown for asset compilation and bundle optimization.

Run the production build:

```bash
bun run build
# or
npm run build
```

This generates production-ready assets in the `dist/` directory:
- Code-split JavaScript chunks with content hashes.
- Minified Tailwind CSS v4 stylesheets.
- Pre-rendered server functions for TanStack Start SSR.

## 2. Environment Variables Checklist

Ensure these variables are configured in your production hosting platform:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `SUPABASE_PROJECT_ID` | Yes | Supabase project identifier |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Public Supabase anon client key |
| `SUPABASE_URL` | Yes | Fully qualified Supabase API URL (`https://<project-id>.supabase.co`) |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Frontend Vite copy of Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Frontend Vite copy of Supabase publishable key |
| `VITE_SUPABASE_URL` | Yes | Frontend Vite copy of Supabase URL |

> [!CAUTION]
> Never expose your Supabase `service_role` key in frontend bundles or client environment variables. Keep it strictly inside protected edge functions or server-side workflows.

## 3. Lovable Deployment & Git Sync

If hosting via [Lovable](https://lovable.dev):
1. Commits pushed to the connected branch on GitHub automatically synchronize with the Lovable editor and trigger deployment.
2. Ensure you do not force-push (`git push --force`) or amend existing commits that have already synced to Lovable, as this corrupts editor revision history.
3. Keep the branch buildable at all times (`bun run build` must succeed before pushing).

## 4. Deploying to Vercel

Snap-it can be deployed to Vercel with zero configuration:

1. Import the repository in the Vercel Dashboard.
2. Select **Vite** or **Other** as the framework preset.
3. Configure the environment variables from the checklist above.
4. Set Build Command: `bun run build` (or `npm run build`).
5. Set Output Directory: `dist`.
6. Click **Deploy**.

## 5. Security & CSP Headers

For production domains, configure these Content Security Policy (CSP) headers:
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co;`
- `media-src 'self' blob:;` (Allows camera `MediaStream` and WebP blobs)
- `img-src 'self' data: blob: https://*.supabase.co;`
