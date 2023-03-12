# Kotebe University of Education – Student Entry & Exit Management (Frontend)

React + Vite frontend. There is **no backend yet**: the app runs entirely on mock data.

## Run

```bash
npm install
npm run dev
```

## Demo accounts

| Role    | Username  | Password     |
| ------- | --------- | ------------ |
| Student | `student` | `student123` |
| Guard   | `guard`   | `guard123`   |
| Proctor | `proctor` | `proctor123` |

Other students (`hana`, `yonas`, `meron`, `bereket`, `liya`, `natnael`) use `student123`.
The second proctor is `almaz` and the second guard is `kebede` (passwords `proctor123` and `guard123`).

## Workflow

1. **Guard → Record Entry**: register the laptops, PCs and other items a student brings in.
2. **Student → New Exit Request**: pick registered belongings and/or declare other items (clothing, bags…).
3. **Proctor → Review Requests**: approve or reject (rejection needs a note).
4. **Proctor → Account Provision**: manage and provision student, guard, and proctor accounts.
5. **Guard → Verify Exit**: tick each item against the approved pass, then allow or deny exit.

## Mock data

- `data/` holds the seed data in static JSON files: `users.json`, `belongings.json`, `exitRequests.json`, `gateLogs.json`.
- `context/StoreProvider.jsx` is the in-memory "API". It seeds from `data/`, and
  every change is saved to `localStorage`, so it carries across reloads and role switches.
- Static mock data can also be imported directly from `data/*.json` into pages as needed.

To connect a real backend later, replace the action functions in `StoreProvider.jsx` with
API calls. The pages only use `useStore()` and don't need to change.

## Structure

```
client/
  data/          mock seed data in JSON files (users.json, etc.) and constants
  context/       store (state + actions) and the useStore hook
  components/    layout, shared UI, icons, request details
  pages/
    student/     dashboard, belongings, new request, my requests
    guard/       dashboard, record entry, verify exit
    proctor/     dashboard, student leave requests, account provision
    shared/      gate records and requests browser (used by several roles)
  utils/         formatting helpers
```
