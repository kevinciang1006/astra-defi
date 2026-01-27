# AstraDeFi Project Rules

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18+, TypeScript 5+, Tailwind CSS
- **UI Library**: Shadcn/ui (Radix Primitives), Lucide React, Framer Motion (for premium feel)
- **Backend Infrastructure**:
  - **API**: Next.js Server Components & Route Handlers
  - **Database**: MySQL (via Prisma ORM)
  - **Caching**: Redis (Upstash or self-hosted)
  - **Worker**: Node.js/TypeScript separate worker service for blockchain polling (Optional for MVP, but good for architecture)
- **Testing**: Jest (Unit), Playwright (E2E)

## Coding Standards

### General

- **Strict TypeScript**: No `any`. Use `unknown` or strictly typed interfaces.
- **Functional Functional**: Prefer pure functions. Avoid classes unless necessary.
- **Comments**: Comment _why_, not _what_. Document complex logic with JSDoc.

### Frontend

- **Server Components**: Default to Server Components. Use `'use client'` only for interactive leaves.
- **State Management**:
  - Server State: React Query (TanStack Query) or SWR
  - Client Global State: Jotai or Zustand (Minimal global state)
  - URL State: Use `nuqs` or search params for filter/sort state
- **Performance**:
  - Optimize images (`next/image`).
  - Use `React.memo` and `useCallback` judiciously.
  - Implement Suspense boundaries for async data.

### Backend & API

- **Response Format**: standardized JSON: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- **Validation**: Zod schema validation for ALL inputs (API inputs, Env vars).
- **Error Handling**: Centralized error logging. Never expose stack traces to client in production.

## Workflow

- **Commits**: Conventional Commits (e.g., `feat: add wallet connection`, `fix: token parsing`).
- **Branching**: Feature branch workflow (`feature/xyz` -> `main`).

## Commands

- `npm run dev`: Start dev server
- `npm run build`: Production build
- `npm run lint`: Fix linting errors
- `npx prisma studio`: View database
