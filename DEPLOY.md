# FlowBoard — Deployment Guide

This guide covers deploying FlowBoard to production. The architecture consists of:

- **Frontend:** Next.js 16 (static + server-side rendering) deployed on **Vercel**
- **Database:** PostgreSQL hosted on **Railway**, **Supabase**, or **Neon**
- **File Uploads:** UploadThing
- **Email:** Resend
- **Real-time (optional):** Pusher or Socket.io with a hosted adapter

---

## Table of Contents

1. [Database (Railway / Supabase)](#1-database-railway--supabase)
2. [Frontend (Vercel)](#2-frontend-vercel)
3. [Environment Variables in Production](#3-environment-variables-in-production)
4. [Database Migration in Production](#4-database-migration-in-production)
5. [Custom Domain Setup](#5-custom-domain-setup)
6. [Performance Optimization Tips](#6-performance-optimization-tips)
7. [Monitoring and Logging](#7-monitoring-and-logging)

---

## 1. Database (Railway / Supabase)

### Railway

1. Create an account at [railway.app](https://railway.app) and install the CLI: `npm i -g @railway/cli`
2. Start a new project and provision a **PostgreSQL** plugin
3. Copy the `DATABASE_URL` connection string from the Railway dashboard

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database > Connection string** (URI mode)
3. Copy the connection string — make sure to append `?sslmode=require` if not present

### Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the pooled or direct connection string from the dashboard

### Important

- Enable **SSL mode** (most providers require it in production)
- For Vercel serverless functions, use a **connection pooler** if your provider offers one (Supabase's connection pooler, Railway's proxy, or Neon's pooled connection). This prevents connection exhaustion from cold starts.

Example connection string with SSL:

```
DATABASE_URL="postgresql://user:password@host:5432/flowboard?sslmode=require"
```

---

## 2. Frontend (Vercel)

### Prerequisites

- Push your repository to GitHub, GitLab, or Bitbucket
- Sign up for [Vercel](https://vercel.com) (free tier is sufficient)

### Steps

1. **Import project** — In Vercel dashboard, click **Add New > Project** and select your repository
2. **Configure framework preset** — Vercel auto-detects Next.js. Ensure:
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Node.js Version:** 20.x (set in project settings)
3. **Set environment variables** — Add all variables from `.env.example` (see section 3 below)
4. **Deploy** — Click **Deploy**

Vercel will build the project and deploy it to a `*.vercel.app` domain.

### Redeploy on Push

Vercel automatically deploys on every push to the default branch. You can also trigger manual deployments from the dashboard or CLI:

```bash
npx vercel --prod
```

### Disable Automatic Deployments

Go to **Project Settings > Git** and uncheck auto-deploy if you prefer manual control.

---

## 3. Environment Variables in Production

Add these in your Vercel project settings (or your hosting platform):

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Use pooled URL for serverless |
| `AUTH_SECRET` | `base64-encoded-32-byte-secret` | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | `https://yourdomain.com` | Must match your deployed domain |
| `AUTH_GITHUB_ID` | `Iv1...` | From GitHub OAuth App settings |
| `AUTH_GITHUB_SECRET` | `...` | From GitHub OAuth App settings |
| `AUTH_GOOGLE_ID` | `123...apps.googleusercontent.com` | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | `GOCSPX-...` | From Google Cloud Console |
| `UPLOADTHING_SECRET` | `sk_live_...` | From UploadThing dashboard |
| `UPLOADTHING_APP_ID` | `abc123` | From UploadThing dashboard |
| `RESEND_API_KEY` | `re_...` | From Resend dashboard |
| `NEXT_PUBLIC_PUSHER_KEY` | `...` | From Pusher dashboard |
| `PUSHER_SECRET` | `...` | From Pusher dashboard |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap1` | From Pusher dashboard |

### Vercel Environment Variable Tiers

- **Production** — Used by `vercel --prod` and production branch
- **Preview** — Used by preview deployments (optional — copy from production)
- **Development** — Used locally (not needed in Vercel dashboard)

---

## 4. Database Migration in Production

After deploying to Vercel, you must run database migrations against your production database.

### Option A: Local Machine

```bash
# Set your production DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Apply pending migrations
npx prisma migrate deploy
```

### Option B: Railway CLI

```bash
railway run npx prisma migrate deploy
```

### Option C: Vercel Post-Deploy Script

Add a migration script in `package.json`:

```json
"scripts": {
  "postinstall": "npx prisma generate",
  "migrate:prod": "npx prisma migrate deploy"
}
```

Then run it via Vercel CLI or a CI pipeline:

```bash
npx vercel env pull --environment=production
npm run migrate:prod
```

### Option D: GitHub Actions CI

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Seeding Production (One-time Only)

```bash
# Only run once on a fresh database
$env:DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
npx prisma db seed
```

> Remove or guard the seed script to prevent accidental re-seeding of production.

---

## 5. Custom Domain Setup

### Vercel

1. Go to **Project Settings > Domains**
2. Enter your domain (e.g., `flowboard.example.com`)
3. Follow Vercel's DNS instructions (add CNAME record pointing to `cname.vercel-dns.com`)
4. Wait for DNS propagation (up to 48 hours, usually minutes)
5. Set `AUTH_URL` to your custom domain

### SSL / HTTPS

Vercel automatically provisions SSL certificates via Let's Encrypt. No manual setup required.

---

## 6. Performance Optimization Tips

### Database

- Add indexes on frequently queried columns (the schema already includes `@@index` on foreign keys, status, email, etc.)
- Use connection pooling (Supabase PgBouncer, Railway proxy, or Neon pooled URL)
- Set `pgbouncer` mode in Prisma if using a connection pooler

### Frontend

- Enable ISR (Incremental Static Regeneration) for public pages (landing page etc.)
- Use React Server Components by default; move interactivity to Client Components only where needed
- Lazy-load heavy components (modals, calendars, charts) with `next/dynamic`
- Optimize images with the Next.js `<Image>` component
- Enable Vercel Edge Functions or Middleware for lightweight auth checks
- Set `swr: 60` in `next.config.ts` for CDN caching

### Prisma

- Use `select` / `include` sparingly — only fetch fields you need
- Batch queries with Prisma's `findMany` instead of `findUnique` in loops
- Consider using `@prisma/adapter-pg` with prepared statements (already configured)
- Enable query logging in production selectively with `prisma.$on('query', ...)`

### Bundle Size

- Tree-shake with `lucide-react` icons (import individually, not from barrel)
- Monitor bundle with `@next/bundle-analyzer`
- Keep Radix imports scoped to individual primitives

---

## 7. Monitoring and Logging

### Vercel Analytics

1. Enable **Web Analytics** in Vercel dashboard (Project Settings > Analytics)
2. Enable **Speed Insights** for Core Web Vitals tracking

### Error Tracking

Consider integrating:
- **Sentry** — `npm install @sentry/nextjs`
- **Better Stack** — Structured logging with `pino` or `winston`

### Database Monitoring

- **Railway** — Built-in metrics dashboard (CPU, memory, connections)
- **Supabase** — Query performance, connection pool, and database health
- **Neon** — Compute endpoint metrics and branching insights
- **Prisma Studio** — For ad-hoc inspection (never run against production without caution)

### Uptime Monitoring

- **Better Stack** (formerly Better Uptime) — Free SSL and uptime monitoring
- **Pingdom** — Global uptime checks
- **Checkly** — Browser-based E2E monitoring

### Health Check Endpoint

Add a simple health check at `/api/health`:

```ts
// src/app/api/health/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
```

---

## Quick Deploy Checklist

- [ ] PostgreSQL instance running (Railway / Supabase / Neon)
- [ ] `DATABASE_URL` set with SSL enabled
- [ ] `npx prisma migrate deploy` run against production database
- [ ] `AUTH_SECRET` generated and set
- [ ] `AUTH_URL` set to production domain
- [ ] OAuth callback URLs configured (if using GitHub/Google login)
- [ ] UploadThing / Resend / Pusher credentials configured (if using those features)
- [ ] Custom domain DNS pointed to Vercel
- [ ] Production build passes (`npm run build`)
- [ ] Environment variables set in Vercel dashboard
- [ ] Landing page and auth flows verified on production
