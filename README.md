# TaskFlow

A production-ready task management application built with **Next.js 14**, **MongoDB**, and deployed on **Vercel**.

**Live URL:** `https://taskflow-<your-name>.vercel.app`  
**Repository:** `https://github.com/<your-username>/taskflow`

---

## Architecture Overview

```
taskflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts   # POST — user registration
│   │   │   │   ├── login/route.ts      # POST — user login
│   │   │   │   ├── logout/route.ts     # POST — clears cookies
│   │   │   │   └── me/route.ts         # GET — fetch current user
│   │   │   └── tasks/
│   │   │       ├── route.ts            # GET (list) / POST (create)
│   │   │       └── [id]/route.ts       # GET / PATCH / DELETE
│   │   ├── dashboard/page.tsx          # Protected main UI
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── components/
│   │   ├── tasks/                      # TaskCard, CreateTaskModal
│   │   ├── layout/                     # Navbar
│   │   └── ui/                         # ThemeToggle, StatusBadge
│   ├── hooks/
│   │   ├── useAuth.ts                  # Current user state
│   │   └── useTasks.ts                 # Task CRUD + filters
│   ├── lib/
│   │   ├── db.ts                       # MongoDB connection (cached)
│   │   ├── jwt.ts                      # Access + refresh token helpers
│   │   ├── crypto.ts                   # AES-256 encrypt/decrypt
│   │   ├── cookies.ts                  # Secure HttpOnly cookie helpers
│   │   ├── response.ts                 # Typed API response wrappers
│   │   └── validators.ts               # Zod schemas for all inputs
│   ├── middleware/
│   │   └── auth.ts                     # withAuth() HOC for API routes
│   ├── middleware.ts                   # Edge middleware (route protection)
│   └── models/
│       ├── User.ts                     # Mongoose User schema
│       └── Task.ts                     # Mongoose Task schema
```

### Key Design Decisions

**Why Next.js App Router (full-stack)?**  
Running frontend and backend in a single Next.js project eliminates the need for a separate Express server, simplifies deployment to Vercel, and allows shared TypeScript types between client and server.

**Why two tokens (access + refresh)?**  
Short-lived access tokens (15 min) limit the damage window if intercepted. Long-lived refresh tokens (7 days) stored in an HttpOnly cookie allow seamless session extension without forcing re-login. The `withAuth()` middleware silently rotates the access token on every request when needed.

**Why AES-encrypt task descriptions?**  
Even with MongoDB Atlas access controls, encrypting the `description` field means raw database access cannot read task content. The AES key lives only in the server environment, never exposed to the client.

---

## Security Implementation

| Concern | Implementation |
|---|---|
| Password storage | bcryptjs with salt rounds 12 |
| Auth tokens | JWT — 15m access token + 7d refresh token |
| Cookie flags | `HttpOnly`, `Secure` (prod), `SameSite=Lax` |
| Payload encryption | AES-256 on task `description` via CryptoJS |
| Input validation | Zod schemas on every API route |
| Authorization | Owner check on every task operation |
| SQL/NoSQL injection | Mongoose ODM with parameterized queries |
| User enumeration | Generic "invalid credentials" message |
| Token refresh | Silent rotation via `withAuth()` middleware |
| Route protection | Edge middleware blocks unauthenticated access |

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://cloud.mongodb.com) free-tier cluster
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/taskflow.git
cd taskflow

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

Fill in `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/taskflow
JWT_SECRET=<run: openssl rand -base64 64>
JWT_REFRESH_SECRET=<run: openssl rand -base64 64>
AES_SECRET_KEY=<exactly 32 characters>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

```bash
# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add the same environment variables from `.env.local` in your Vercel project settings under **Settings → Environment Variables**.

---

## API Documentation

All endpoints return JSON in this shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "errors": { ... } }
```

### Auth

#### `POST /api/auth/register`
**Body:**
```json
{ "name": "Ravi Kumar", "email": "ravi@example.com", "password": "Pass1234" }
```
**Response 201:**
```json
{
  "success": true,
  "data": { "user": { "id": "...", "name": "Ravi Kumar", "email": "ravi@example.com" } }
}
```
Sets `tf_access` and `tf_refresh` HttpOnly cookies.

---

#### `POST /api/auth/login`
**Body:**
```json
{ "email": "ravi@example.com", "password": "Pass1234" }
```
**Response 200:** Same as register.  
**Response 401:** `{ "success": false, "message": "Invalid email or password" }`

---

#### `POST /api/auth/logout`
No body. Clears both auth cookies.  
**Response 200:** `{ "success": true, "data": { "message": "Logged out successfully" } }`

---

#### `GET /api/auth/me`
Requires auth cookie.  
**Response 200:** `{ "success": true, "data": { "user": { "id": "...", "name": "...", "email": "..." } } }`

---

### Tasks

All task endpoints require authentication (cookie-based).

#### `GET /api/tasks`
**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 50) |
| `status` | string | `all` | `todo` \| `in-progress` \| `done` \| `all` |
| `search` | string | — | Case-insensitive title/description search |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "664a1f...",
        "title": "Design the landing page",
        "description": "Use Figma to create wireframes first",
        "status": "in-progress",
        "owner": "663e...",
        "createdAt": "2024-05-20T10:30:00.000Z",
        "updatedAt": "2024-05-20T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1, "limit": 10, "total": 23,
      "totalPages": 3, "hasNextPage": true, "hasPrevPage": false
    }
  }
}
```

---

#### `POST /api/tasks`
**Body:**
```json
{ "title": "Write unit tests", "description": "Cover auth routes", "status": "todo" }
```
**Response 201:** `{ "success": true, "data": { "task": { ... } } }`

---

#### `PATCH /api/tasks/:id`
**Body** (all fields optional):
```json
{ "title": "Updated title", "status": "done" }
```
**Response 200:** Updated task object.  
**Response 403:** Returned if the task belongs to another user.

---

#### `DELETE /api/tasks/:id`
**Response 200:** `{ "success": true, "data": { "message": "Task deleted successfully" } }`  
**Response 404:** Task not found.

---

## Database Schema

### Users Collection
```
_id:        ObjectId
name:       String (required, max 50)
email:      String (required, unique, indexed)
password:   String (bcrypt hash, select: false)
createdAt:  Date
updatedAt:  Date
```

### Tasks Collection
```
_id:         ObjectId
title:       String (required, max 120)
description: String (AES-256 encrypted, max 1000)
status:      Enum ['todo', 'in-progress', 'done']
owner:       ObjectId → ref: User (indexed)
createdAt:   Date
updatedAt:   Date
```
Indexes: `{ owner: 1, status: 1 }` (compound), `{ title: 'text', description: 'text' }` (text search)

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** Zod
- **Encryption:** CryptoJS (AES-256)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
