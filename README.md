# 🎬 SlideSmith

Church multimedia automation — generate **PowerPoint** presentations and **ProPresenter 7** (`.pro`) files for song lyrics and sermons.

SlideSmith is a modern rewrite of the original Python desktop app (DC3 Multimedia Automation GUI) as a web application:

- **Backend** — Node.js REST API (Express) + **PostgreSQL**
- **Frontend** — Next.js (App Router, TypeScript, Tailwind CSS)
- **Auth** — Session cookies (httpOnly), Argon2id password hashing
- **Deployment** — Docker & Docker Compose

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

docker compose up --build
```

Create your first login user (password min 12 chars):

```bash
cd backend
npm run create-user -- you@church.org 'your-secure-password' "Your Name"
```

Then open:

- Frontend: http://localhost:4001 → **login** with the user you created
- Backend health: http://localhost:4000/api/health

> The browser talks to the API through a **same-origin Next.js proxy** at `/backend-api/*`
> (keeps the session cookie on the frontend host). That proxy targets
> `API_INTERNAL_URL` inside Docker (`http://backend:4000/api`).

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

### Database

```bash
# from repo root — start only Postgres
docker compose up -d db
```

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL
npm install
npm run create-user -- you@church.org 'your-secure-password' "Your Name"
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # NEXT_PUBLIC_API_BASE_URL=/backend-api
npm install
npm run dev            # http://localhost:3000
```

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
├── docker-compose.yml          # db + backend + frontend
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── server.js           # migrate → seed → listen
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

## ⚠️ ProPresenter 7 integration

ProPresenter 7 (`.pro`) generation is possible thanks to community
reverse-engineered Protocol Buffer definitions
([greyshirtguy/ProPresenter7-Proto](https://github.com/greyshirtguy/ProPresenter7-Proto)).

These files are **not** created, endorsed or supported by Renewed Vision (the
makers of ProPresenter). **Do not contact Renewed Vision for support.**

---

## 📜 License

All rights reserved.
