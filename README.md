# 🎬 SlideSmith

Church multimedia automation — generate **PowerPoint** presentations and **ProPresenter 7** (`.pro`) files for song lyrics and sermons.

SlideSmith is a modern rewrite of the original Python desktop app (DC3 Multimedia Automation GUI) as a web application:

- **Backend** — Node.js REST API (Express)
- **Frontend** — Next.js (App Router, TypeScript, Tailwind CSS)
- **Deployment** — Docker & Docker Compose

---

## ✨ Features

| Tool | Input | Output |
| --- | --- | --- |
| 🎵 **Lyrics → PowerPoint** | Song lyrics (title + labelled stanzas) | `.pptx`, one stanza per slide |
| 📖 **Sermon → PowerPoint** | Sermon notes `.docx` / references / manual passages | `.pptx` with title slide, pastor info & verses |
| 🎵 **Lyrics → ProPresenter 7** | Song lyrics (title + slide blocks) | `.pro` file (simple or themed template) |
| 📖 **Sermon → ProPresenter 7** | Sermon notes `.docx` / references / manual passages | `.pro` file with references & verses |

Supporting capabilities:

- **Bible verse extraction** from Word documents (`.docx`)
- **Bible passage lookup** — offline (bundled **NKJV** USX data) or online (BibleGateway)
- **Pastor directory** for sermon title slides / lower-thirds

---

## 🚀 Quick start (Docker Compose)

Prerequisites: Docker + Docker Compose.

```bash
# from the repository root
cp .env.example .env        # optional — sensible defaults are baked in
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/health

> The browser talks to the backend directly at `NEXT_PUBLIC_API_BASE_URL`
> (default `http://localhost:4000/api`). If you change the backend port, update
> that value **and** rebuild the frontend (it is baked in at build time).

---

## 🧑‍💻 Local development

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # ensure NEXT_PUBLIC_API_BASE_URL points at the backend
npm install
npm run dev            # http://localhost:3000
```

Requires Node.js 18+ (Node 20/22 recommended; the online BibleGateway lookup needs 18+).

---

## 🔌 API reference

Base path: `/api`

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Health check |
| `GET` | `/pastors` | — | List configured pastors |
| `POST` | `/verses/extract` | `multipart/form-data` field `document` (`.docx`) | Extract Bible references |
| `POST` | `/passages/lookup` | `{ references[] \| text, source, version }` | Look up passages → slides |
| `POST` | `/lyrics/validate` | `{ content }` | Validate lyrics format |
| `POST` | `/generate/lyrics-ppt` | `{ content }` | Download lyrics `.pptx` |
| `POST` | `/generate/lyrics-pp7` | `{ content, useTheme }` | Download lyrics `.pro` |
| `POST` | `/generate/sermon-ppt` | `{ slides[], pastorId?, sermonTitle? }` | Download sermon `.pptx` |
| `POST` | `/generate/sermon-pp7` | `{ slides[], pastorId?, useTheme }` | Download sermon `.pro` |

`slides` shape:

```json
[{ "title": "John 3:16", "verses": [{ "content": "16 For God so loved..." }] }]
```

### Example

```bash
curl -X POST http://localhost:4000/api/passages/lookup \
  -H 'Content-Type: application/json' \
  -d '{"references":["John 3:16","Romans 8:28-30"],"source":"offline"}'
```

---

## 🗂️ Project structure

```
slidesmith/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── server.js            # bootstrap
│   │   ├── app.js               # express app + security middleware
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # request handlers
│   │   ├── services/            # verse extraction, bible lookup, ppt & pp7 generators
│   │   ├── middleware/          # upload, validation, error handling
│   │   ├── schemas.js           # zod request schemas
│   │   └── data/bibleBooks.js   # book maps
│   ├── proto/                   # ProPresenter 7 protobuf schema
│   ├── bible/                   # bundled NKJV USX data
│   ├── assets/                  # backgrounds + .pro templates
│   └── data/pastors_info.json
└── frontend/
    ├── Dockerfile
    ├── app/                     # Next.js App Router pages
    ├── components/              # UI + sermon workflow
    └── lib/                     # API client + types
```

---

## 🔒 Security

The backend applies defense-in-depth: Helmet security headers, a strict CORS
allowlist, rate limiting, `zod` request validation, upload size limits and
magic-number validation of uploaded `.docx` files, and generic client-facing
error messages (full detail is logged server-side only).

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
