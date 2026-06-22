# FlowBoard — Setup Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended — tested with Node 20 and 22)
- **PostgreSQL** 14+ (local install, Docker, or cloud provider)
- **npm** (comes with Node.js; pnpm or yarn can also be used)
- **Git** for version control

Verify your environment:

```bash
node --version    # >= 18
npm --version     # >= 9
psql --version    # >= 14
```

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/flowboard.git
cd flowboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in the values. At minimum, you need `DATABASE_URL` and `AUTH_SECRET`.

**Environment Variables Reference**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/flowboard`) |
| `AUTH_SECRET` | **Yes** | — | NextAuth encryption secret. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | No | `http://localhost:3000` | Application base URL (must match deployed domain in production) |
| `AUTH_GITHUB_ID` | No | — | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | No | — | GitHub OAuth App client secret |
| `AUTH_GOOGLE_ID` | No | — | Google OAuth 2.0 client ID |
| `AUTH_GOOGLE_SECRET` | No | — | Google OAuth 2.0 client secret |
| `UPLOADTHING_SECRET` | No | — | UploadThing secret key (file uploads) |
| `UPLOADTHING_APP_ID` | No | — | UploadThing app ID |
| `RESEND_API_KEY` | No | — | Resend API key (transactional email) |
| `NEXT_PUBLIC_PUSHER_KEY` | No | — | Pusher app key (real-time features) |
| `PUSHER_SECRET` | No | — | Pusher app secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | No | — | Pusher cluster region |

> **Note:** Only `DATABASE_URL` and `AUTH_SECRET` are strictly required for local development. OAuth, upload, email, and real-time features can be configured later.

### 4. Database Setup

#### Option A: Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb flowboard

# Debian/Ubuntu
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb flowboard

# Windows
# Download from https://www.postgresql.org/download/windows/
# Use pgAdmin or psql to create a database named flowboard
```

#### Option B: Docker

```bash
docker run --name flowboard-db -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password -e POSTGRES_DB=flowboard \
  -p 5432:5432 -d postgres:16-alpine
```

#### Option C: Cloud (Railway / Supabase / Neon)

Create a free PostgreSQL instance on your provider of choice and copy the connection string into `DATABASE_URL` in `.env`.

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates the tables defined in `prisma/schema.prisma` and generates the Prisma client in `src/generated/prisma/`. If the client is not regenerated automatically, run:

```bash
npx prisma generate
```

### 6. Seed the Database (Optional)

Populate the database with sample users, workspace, projects, tasks, and comments:

```bash
npx prisma db seed
```

Two users are created with password `password123`:
- **Admin:** `admin@clickupclone.com`
- **Regular user:** `user@clickupclone.com`

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Building for Production

```bash
npm run build
npm run start
```

The production server starts on port 3000 by default. Set `AUTH_URL` to your production domain before building.

---

## Troubleshooting

### `PrismaClientInitializationError: Cannot find module`

Regenerate the Prisma client:

```bash
npx prisma generate
```

### `Error: connect ECONNREFUSED ::1:5432`

PostgreSQL is not running or the connection string is wrong. Verify:

```bash
psql -d "postgresql://postgres:password@localhost:5432/flowboard" -c "SELECT 1"
```

If using Docker, make sure the container is started:

```bash
docker start flowboard-db
```

### `NextAuth: JWT_SECRET missing`

Ensure `AUTH_SECRET` is set in `.env`. Generate one if needed:

```bash
# macOS / Linux
openssl rand -base64 32
```

### `Module not found: Can't resolve '@/...'`

The `@` path alias maps to `src/`. Make sure your import path is correct relative to `src/`, and that `tsconfig.json` has the `paths` configured.

### Migration conflicts

If you've made manual schema changes or pulled upstream migration changes, reset and re-migrate:

```bash
npx prisma migrate reset
npx prisma db seed
```

> This drops all data in the database — use with caution.

### `npm run lint` fails

Ensure all dependencies are installed and you're using the correct Node version:

```bash
npm install
node --version  # must be >= 18
```

### OAuth login redirects to localhost in production

Set `AUTH_URL` to your production domain in the production environment variables. OAuth providers must also have the correct callback URL configured.

---

## Next Steps

- Read the full [README.md](./README.md) for feature documentation
- See [DEPLOY.md](./DEPLOY.md) for production deployment instructions
- Customize the app by editing environment variables and the Prisma schema
