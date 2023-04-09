# Kotebe University of Education – Student Entry & Exit Management (Frontend)

React + Vite frontend connected to Express + PostgreSQL backend with JWT authentication.

## Run

```bash
npm install
npm run dev
```

## Accounts

| Role    | Full Name   | Username   | Password   |
| ------- | ----------- | ---------- | ---------- |
| Proctor | Amir Siraj  | `Amir3356` | `AEHJSS36` |

Proctors provision student and guard accounts through the **Account Provision** dashboard.

## Workflow

1. **Guard → Record Entry**: register the laptops, PCs and other items a student brings in.
2. **Student → New Exit Request**: pick registered belongings and/or declare other items (clothing, bags…).
3. **Proctor → Review Requests**: approve or reject (rejection needs a note).
4. **Proctor → Account Provision**: manage and provision student, guard, and proctor accounts.
5. **Guard → Verify Exit**: tick each item against the approved pass, then allow or deny exit.

## Backend Integration

- `api/` provides the HTTP client with automatic JWT bearer authorization.
- `services/` contains domain business logic and validation schemas.
- `models/` defines domain constants (`ROLES`, `DEPARTMENTS`, `ITEM_CATEGORIES`, `GATES`) and Zod schemas.
- `context/StoreProvider.jsx` synchronizes data with the backend and manages local reactive UI state.

## Structure

```
client/
  api/           HTTP API client modules (auth, users, belongings, requests, gate)
  models/        domain models, constants, and Zod validation schemas
  services/      frontend business logic layer
  context/       store (state + actions) and the useStore hook
  components/    layout, shared UI, icons, request details
  pages/
    student/     dashboard, belongings, new request, my requests
    guard/       dashboard, record entry, verify exit
    proctor/     dashboard, student leave requests, account provision
    shared/      gate records and requests browser (used by several roles)
  utils/         formatting helpers
```
