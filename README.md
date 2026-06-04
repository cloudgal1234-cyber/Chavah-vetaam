# Presenter AI

An end-to-end application skeleton for an AI-powered video ad, UGC content, product photo, and virtual presenter platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Hook Form |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + **GitHub OAuth 2.0** (via `jsonwebtoken`, `bcryptjs`, `axios`) |
| File Upload | Multer (local storage; swap for S3 in production) |
| AI Services | Mocked — swap in real API calls (OpenAI, HeyGen, ElevenLabs, Stability AI) |

---

## Project Structure

```
presenter-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema (User, Campaign, Generation, CreditLog)
│   │   └── seed.js             # Demo seed data
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── config/
│   │   │   └── database.js     # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authentication middleware
│   │   │   └── errorHandler.js # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /register, POST /login
│   │   │   ├── user.js         # GET /me, PATCH /me, credits
│   │   │   ├── campaigns.js    # CRUD for campaigns
│   │   │   └── generation.js   # POST to trigger, GET to poll/list
│   │   └── services/
│   │       └── aiService.js    # Mock AI generation (swap with real APIs)
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── layout.tsx            # Root layout + Toaster
│   │   │   ├── globals.css           # Tailwind base + component classes
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx    # Login form
│   │   │   │   └── register/page.tsx # Registration form
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx        # Protected layout with sidebar
│   │   │   │   └── page.tsx          # Stats + recent generations
│   │   │   ├── campaigns/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Campaign list
│   │   │   │   ├── new/page.tsx      # Campaign creation form
│   │   │   │   └── [id]/page.tsx     # Campaign detail + generate buttons
│   │   │   └── gallery/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx          # Filterable media gallery
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Sidebar.tsx       # Navigation + credit balance
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance with JWT interceptor
│   │   │   └── utils.ts              # Helpers, label maps, cost constants
│   │   └── store/
│   │       └── index.ts              # Zustand auth store (persisted)
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Quickstart

### Prerequisites
- Node.js ≥ 20
- PostgreSQL ≥ 15 (or use Docker Compose)

### 1. Clone & configure

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edit `backend/.env` with your database credentials and a strong `JWT_SECRET`.

#### Setting up GitHub OAuth

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** Presenter AI (dev)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:4000/api/auth/github/callback`
3. Copy the **Client ID** and generate a **Client Secret**
4. Set in `backend/.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
   ```

### 2. Start with Docker Compose (recommended)

```bash
docker compose up -d
```

This starts PostgreSQL, the backend on `:4000`, and the frontend on `:3000`.

Then run migrations and seed:

```bash
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run db:seed
```

### 3. Start manually (without Docker)

**Backend**

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev          # http://localhost:4000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

---

## API Reference

All protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email/password; returns JWT + user |
| POST | `/api/auth/login` | Login with email/password; returns JWT + user |
| GET | `/api/auth/github` | Redirect to GitHub OAuth consent page |
| GET | `/api/auth/github/callback` | GitHub redirects here; creates/links user, redirects to frontend `/auth/callback?token=…` |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Current user profile |
| PATCH | `/api/users/me` | Update name / avatar |
| GET | `/api/users/me/credits` | Credit balance + history |

### Campaigns

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/campaigns` | List user's campaigns |
| POST | `/api/campaigns` | Create (supports multipart for image upload) |
| GET | `/api/campaigns/:id` | Campaign + all generations |
| PATCH | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### Generations

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generations` | Trigger generation (deducts credits) |
| GET | `/api/generations/:id` | Poll status |
| GET | `/api/generations` | Gallery — paginated, filterable |

**Generation request body:**
```json
{
  "campaignId": "uuid",
  "mediaType": "VIDEO | IMAGE | AUDIO | UGC",
  "prompt": "optional override",
  "options": {}
}
```

**Credit costs (default):**
| Type | Credits |
|---|---|
| VIDEO | 20 |
| UGC | 15 |
| AUDIO | 8 |
| IMAGE | 5 |

---

## Credit System

- New users receive **100 free credits** on registration (configurable via `DEFAULT_CREDITS` env var).
- Credits are deducted atomically before generation starts.
- Credits are **refunded** automatically if a generation fails.
- All credit changes are logged in the `credit_logs` table for audit.

---

## Connecting Real AI APIs

Replace the mock functions in `backend/src/services/aiService.js`:

| Media Type | Suggested Provider |
|---|---|
| VIDEO | HeyGen, RunwayML |
| UGC | HeyGen (avatar API), D-ID |
| IMAGE | Stability AI, DALL-E 3 |
| AUDIO | ElevenLabs, OpenAI TTS |

Each function must return `{ resultUrl, thumbnailUrl, metadata }`.

---

## Demo Credentials (after seeding)

| Email | Password | Role |
|---|---|---|
| demo@presenterai.com | password123 | USER |
| admin@presenterai.com | password123 | ADMIN |

---

## License

MIT
