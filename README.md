# Outreach CRM

Outreach CRM is a local-first React workspace for organizing outreach projects.
The local app provides a responsive shadcn-style interface, private local
accounts, browser smoke tests, and a TypeScript service for account-scoped
workspace data.

## Current status

This repository currently contains:

- a React + TypeScript + Vite frontend;
- shadcn/ui conventions with copy-ready Spell UI components;
- a private local account flow with registration, login, logout, and sessions;
- account-scoped project metadata stored outside Git;
- formatting, linting, type checking, unit tests, browser smoke tests, and a
  production build.

Excel access and Gmail integration are intentionally not connected yet. Their
UI entry points are interactive and explain the next integration step.

## Requirements

- Node.js 20 or newer;
- npm 10 or newer.

## Setup

Install the locked dependencies:

```sh
npm ci
```

Install the Chromium browser used by the Playwright smoke test:

```sh
npm run setup:browsers
```

Run this once after a fresh install, and again when the Playwright version
changes. The regular quality check does not download browsers or require
network access.

Start the frontend in development:

```sh
npm run dev
```

Start the local service boundary separately when needed:

```sh
npm run service:dev
```

Run both the frontend and the local service in two terminals:

```sh
npm run dev
npm run service:dev
```

The frontend proxies `/api` requests to the local service during development
and preview.

The service binds to `127.0.0.1:8787` by default. Its health endpoint is:

```text
GET http://127.0.0.1:8787/health
```

## Quality checks

Run the complete local check:

```sh
npm run check
```

Run the production browser smoke test:

```sh
npm run test:e2e
```

## Privacy and local data

The application is designed for local use. Account records, password hashes,
sessions, project paths, and future synced outreach data live in the ignored
`data/` directory. Passwords are never stored in plain text, and session tokens
are stored on disk only as hashes. Do not commit credentials, tokens, client
files, databases, environment files, or private product documentation.

Each clone starts with its own empty local data directory. Each person can
create a separate account, so cloning the repository does not expose another
user's workspace.

## License

This project is licensed under the MIT License.
