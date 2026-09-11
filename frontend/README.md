# Eventix frontend

The Eventix product frontend is built with React, TypeScript, Vite, TanStack Query,
React Hook Form/Zod, Motion, and a custom responsive design system.

All browser traffic is sent through the API Gateway only. Configure the gateway origin
in `.env` using `VITE_API_BASE_URL` (see `.env.example`); it defaults to
`http://localhost:8080`.

```bash
npm install
npm run dev
npm run build
npm run lint
```

When run through Docker Compose, the frontend is served on http://localhost:3000.

Backend limitation: availability is quantity-based (`availableSeats`), not an
individual-seat reservation API. The ticket selector intentionally represents live
capacity and sends the real requested quantity—rather than faking seat IDs.
