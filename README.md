# 🎬 SlideSmith

Church multimedia automation — generate **PowerPoint** presentations and **ProPresenter 7** (`.pro`) files for song lyrics and sermons.

SlideSmith is a modern rewrite of the original Python desktop app (DC3 Multimedia Automation GUI) as a web application:

- **Backend** — Node.js REST API (Express) + **PostgreSQL**
- **Frontend** — Next.js (App Router, TypeScript, Tailwind CSS)
- **Auth** — Session cookies (httpOnly), Argon2id password hashing
- **Deployment** — Docker Compose (local) · Fly.io + Supabase (production)

---

## ✨ Features

| Tool | Input | Output |
| --- | --- | --- |
| 🎵 **Lyrics → PowerPoint** | Song lyrics (title + labelled stanzas) | `.pptx`, one stanza per slide |
| 📖 **Sermon → PowerPoint** | Sermon notes (`.doc` / `.docx` / `.txt` / `.md` / `.pdf`) / references / manual passages | `.pptx` with title slide, pastor info & verses |
| 🎵 **Lyrics → ProPresenter 7** | Song lyrics (title + labelled stanzas) | `.pro` file (simple or themed template) |
| 📖 **Sermon → ProPresenter 7** | Sermon notes (`.doc` / `.docx` / `.txt` / `.md` / `.pdf`) / references / manual passages | `.pro` file with references & verses |

Supporting capabilities:

- **Login-gated UI + API** (blocks anonymous spam / abuse)
- **Bible verse extraction** from sermon notes (`.doc`, `.docx`, `.txt`, `.md`, `.pdf`)
- **Bible passage lookup** — offline (bundled **NKJV** USX data) or online (BibleGateway)
- **Pastor directory** for sermon title slides / lower-thirds
- **Slide preview** for lyrics and sermon (PowerPoint & ProPresenter layouts)

---

## 🚀 Quick start (Docker Compose)

Prerequisites: Docker + Docker Compose.

```bash
# from the repository root
cp .env.example .env
# Edit .env — set a strong POSTGRES_PASSWORD

make up-build          # or: docker compose up -d --build
make help              # list all shortcuts
```

Create your first login user (password min 12 chars):

```bash
make create-user EMAIL=you@church.org PASS='your-secure-password' NAME='Your Name'
# or locally: cd backend && npm run create-user -- you@church.org '…' "Your Name"
```

Then open:

- Frontend: http://localhost:4001 → **login** with the user you created
- Backend health: http://localhost:4000/api/health

> The browser talks to the API through a **same-origin Next.js proxy** at `/backend-api/*`
> (keeps the session cookie on the frontend host). Inside Docker the proxy targets
> `http://backend:4000/api`; for local `npm run dev` it uses `API_INTERNAL_URL` from `.env`.

All configuration lives in the **repo-root `.env`** (see `.env.example`). There are no
separate `backend/.env` or `frontend/.env` files.

---

## 🔐 Authentication

- Passwords hashed with **Argon2id**
- Opaque session tokens stored in PostgreSQL (SHA-256 hashed at rest)
- Session cookie: `slidesmith_session` (httpOnly, `SameSite=Lax` by default)
- Login endpoint is rate-limited; all generation/lookup routes require a session
- Frontend middleware redirects unauthenticated users to `/login`
- Users are created manually (no auto-seed):

```bash
cd backend

# Insert a user (hashes + writes to Postgres)
npm run create-user -- you@church.org 'your-secure-password' "Your Name"

# Or print a hash only (e.g. for a hand-written SQL insert)
npm run hash-password -- 'your-secure-password'
```

Sign out from the sidebar.

---

## 🧑‍💻 Local development

While coding you do **not** need to rebuild Docker images. Run Postgres in Docker;
run the apps locally with hot reload:

```bash
# once
cp .env.example .env          # set POSTGRES_PASSWORD
make install
make db                       # Postgres only
make create-user EMAIL=you@church.org PASS='your-secure-password' NAME='You'

# every day — two terminals
make backend                  # http://localhost:4000  (Node --watch)
make frontend                 # http://localhost:3000  (Next.js HMR)
```

Or `make dev` to start Postgres and print the same instructions.

Use `make up-build` only when you want a full production-like stack, or after
Dockerfile / dependency changes. `DATABASE_URL` is built from `POSTGRES_*` in
the root `.env`.

Requires Node.js 18+ (Node 20/22 recommended; Docker uses Node 22).

---

## 🔌 API reference

Base path: `/api` (or `/backend-api` via the frontend proxy)

