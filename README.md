# Outreach CRM

Outreach CRM is a local-first React workspace for organizing outreach projects.
The public foundation is intentionally small: it provides a responsive
shadcn-style interface, a browser smoke test, and a boundary for the future
local TypeScript service.

## Current status

This repository currently contains:

- a React + TypeScript + Vite frontend;
- shadcn/ui conventions with copy-ready Spell UI components;
- a truthful empty workspace state with zero metrics;
- a minimal local TypeScript service boundary with `GET /health`;
- formatting, linting, type checking, unit tests, browser smoke tests, and a
  production build.

Authentication, Excel access, Gmail integration, and project persistence are
intentionally not part of this foundation release.

## Requirements

- Node.js 20 or newer;
- npm 10 or newer.

## Setup

Install the locked dependencies:

```sh
npm ci
```

Start the frontend in development:

```sh
npm run dev
```

Start the local service boundary separately when needed:

```sh
npm run service:dev
```

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

The application is designed for local use. Do not commit credentials, tokens,
client files, databases, environment files, or private product documentation.

## License

This project is licensed under the MIT License.
