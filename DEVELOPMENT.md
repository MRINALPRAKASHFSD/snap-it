# Local Development Guide

This guide helps you set up a local development environment for Snap-it, run the development server, execute tests, and contribute code.

## Prerequisites

- **Node.js:** v20.0.0 or higher
- **Bun:** v1.1.0 or higher (or npm v10+)
- **Git:** v2.30+
- **Modern Web Browser:** Chrome, Safari, Firefox, or Edge supporting WebRTC / `MediaDevices.getUserMedia`

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MRINALPRAKASHFSD/snap-it.git
   cd snap-it
   ```

2. Install dependencies:
   ```bash
   bun install
   # or with npm
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase credentials:
   ```ini
   SUPABASE_PROJECT_ID="your-project-id"
   SUPABASE_PUBLISHABLE_KEY="your-anon-publishable-key"
   SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-publishable-key"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   ```

## Running the Application

### Development Server
```bash
bun run dev
# or
npm run dev
```
The server will start at `http://localhost:3000` with hot module replacement (HMR).

### Production Build
To create a production-optimized build:
```bash
bun run build
# or
npm run build
```
Preview the built artifacts locally:
```bash
bun run preview
```

## Running Quality Checks

### Linting & Formatting
```bash
bun run lint      # Runs ESLint across all TypeScript and React files
bun run format    # Runs Prettier to format source code
```

### Running Tests
```bash
bun run test      # Runs Vitest unit and integration test suites
bun run test:watch # Runs tests in watch mode during development
```

## Working with the Camera Adapter

The camera integration lives in `src/lib/camera/useCamera.ts`.
- When developing locally on a laptop or desktop without a rear camera, `useCamera` automatically falls back to the user-facing webcam if `environment` is requested.
- To simulate mobile viewport and camera constraints in desktop Chrome:
  1. Open Chrome DevTools (`Cmd + Option + I` on Mac or `F12`).
  2. Toggle device toolbar (`Cmd + Shift + M`).
  3. Under DevTools Sensors tab, you can test orientation changes.

## Database Migrations

Database definitions are managed with Drizzle ORM in `drizzle/`:
- `drizzle/schema.ts`: Schema tables, relations, and types.
- `drizzle/migrations/`: SQL migration files applied in order.

To generate or inspect schema migrations, see `drizzle.config.ts`.