| Method | Endpoint | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | no | — | Health check |
| `POST` | `/auth/login` | no | `{ email, password }` | Create session cookie |
| `POST` | `/auth/logout` | no* | — | Revoke session + clear cookie |
| `GET` | `/auth/me` | soft | — | Current user or `401` |
| `GET` | `/pastors` | yes | — | List configured pastors |
| `POST` | `/verses/extract` | yes | `multipart` field `document` (`.doc` / `.docx` / `.txt` / `.md` / `.pdf`) | Extract Bible references |
| `POST` | `/passages/lookup` | yes | `{ references[] \| text, source, version }` | Look up passages → slides |
| `POST` | `/lyrics/validate` | yes | `{ content }` | Validate lyrics format |
| `POST` | `/lyrics/preview` | yes | `{ content, format, useTheme? }` | Lyrics slide preview JSON |
| `POST` | `/sermon/preview` | yes | `{ slides[], format, … }` | Sermon slide preview JSON |
| `POST` | `/generate/lyrics-ppt` | yes | `{ content }` | Download lyrics `.pptx` |
| `POST` | `/generate/lyrics-pp7` | yes | `{ content, useTheme }` | Download lyrics `.pro` |
| `POST` | `/generate/sermon-ppt` | yes | `{ slides[], pastorId?, sermonTitle? }` | Download sermon `.pptx` |
| `POST` | `/generate/sermon-pp7` | yes | `{ slides[], pastorId?, useTheme }` | Download sermon `.pro` |

\* Logout clears the cookie even if the session is already expired.

`slides` shape:

```json
[{ "title": "John 3:16", "verses": [{ "content": "16 For God so loved..." }] }]
```

### Example (after login)

```bash
# Login and store cookie jar
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"your-password-here"}'

curl -b cookies.txt -X POST http://localhost:4000/api/passages/lookup \
  -H 'Content-Type: application/json' \
  -d '{"references":["John 3:16","Romans 8:28-30"],"source":"offline"}'
```

---

## 🗂️ Project structure

```
slidesmith/
├── docker-compose.yml          # db + backend + frontend (local)
├── .env.example                # single env template (copy to .env)
├── backend/
│   ├── fly.toml                # Fly.io API app (Supabase DATABASE_URL)
│   ├── Dockerfile
│   ├── src/
│   │   ├── loadEnv.js          # loads repo-root .env
│   │   ├── server.js           # migrate → listen
│   │   ├── app.js              # express + security middleware
│   │   ├── db/                 # pool + SQL migrations
│   │   ├── routes/             # API routes (auth-gated)
│   │   ├── controllers/
│   │   ├── services/           # auth, bible, ppt, pp7, preview
│   │   ├── middleware/         # auth, upload, validation, errors
│   │   └── schemas.js          # zod request schemas
│   ├── proto/                  # ProPresenter 7 protobuf schema
│   ├── bible/                  # bundled NKJV USX data
│   ├── assets/                 # backgrounds + .pro templates
│   └── data/pastors_info.json
└── frontend/
    ├── fly.toml                # Fly.io web app (proxies to API .internal)
    ├── Dockerfile
    ├── middleware.ts           # redirect unauthenticated users
    ├── app/(auth)/login/       # login page
    ├── app/(app)/              # authenticated app shell
    ├── components/
    └── lib/                    # API client + types
```

---

## 🔒 Security

The backend applies defense-in-depth:

- **Authentication required** for all generative / lookup endpoints
- Argon2id password hashing; session tokens hashed (SHA-256) in Postgres
- Helmet security headers, CORS allowlist, cookie `httpOnly`
- Global + login-specific rate limiting
- `zod` request validation, upload size limits, content sniffing for uploads (`.doc` / `.docx` / `.pdf` / text)
- Generic client-facing errors (detail logged server-side only)

Change default passwords before any shared or production deployment. Prefer HTTPS and `COOKIE_SECURE=true` when terminating TLS.

---

## ☁️ Production deploy (Fly.io + Supabase)

Local Docker Compose still uses the `db` service. **Production uses Supabase Postgres** — do not deploy the Compose Postgres container to Fly.

Architecture:

```
Browser (HTTPS)
  → slidesmith-web  (Next.js on Fly)
       rewrite /backend-api/*  (same-origin cookie)
  → http://slidesmith-api.internal:8080/api/*  (Fly private network)
  → Supabase Postgres (DATABASE_URL)
```

### 0. Install once

