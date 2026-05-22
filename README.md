# DevPulse – Internal Tech Issue & Feature Tracker

> A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Live URL
[https://devpulse-api.vercel.app](https://devpulse-weld.vercel.app/)

## GitHub Repository
[https://github.com/robinahmed12/dev-pulse](https://github.com/robinahmed12/dev-pulse)


---

## ✨ Features

- JWT-based authentication with role-based access control
- Create, read, update, and delete bug reports & feature requests
- Filter and sort issues by type, status, and date
- Modular Express + TypeScript architecture
- PostgreSQL with raw SQL (no ORM)

---

## 🛠️ Tech Stack

| Technology | Version |
|---|---|
| Node.js | LTS 24.x+ |
| TypeScript | 5.x |
| Express.js | 4.x |
| PostgreSQL | Native `pg` driver |
| bcrypt | Password hashing |
| jsonwebtoken | JWT auth |

---

## 🚀 Local Setup

### 1. Clone & install
```bash
## Clone the Repository
```bash
git clone https://github.com/robinahmed12/dev-pulse.git

cd devpulse
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET
```

### 3. Initialize database
```bash
npm run dev
```

### 4. Start development server
```bash
npm run dev
```

---

## 🌐 API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get JWT |
| POST | `/api/issues` | Authenticated | Create new issue |
| GET | `/api/issues` | Public | Get all issues (filterable) |
| GET | `/api/issues/:id` | Public | Get single issue |
| PATCH | `/api/issues/:id` | Authenticated | Update issue |
| DELETE | `/api/issues/:id` | Maintainer | Delete issue |

### Query Parameters for `GET /api/issues`
| Param | Values | Default |
|---|---|---|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | — |
| `status` | `open`, `in_progress`, `resolved` | — |

### Authorization Header
```
Authorization: <JWT_TOKEN>
```

---

## 🗄️ Database Schema

### `users`
```sql
id         SERIAL PRIMARY KEY
name       VARCHAR(255) NOT NULL
email      VARCHAR(255) NOT NULL UNIQUE
password   TEXT NOT NULL
role       VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor','maintainer'))
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### `issues`
```sql
id          SERIAL PRIMARY KEY
title       VARCHAR(150) NOT NULL
description TEXT NOT NULL
type        VARCHAR(30) CHECK (type IN ('bug','feature_request'))
status      VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved'))
reporter_id INTEGER NOT NULL
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```

---

## 👥 Roles & Permissions

| Role | Permissions |
|---|---|
| `contributor` | Register, login, create issues, view all issues, update own open issues |
| `maintainer` | All contributor permissions + update any issue, change status, delete issues |
