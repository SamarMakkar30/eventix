# Eventix frontend

Eventix is a Vite, React, and TypeScript frontend for the Eventix API Gateway. It uses TanStack Query, React Hook Form with Zod, Motion, and the Eventix design system.

All browser traffic goes through the API Gateway. Configure its origin in `.env` using `VITE_API_BASE_URL`; it defaults to `http://localhost:8080`.

```bash
npm ci
npm run dev
npm run lint
npm run test
npm run build
```

Docker serves the production application at `http://localhost:3000`.

Availability is quantity based (`availableSeats`). The selector deliberately represents live capacity and sends a real ticket quantity rather than inventing individual seat IDs.

See [the frontend handoff](../docs/handoff.md) for architecture, deployment, local seed data, routes, and backend gaps.
