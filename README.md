# Kotebe University of Education – Student Entry & Exit Management System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

A complete, role-based campus security and student leave clearance platform engineered for **Kotebe University of Education**. The system digitizes gate entries, student personal property tracking (laptops, PCs, tablets), leave pass approvals, and checkpoint verification with real-time WebSocket synchronization, Zod schema validation, Knex migrations, and network idempotency protection.

---

## 📑 Table of Contents

- [System Overview](#-system-overview)
- [Functional Requirements (FR)](#-functional-requirements-fr)
- [Non-Functional Requirements (NFR)](#-non-functional-requirements-nfr)
- [User Roles & Key Features](#-user-roles--key-features)
- [System Architecture](#-system-architecture)
- [Database Schema & ERD](#-database-schema--erd)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started & Installation](#-getting-started--installation)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Default Seed Credentials](#-default-seed-credentials)
- [End-to-End System Workflows](#-end-to-end-system-workflows)
- [REST API Reference](#-rest-api-reference)
- [Real-Time WebSocket Events](#-real-time-websocket-events)
- [Security & Reliability Highlights](#-security--reliability-highlights)
- [Environment Variables](#-environment-variables)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [Contributing & License](#-contributing--license)

---

## 🎯 System Overview

Controlling and auditing campus access for students and their high-value belongings is a critical security responsibility. Manual paper logbooks are prone to loss, unauthorized alteration, bottlenecks at gates, and a lack of real-time auditability.

This platform replaces paper-based gate passes with an automated digital workflow:
1. **Gate Check-in & Belonging Registration**: Security guards register laptops and electronics when students arrive on campus.
2. **Leave Pass Application**: Students submit digital exit pass requests with destinations, departure/return dates, and declared belongings.
3. **Proctor Approval Workflow**: University proctors review, approve, or reject leave requests with mandatory remarks.
4. **Guard Gate Verification**: Guards verify student identity and tick off approved items against the pass before authorizing exit.
5. **Real-Time Audit Trail**: All movements (Entry, Exit, Denied) are instantly logged and broadcast across dashboards.

---

## 📋 Functional Requirements (FR)

The system fulfills the following functional requirements:

### 1. User Authentication & Role-Based Access Control (RBAC)
- **FR-1.1 (Authentication)**: The system shall authenticate users (Students, Proctors, Guards) via unique usernames and passwords.
- **FR-1.2 (Session & JWT)**: The system shall generate signed JSON Web Tokens (JWT) upon successful login and validate tokens on protected routes.
- **FR-1.3 (Role Authorization)**: The system shall restrict pages, API routes, and operations according to assigned roles (`student`, `guard`, `proctor`).
- **FR-1.4 (Account Provisioning)**: Proctors shall be able to create, edit, activate/deactivate, and delete accounts for students, guards, and proctors.
- **FR-1.5 (Account Approval Lifecycle)**: The system shall track account approval statuses (`approve`, `pending`, `reject`).

### 2. Student Belongings & Asset Management
- **FR-2.1 (Property Registration)**: The system shall record student belongings with attributes: Category (Laptop, Desktop Computer, Tablet, Electronics, Other), Brand, Model/Description, Serial Number, and Color.
- **FR-2.2 (Gate Registration by Guard)**: Campus guards shall be able to register new belongings on behalf of a student upon campus entry.
- **FR-2.3 (Student Inventory View)**: Students shall be able to view their personal registered belongings and verify active/inactive campus status.
- **FR-2.4 (Status Toggling)**: Proctors and students shall be able to update belongings or toggle status between active and inactive.
- **FR-2.5 (Schema Validation)**: The system shall validate all belonging fields (required categories, non-empty descriptions) using Zod.

### 3. Exit Pass & Leave Request Management
- **FR-3.1 (Request Submission)**: Students shall be able to draft and submit leave pass requests specifying Reason, Destination, Departure Date, and Expected Return Date.
- **FR-3.2 (Belonging Selection & Declaration)**: Students shall be able to attach registered belongings and/or declare additional items to take off-campus.
- **FR-3.3 (Unique Pass Codes)**: The system shall generate unique, sequential, human-readable pass codes (e.g. `EXR-2026-0001`).
- **FR-3.4 (Date Integrity)**: The system shall enforce that the expected return date must be greater than or equal to the departure date.
- **FR-3.5 (Request Cancellation)**: Students shall be able to cancel pending exit pass requests prior to proctor review.
- **FR-3.6 (Request Tracking)**: Students shall be able to track request status (`pending`, `approved`, `rejected`, `completed`, `cancelled`) in real time.

### 4. Proctor Review & Decision Workflow
- **FR-4.1 (Leave Request Inbox)**: Proctors shall have access to an inbox displaying all pending, approved, and rejected leave requests with student details.
- **FR-4.2 (Pass Approval)**: Proctors shall be able to approve pending leave requests, recording reviewer ID and timestamp.
- **FR-4.3 (Pass Rejection with Reason)**: Proctors shall be able to reject leave requests, with the system enforcing a mandatory written explanation/note.
- **FR-4.4 (Student Profile Inspection)**: Proctors shall be able to view student department, dorm, and registered belongings during the review process.

### 5. Security Gate Verification & Logging
- **FR-5.1 (Record Entry)**: Guards shall record student entries, capturing student ID, gate location (`Main Gate`, `Back Gate`), items brought in, and timestamp.
- **FR-5.2 (Pass Lookup & Verification)**: Guards shall be able to look up approved exit passes using the pass code or student ID.
- **FR-5.3 (Physical Verification Checklist)**: The system shall display an itemized checklist of approved items and serial numbers for physical cross-examination.
- **FR-5.4 (Allow Exit)**: Guards shall be able to mark an approved exit pass as completed, generating an immutable `exit` gate log.
- **FR-5.5 (Deny Exit with Justification)**: If items do not match or permission is invalid, guards shall be able to deny exit, requiring a mandatory reason note and generating a `denied` log.
- **FR-5.6 (Gate Audit Trail)**: The system shall maintain searchable, filterable logs of all entries, exits, and denials categorized by gate, student, and date.

### 6. Real-Time Synchronization & WebSockets
- **FR-6.1 (Live Request Updates)**: The system shall push real-time WebSocket events (`request:created`, `request:reviewed`, `request:cancelled`) to connected clients without requiring manual browser refresh.
- **FR-6.2 (Live Gate Activity)**: Gate activity events (`gate:activity`) shall stream instantly to guard and proctor dashboards.
- **FR-6.3 (Live Account & Inventory Sync)**: Changes to user profiles (`user:updated`) and belongings (`belonging:updated`) shall propagate reactively.

---

## ⚡ Non-Functional Requirements (NFR)

The system adheres to the following non-functional quality standards:

### 1. Performance & Responsiveness
- **NFR-1.1 (API Latency)**: 95% of standard read and write REST API requests shall respond within 200 milliseconds under normal operating load.
- **NFR-1.2 (Real-Time Broadcast)**: WebSocket event delivery from server emission to client reception shall occur within 100 milliseconds.
- **NFR-1.3 (Database Indexing)**: Critical database columns (`users.id`, `users.username`, `exit_requests.code`, `exit_requests.student_id`, `gate_logs.timestamp`) shall be indexed for fast lookups.
- **NFR-1.4 (Frontend Bundle Optimization)**: The client application shall be built and bundled with Vite to ensure low initial load times and efficient asset chunking.

### 2. Security & Data Protection
- **NFR-2.1 (Stateless Authentication)**: All protected API requests must carry a valid JWT Bearer token in the `Authorization` header.
- **NFR-2.2 (Credential Protection)**: User passwords shall never be exposed in API responses or client-side storage.
- **NFR-2.3 (Network Idempotency)**: Critical mutation endpoints (user provisioning and updates) shall implement idempotency key tracking (`idempotency_keys` table) to prevent duplicate transactions caused by network retries or double-submissions.
- **NFR-2.4 (Injection Prevention & Schema Validation)**: All input payloads must be parsed and sanitized through server-side Zod validation schemas before reaching business logic or database queries.

### 3. Reliability & Fault Tolerance
- **NFR-3.1 (Automatic Port Recovery)**: The backend server shall detect port collision (`EADDRINUSE` on port 5000), automatically terminate orphaned processes, and retry binding without manual operator intervention.
- **NFR-3.2 (Graceful Server Shutdown)**: On system termination signals (`SIGINT`, `SIGTERM`, `SIGUSR2`), the application shall cleanly close HTTP listeners, WebSocket pools, and Knex connection pools to prevent hanging connections.
- **NFR-3.3 (Data Consistency)**: Database transactions shall be used when creating exit requests alongside request items to prevent orphaned records.
- **NFR-3.4 (System Diagnostics)**: The system shall expose a `/api/health` endpoint reporting server uptime and active PostgreSQL pool connection health.

### 4. Usability & User Experience
- **NFR-4.1 (Responsive Design)**: The interface shall render cleanly on desktop monitors, laptops, and mobile/tablet devices used at security gate kiosks.
- **NFR-4.2 (Visual Feedback)**: Color-coded status badges (Green: Approved/Active; Yellow: Pending; Red: Rejected/Denied/Inactive) shall give immediate visual clarity.
- **NFR-4.3 (Accessibility & Contrast)**: Typography and UI components shall utilize high-contrast, legible palettes adhering to accessibility best practices.

### 5. Maintainability & Code Architecture
- **NFR-5.1 (Layered Architecture)**: The backend shall maintain strict separation of concerns across Routes, Middlewares, Controllers, Services, Repositories, and Models.
- **NFR-5.2 (Database Version Control)**: Database schema definitions and seed data shall be version-controlled via Knex migration files.
- **NFR-5.3 (Modular Standards)**: The entire codebase shall strictly adhere to modern ECMAScript Module (`ESM`) standards.

---

## 👥 User Roles & Key Features

| Role | Primary Responsibilities | Available Screens / Modules |
|---|---|---|
| **Student** | • Register personal belongings<br>• Submit exit/leave requests<br>• Monitor pass status and reviewer feedback | • Student Dashboard<br>• My Belongings<br>• New Exit Request<br>• My Requests History |
| **Proctor** | • Review and approve/reject leave requests<br>• Provision and manage user accounts<br>• Monitor campus-wide student movement | • Proctor Dashboard<br>• Student Leave Requests<br>• Account Provisioning<br>• Gate Records & Audit |
| **Guard** | • Record student entry and belongings<br>• Verify exit passes against physical items<br>• Authorize or deny student exit with logs | • Guard Dashboard<br>• Record Entry<br>• Verify Exit<br>• Gate Audit Logs |

---

## 🏛 System Architecture

The project employs a **Monolithic Layered Architecture** with a decoupled React frontend and Express backend:

```mermaid
graph TD
    Client["React 19 SPA (Vite + Vanilla CSS)"]
    SocketClient["Socket.IO Client"]
    HttpClient["Axios HTTP Client"]

    Server["Express 5 Node.js Server"]
    SocketServer["Socket.IO Server (Real-time Broadcast)"]
    Router["API Router (/api)"]
    AuthMW["Auth & Role Middlewares"]
    IdemMW["Idempotency Middleware"]
    ZodMW["Zod Validation Layer"]
    Controllers["Controllers Layer"]
    Services["Domain Services Layer"]
    Repos["Repository Layer"]
    Postgres[("PostgreSQL Database (Knex.js)")]

    Client --> HttpClient
    Client --> SocketClient
    HttpClient -->|JWT Bearer| Router
    SocketClient <-->|Bi-directional Events| SocketServer

    Router --> AuthMW --> IdemMW --> ZodMW --> Controllers
    Controllers --> Services
    Services --> Repos
    Services -->|Trigger Event| SocketServer
    Repos --> Postgres
```

---

## 🗄 Database Schema & ERD

The relational schema is defined through Knex migrations:

```mermaid
erDiagram
    users ||--o{ belongings : "owns"
    users ||--o{ exit_requests : "requests"
    users ||--o{ gate_logs : "passes through"
    exit_requests ||--o{ exit_request_items : "contains"
    belongings ||--o{ exit_request_items : "included in"
    exit_requests ||--o{ gate_logs : "associated with"

    users {
        string id PK
        string role "student | guard | proctor"
        string name
        string username UK
        string password
        string email
        string phone
        string student_id
        string department
        string address
        string subcity
        string woreda
        integer year
        string dorm
        string gate
        string assigned_blocks
        string status "active | inactive"
        string approval_status "approve | pending | reject"
        timestamp created_at
    }

    belongings {
        string id PK
        string student_id FK
        string category "Laptop | Desktop Computer | Tablet | Electronics | Other"
        string description
        string brand
        string serial_number
        string color
        string status "active | inactive"
        string registered_by
        timestamp registered_at
    }

    exit_requests {
        string id PK
        string code UK "e.g. EXR-2026-0001"
        string student_id FK
        text reason
        string destination
        date departure_date
        date return_date
        string status "pending | approved | rejected | completed | cancelled"
        string reviewed_by FK
        timestamp reviewed_at
        text review_note
        string verified_by FK
        timestamp exited_at
        timestamp created_at
    }

    exit_request_items {
        string id PK
        string request_id FK
        string belonging_id FK
        string category
        string description
        string serial_number
        integer quantity
    }

    gate_logs {
        string id PK
        string type "entry | exit | denied"
        string student_id FK
        string guard_id FK
        string gate "Main Gate | Back Gate"
        timestamp timestamp
        string request_id FK
        text note
        json items
    }

    idempotency_keys {
        string key PK
        string user_id
        string route
        integer response_code
        text response_body
        timestamp created_at
        timestamp expires_at
    }
```

---

## 🛠 Technology Stack

| Layer | Technology | Version | Description |
|---|---|---|---|
| **Frontend Framework** | [React](https://react.dev/) | 19.x | Component-based UI library |
| **Frontend Tooling** | [Vite](https://vitejs.dev/) | 8.x | Next-generation bundler and dev server |
| **Client Routing** | [React Router](https://reactrouter.com/) | 7.x | Declarative client routing |
| **Icons & Design** | [Lucide React](https://lucide.dev/) + CSS | 1.56 | Modern, bespoke UI design system |
| **State Management** | React Context (`StoreProvider`) | — | Synchronized client state with backend |
| **HTTP Client** | [Axios](https://axios-http.com/) | 1.20 | Promise HTTP client with Bearer auth interceptors |
| **Backend Framework** | [Express](https://expressjs.com/) | 5.x | High-performance REST API engine |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | 14+ | Relational SQL database |
| **Query Builder / Migrations** | [Knex.js](https://knexjs.org/) | 3.3 | SQL query builder, migrations, and seeds |
| **Real-Time WebSockets** | [Socket.IO](https://socket.io/) | 4.8 | Full-duplex event-driven communication |
| **Data Validation** | [Zod](https://zod.dev/) | 4.6 | Schema declaration and static type inference |
| **Authentication** | [jsonwebtoken](https://jwt.io/) | 9.0 | Cryptographic stateless JWT tokens |

---

## 📂 Repository Structure

```
.
├── client/                     # Frontend Single Page Application
│   ├── api/                    # Axios API client modules (auth, users, belongings, requests, gate)
│   ├── asset/                  # Static assets and images
│   ├── components/             # Reusable UI components, modals, tables, badges, navbar
│   ├── context/                # Global state store (StoreProvider.jsx) & Socket.io integration
│   ├── hooks/                  # Custom React hooks
│   ├── layout/                 # Layout wrappers (Sidebar, Topbar, ProtectedRoute)
│   ├── models/                 # Domain constants, Zod schemas, and model normalizers
│   ├── pages/                  # Application page views
│   │   ├── guard/              # Guard dashboard, Record Entry, Verify Exit, Gate Audit
│   │   ├── proctor/            # Proctor dashboard, Student Leave Requests, Account Provision
│   │   ├── student/            # Student dashboard, My Belongings, New Request, My Requests
│   │   └── shared/             # Gate Records and Request Browser
│   ├── routes/                 # App routing configuration
│   ├── services/               # Frontend business logic services
│   ├── utils/                  # Formatting, date, and validation utilities
│   ├── index.css               # Complete bespoke styling & design system
│   ├── package.json            # Client dependencies & scripts
│   └── vite.config.js          # Vite build config
│
├── server/                     # Backend API & WebSocket Server
│   ├── config/                 # Database pool (Knex/pg) and Socket.IO initialization
│   ├── controllers/            # HTTP controller route handlers
│   ├── middleware/             # Auth, role check, Zod validator, idempotency, error handlers
│   ├── migrations/             # Knex database migrations
│   ├── models/                 # Server entity definitions and Zod validation schemas
│   ├── repositories/           # Database access layer (SQL/Knex queries)
│   ├── routes/                 # Express route definitions (auth, users, belongings, requests, gate)
│   ├── seeds/                  # Initial seed data (default proctor account)
│   ├── services/               # Business logic, state transitions & event triggers
│   ├── .env.example            # Environment variables template
│   ├── knexfile.js             # Knex migration & connection config
│   ├── package.json            # Server dependencies & scripts
│   └── server.js               # Application entrypoint & HTTP server setup
└── README.md                   # Complete documentation
```

---

## 🚀 Getting Started & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: v14.0 or higher ([Download PostgreSQL](https://www.postgresql.org/download/))
- **npm**: v9.0.0 or higher

---

### 1. Backend Setup

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and verify your PostgreSQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development

   # PostgreSQL Connection
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=kotebe_exit_entry_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/kotebe_exit_entry_db

   # JWT Authentication
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```

4. **Create the Database in PostgreSQL**:
   Using `psql` or pgAdmin:
   ```sql
   CREATE DATABASE kotebe_exit_entry_db;
   ```

5. **Run Migrations & Seed Initial Data**:
   Execute migrations to build all tables:
   ```bash
   npm run db:migrate
   ```
   Seed the default Proctor account:
   ```bash
   npm run db:seed
   ```
   *(To wipe, re-run all migrations, and re-seed from scratch: `npm run db:fresh`)*

6. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   The server will start on: **`http://localhost:5000`**

---

### 2. Frontend Setup

1. **Open a new terminal and navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The client application will start at: **`http://localhost:5173`** (or the port indicated in your terminal).

---

## 🔑 Default Seed Credentials

The initial database seed provisions the master Proctor account:

| Role | Full Name | Username | Password | Privileges |
|---|---|---|---|---|
| **Proctor** | Amir Siraj | `Amir3356` | `AEHJSS36` | Full administrative access to provision students, guards, and proctors |

> **First Login**: Use the credentials above to log in, navigate to **Account Provision**, and create student and guard accounts as needed.

---

## 🔄 End-to-End System Workflows

### 1. Student Belonging Registration (Campus Entry)
```
[Student Arrives with Laptop/PC] 
         │
         ▼
[Guard opens "Record Entry"] ──> [Inputs Student ID, Brand, Model, Serial No.]
         │
         ▼
[Item saved to Database & assigned to Student profile]
         │
         ▼
[Live Gate Entry Log recorded & WebSocket event broadcasted]
```

### 2. Leave / Exit Pass Workflow
```
[Student logs into Portal] ──> [Fills Exit Pass Request]
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
     [Selects Registered Items]               [Declares Items + Destination & Dates]
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      ▼
                      [Submits Pass (Status: PENDING)]
                                      │
                                      ▼
                      [Proctor Reviews in Leave Dashboard]
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
             [PROCTOR APPROVES]               [PROCTOR REJECTS]
                     │                                 │
                     ▼                                 ▼
         [Status: APPROVED]                   [Status: REJECTED]
         [Student notified live]              [Must supply reason note]
```

### 3. Guard Exit Verification
```
[Student arrives at Gate with belongings]
                     │
                     ▼
[Guard enters Pass Code (e.g. EXR-2026-0001)]
                     │
                     ▼
[System displays approved items & serial numbers]
                     │
                     ▼
[Guard physically inspects items against list]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   [All Items Match]       [Discrepancy / Suspicion]
         │                       │
         ▼                       ▼
    [ALLOW EXIT]            [DENY EXIT]
         │                       │
         ▼                       ▼
[Status: COMPLETED]        [Logs Denied Record + Reason]
[Gate Log recorded]        [Student & Proctor alerted]
```

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user credentials and return JWT token | No |
| `GET` | `/api/auth/me` | Return currently authenticated user profile | Yes |

### 👥 User & Account Management (`/api/users`)
| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/api/users` | List users with optional role & query filters | Proctor, Guard |
| `GET` | `/api/users/:id` | Get user details by ID | Authenticated |
| `POST` | `/api/users` | Provision a new user account (idempotent) | Proctor |
| `PUT` | `/api/users/:id` | Update an existing user profile (idempotent) | Proctor |
| `PATCH` | `/api/users/:id/status` | Toggle user active/inactive status | Proctor |
| `DELETE` | `/api/users/:id` | Permanently remove a user account | Proctor |

### 💻 Belongings Management (`/api/belongings`)
| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/api/belongings` | List belongings (filtered by student or all) | Authenticated |
| `GET` | `/api/belongings/:id` | Get details of a specific belonging | Authenticated |
| `POST` | `/api/belongings` | Register a new belonging item | Student, Guard, Proctor |
| `PUT` | `/api/belongings/:id` | Update belonging specifications | Owner, Guard, Proctor |
| `PATCH` | `/api/belongings/:id/status`| Toggle active/inactive status | Owner, Proctor |
| `DELETE` | `/api/belongings/:id` | Remove a belonging record | Owner, Proctor |

### 📝 Exit Pass Requests (`/api/exit-requests`)
| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/api/exit-requests` | List leave requests (supports status filters) | Authenticated |
| `GET` | `/api/exit-requests/:id` | Retrieve single request with items | Authenticated |
| `POST` | `/api/exit-requests` | Submit a new exit pass request | Student |
| `PUT` | `/api/exit-requests/:id` | Update a pending exit request | Student (Owner) |
| `PATCH`| `/api/exit-requests/:id/review` | Approve or reject a request | Proctor |
| `PATCH`| `/api/exit-requests/:id/cancel` | Cancel an exit request | Student (Owner) |
| `DELETE`| `/api/exit-requests/:id` | Delete an exit request | Student, Proctor |

### 🚧 Gate Operations & Logs (`/api/gate`)
| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/api/gate/logs` | Fetch real-time gate transaction logs | Authenticated |
| `POST` | `/api/gate/entry` | Record student entry with belongings | Guard |
| `POST` | `/api/gate/exit` | Allow and log an approved student exit | Guard |
| `POST` | `/api/gate/deny` | Deny student exit with mandatory note | Guard |

### 🩺 Health Check (`/api/health`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Returns server uptime & PostgreSQL pool status | No |

---

## ⚡ Real-Time WebSocket Events

The application utilizes Socket.IO for immediate state synchronization across browser tabs:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `request:created` | Server → Client | `ExitRequest` object | Broadcasted when a student files an exit pass |
| `request:reviewed` | Server → Client | `{ id, status, reviewNote, ... }` | Broadcasted when a proctor approves/rejects |
| `request:cancelled`| Server → Client | `{ id, status }` | Broadcasted when a student cancels a request |
| `request:updated` | Server → Client | `ExitRequest` object | Broadcasted when request parameters are edited |
| `request:deleted` | Server → Client | `{ id }` | Broadcasted when a request is deleted |
| `gate:activity` | Server → Client | `GateLog` object | Broadcasted on gate entry, exit, or denial |
| `user:updated` | Server → Client | `User` object | Broadcasted when an account is modified |
| `user:deleted` | Server → Client | `{ id }` | Broadcasted when an account is deleted |
| `belonging:updated`| Server → Client | `Belonging` object | Broadcasted when belongings are registered/edited |

---

## 🛡 Security & Reliability Highlights

1. **Network Idempotency**:
   - `idempotencyMiddleware.js` verifies idempotency keys via the `idempotency_keys` table.
   - Prevents duplicate account creation or form submissions caused by poor network connectivity, double-clicks, or automated retries.
2. **Runtime Schema Validation**:
   - Every input payload is strictly checked using **Zod** on both client and server layers.
   - Invalid payloads return structured `422 Unprocessable Entity` errors before reaching the database.
3. **Stateless JWT Security**:
   - Cryptographically signed JSON Web Tokens with configurable expiration (`JWT_EXPIRES_IN`).
4. **Auto Port Collision Recovery**:
   - If port `5000` is retained by an orphaned process, the server catches `EADDRINUSE`, automatically frees the port using system utilities, and recovers gracefully.
5. **Graceful Teardown**:
   - Closes WebSocket pools, HTTP listeners, and Knex connection pools on `SIGINT`, `SIGTERM`, and `SIGUSR2` (nodemon restart).

---

## ⚙ Environment Variables

### Backend (`server/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port on which the Express server listens |
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`) |
| `DB_HOST` | `localhost` | PostgreSQL host address |
| `DB_PORT` | `5432` | PostgreSQL database port |
| `DB_NAME` | `kotebe_exit_entry_db` | PostgreSQL database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database user password |
| `DATABASE_URL`| `postgresql://...` | Connection URI string |
| `JWT_SECRET` | *Secret String* | Secret cryptographic key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |

---

## ❓ Troubleshooting & FAQs

### 1. `EADDRINUSE: address already in use :::5000`
- The server includes an automatic port-freeing routine. If you need to manually clear port 5000:
  ```bash
  fuser -k 5000/tcp
  ```

### 2. `Could not automatically connect to PostgreSQL`
- Ensure your PostgreSQL service is running:
  ```bash
  sudo systemctl status postgresql
  ```
- Verify credentials in `server/.env`.
- Ensure the database exists:
  ```bash
  psql -U postgres -c "CREATE DATABASE kotebe_exit_entry_db;"
  ```

### 3. Migrations failing on `users` table already exists
- To reset your database completely to a clean state:
  ```bash
  cd server
  npm run db:fresh
  ```

---

## 📄 Contributing & License

Developed for **Kotebe University of Education**.

This project is licensed under the **ISC License**.