| Tool | macOS | Why |
| --- | --- | --- |
| [Fly CLI](https://fly.io/docs/flyctl/install/) (`fly`) | `brew install flyctl` | Deploy & secrets |
| Fly account | [fly.io/app/sign-up](https://fly.io/app/sign-up) then `fly auth login` | Org + apps |
| [Supabase](https://supabase.com) project | Dashboard → New project | Managed Postgres |
| Docker Desktop | Already required for local Compose | Fly uses Docker to build images |

Optional: `gh` is not required for Fly deploys.

### 1. Create Supabase Postgres

1. Create a project in the Supabase dashboard (pick a region close to Fly, e.g. Singapore → Fly `sin`).
2. Open **Connect** and copy the **Session pooler** URI (port `5432`, host like `aws-0-….pooler.supabase.com`).
   - Prefer **Session mode** on Fly (persistent Node process, IPv4-friendly).
   - Avoid Transaction mode (port `6543`) unless you disable prepared statements — migrations and `pg` pools are happier on session/direct.
3. Replace `[YOUR-PASSWORD]` with the database password.
4. In the SQL editor, confirm `pgcrypto` is available (usually is):

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

The API runs its own migrations on startup (`users`, `sessions`) — you do **not** need Supabase Auth for this app.

### 2. Create Fly apps

From the repo root (app names must match `fly.toml` / private DNS, or edit both files):

```bash
fly auth login

# API
cd backend
fly apps create slidesmith-api   # skip if `fly launch` already created it
# or: fly launch --no-deploy --name slidesmith-api --region sin

# Web
cd ../frontend
fly apps create slidesmith-web
# or: fly launch --no-deploy --name slidesmith-web --region sin
```

Use the same org for both apps so `.internal` networking works.

### 3. Set backend secrets

```bash
cd backend

# Replace with your real Supabase session-pooler URI and Fly web hostname.
fly secrets set \
  DATABASE_URL='postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres' \
  COOKIE_SECURE=true \
  COOKIE_SAMESITE=lax \
  CORS_ALLOWED_ORIGINS='https://slidesmith-web.fly.dev'
```

URL-encode special characters in the DB password. SSL is enabled automatically for Supabase hosts.

### 4. Deploy API, then web

```bash
cd backend
fly deploy

# Confirm health (public URL is fine for /api/health)
fly status
fly logs
curl -sS https://slidesmith-api.fly.dev/api/health
```

Then deploy the frontend. `API_INTERNAL_URL` is baked at **build** time from `frontend/fly.toml` (`http://slidesmith-api.internal:8080/api`). If you renamed the API app or changed its port, update that build arg before deploying.

```bash
cd ../frontend
fly deploy

curl -sS -o /dev/null -w '%{http_code}\n' https://slidesmith-web.fly.dev/login
```

Open `https://slidesmith-web.fly.dev` in a browser.

### 5. Create the first login user

Point local tooling at Supabase (does not need the Fly machines):

```bash
# In repo-root .env (local only — never commit):
# DATABASE_URL=postgresql://postgres.PROJECT_REF:…@aws-0-….pooler.supabase.com:5432/postgres

cd backend
npm run create-user -- you@church.org 'your-secure-password' "Your Name"
```

Or from a one-off Fly machine shell:

```bash
cd backend
fly ssh console -C "node scripts/create-user.js you@church.org 'your-secure-password' 'Your Name'"
```

Hash only (if you want to paste into SQL yourself):

```bash
cd backend
npm run hash-password -- 'your-secure-password'
```

Then insert:

```sql
INSERT INTO users (email, password_hash, display_name)
VALUES ('you@church.org', '<hash from above>', 'Your Name');
```

### 6. Useful Fly commands

```bash
fly apps list
fly status -a slidesmith-api
fly status -a slidesmith-web
fly logs -a slidesmith-api
fly secrets list -a slidesmith-api
fly ssh console -a slidesmith-api
```

### Notes

- Compose `db` service stays for **local** development only.
- Backend keeps `min_machines_running = 1` so Fly `.internal` calls work without Flycast auto-start quirks.
- PPT/PP7 generation is in-memory — API VM is sized at **1GB**; raise memory in `backend/fly.toml` if you hit OOM on large sermons.

---

## ⚠️ ProPresenter 7 integration

ProPresenter 7 (`.pro`) generation is possible thanks to community
reverse-engineered Protocol Buffer definitions
([greyshirtguy/ProPresenter7-Proto](https://github.com/greyshirtguy/ProPresenter7-Proto)).

These files are **not** created, endorsed or supported by Renewed Vision (the
makers of ProPresenter). **Do not contact Renewed Vision for support.**

---

## 📜 License

All rights reserved.
