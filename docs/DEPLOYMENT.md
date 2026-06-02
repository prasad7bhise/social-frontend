# Social App — Full Deployment Guide

## CI/CD Pipeline, Docker, GitHub Actions & Render

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Infrastructure Design](#2-infrastructure-design)
3. [Repositories](#3-repositories)
4. [Keycloak Setup](#4-keycloak-setup)
5. [Backend Setup](#5-backend-setup)
6. [Frontend Setup](#6-frontend-setup)
7. [Render Blueprint (render.yaml)](#7-render-blueprint-renderyaml)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Deployment Process](#9-deployment-process)
10. [URLs & Environment Variables](#10-urls--environment-variables)
11. [Critical Bugs & Fixes](#11-critical-bugs--fixes)
12. [Key Files Reference](#12-key-files-reference)
13. [Remaining Steps](#13-remaining-steps)

---

## 1. Project Overview

A social media application with:

- **Backend**: Spring Boot (Java 17+) with Keycloak authentication, REST API, JPA/Hibernate
- **Frontend**: Next.js 16 (React 19) with NextAuth.js, Tailwind CSS 4, Emoji picker
- **Auth**: Keycloak 26.1.0 (self-hosted, OpenID Connect)
- **Database**: MySQL (local development) / PostgreSQL (production on Render)

**Target platform**: Render (free tier) with CI/CD via GitHub Actions.

---

## 2. Infrastructure Design

### Services (all on Render free tier)

| Service | Type | Tech Stack |
|---|---|---|
| `social-backend` | Web Service (Docker) | Spring Boot, PostgreSQL |
| `social-frontend` | Web Service (Docker) | Next.js 16 standalone |
| `keycloak` | Web Service (Docker) | Keycloak 26.1.0 |
| `social-db` | PostgreSQL DB | Render-managed |
| `keycloak-db` | PostgreSQL DB | Render-managed |

### Database Strategy

Two Spring profiles:

| Profile | Database | Usage |
|---|---|---|
| `default` | MySQL | Local development |
| `postgres` | PostgreSQL | Render production |

`SPRING_PROFILES_ACTIVE=postgres` activates the PostgreSQL profile in production.
Hibernate `ddl-auto: none` — Liquibase manages schema migrations.

### Docker Images

- Backend & Frontend: Built from source by Render (via `render.yaml` Blueprint)
- Keycloak: Deployed from `ghcr.io` (pushed by CI/CD pipeline)
- All images also pushed to `ghcr.io` during CI/CD for backup/portability

---

## 3. Repositories

Two independent GitHub repositories:

| Repo | URL | Branch Strategy |
|---|---|---|
| **social-backend** | `https://github.com/prasad7bhise/social-backend` | CI on PR → master; Deploy on merge to master |
| **social-frontend** | `https://github.com/prasad7bhise/social-frontend` | CI on PR → master; Deploy on merge to master |

The `render.yaml` (Render Blueprint) lives in the backend repository and defines all services.
Environment variables referencing URLs use Render-assigned suffixes (see §10).

---

## 4. Keycloak Setup

### Dockerfile (`keycloak/Dockerfile`)

Multi-stage build for optimal image size and startup speed:

**Builder stage:**
```dockerfile
FROM quay.io/keycloak/keycloak:26.1.0 AS builder
WORKDIR /opt/keycloak
COPY keycloak/social-realm-realm.json /opt/keycloak/data/import/
RUN kc.sh build
```

**Runner stage:**
```dockerfile
FROM quay.io/keycloak/keycloak:26.1.0
COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/
COPY --from=builder /opt/keycloak/data/import/ /opt/keycloak/data/import/
COPY keycloak/start.sh /opt/keycloak/start.sh
RUN chmod +x /opt/keycloak/start.sh
ENTRYPOINT ["./start.sh"]
```

Key configurations:
- `KC_DB: postgres`
- `KC_HOSTNAME: keycloak-foj7.onrender.com`
- `KC_HTTP_ENABLED: true`
- `KC_HTTP_HOST: 0.0.0.0`
- `KC_HOSTNAME_STRICT: false` (allows Render health checks regardless of Host header)
- `start --optimized --import-realm` (fast ~30s startup)
- `JAVA_OPTS_APPEND: "-Xms128m -Xmx384m"` (memory limits for free tier)
- `autoDeploy: false` in render.yaml

### Realm Export (`keycloak/social-realm-realm.json`)

Contains two OIDC clients:

| Client | Type | Purpose |
|---|---|---|
| `social-backend-admin` | Confidential (`client-secret`) | Backend ↔ Keycloak Admin API |
| `social-frontend` | Public | Frontend NextAuth OIDC login |

**Redirect URIs** (updated for production):

```json
"redirectUris": [
  "http://localhost:3000/*",
  "https://social-frontend-b5n2.onrender.com/*"
],
"webOrigins": [
  "*"
]
```

**Important**: The realm is imported with `IGNORE_EXISTING` strategy by default. To update an existing realm, you must:
1. Delete the realm via Keycloak Admin Console
2. Redeploy Keycloak from the CD pipeline

### Keycloak Admin Credentials

| Variable | Value |
|---|---|
| Admin username | `admin` |
| Admin password | Render secret (`KEYCLOAK_ADMIN_PASSWORD`) |
| Admin client secret | Render secret (`KEYCLOAK_ADMIN_SECRET` = `z1rsgl4XOSflnpKbtCqDcdaB3PuUgTfx`) |

---

## 5. Backend Setup

### Dockerfile (`Dockerfile`)

```dockerfile
FROM maven:3.9-eclipse-tirium-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean install -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

Environment variables consumed at runtime (from Render):

| Variable | Purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | Set to `postgres` for production |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `KEYCLOAK_SERVER_URL` | Keycloak base URL |
| `KEYCLOAK_ISSUER` | Keycloak realm issuer URL |
| `KEYCLOAK_ADMIN_SECRET` | Backend client secret for Admin API |
| `CORS_ALLOWED_ORIGINS` | Frontend URL for CORS |

### Health Check

```java
@GetMapping("/api/auth/test")
public String test() {
    return "OK";
}
```

### CI/CD (`backend-deploy.yml`)

```yaml
name: Deploy
on:
  push:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - name: Build & test
        run: mvn clean install

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build & push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
      - name: Trigger Render deploy
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## 6. Frontend Setup

### Dockerfile (`Dockerfile`)

Multi-stage with Next.js standalone output:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=base /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "unset HOSTNAME && exec node server.js"]
```

**Note**: The CMD unsets `HOSTNAME` to fix a Next.js 16 binding issue on Render (see §11).

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
```

### Environment Variables

| Variable | Server/Client | Purpose |
|---|---|---|
| `NEXTAUTH_URL` | Server | NextAuth callback URL |
| `NEXTAUTH_SECRET` | Server | NextAuth encryption secret |
| `KEYCLOAK_CLIENT_ID` | Server | Keycloak OIDC client ID |
| `KEYCLOAK_ISSUER` | Server | Keycloak realm issuer URL |
| `NEXT_PUBLIC_API_BASE_URL` | Client | Backend API base URL |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER` | Client | Keycloak issuer for client-side logout |

### CI/CD (`frontend-deploy.yml`)

Same pattern as backend: test → build Docker → push to GHCR → trigger Render deploy hook.

---

## 7. Render Blueprint (`render.yaml`)

Single YAML file located in `socialbackend/render.yaml` defining all 5 services:

```yaml
services:
  - type: web
    name: social-backend
    env: docker
    repo: https://github.com/prasad7bhise/social-backend
    branch: master
    dockerfilePath: ./Dockerfile
    plan: free
    healthCheckPath: /api/auth/test
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: postgres
      - key: DB_HOST
        fromService:
          type: postgres
          name: social-db
          property: host
      # ... (DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
      - key: KEYCLOAK_SERVER_URL
        value: https://keycloak-foj7.onrender.com
      - key: KEYCLOAK_ISSUER
        value: https://keycloak-foj7.onrender.com/realms/social-realm
      - key: KEYCLOAK_ADMIN_SECRET
        sync: false  # Render secret
      - key: CORS_ALLOWED_ORIGINS
        value: https://social-frontend-b5n2.onrender.com

  - type: web
    name: social-frontend
    env: docker
    repo: https://github.com/prasad7bhise/social-frontend
    branch: master
    dockerfilePath: ./Dockerfile
    plan: free
    healthCheckPath: /
    envVars:
      - key: NEXTAUTH_URL
        value: https://social-frontend-b5n2.onrender.com
      - key: NEXTAUTH_SECRET
        sync: false
      - key: KEYCLOAK_CLIENT_ID
        value: social-frontend
      - key: KEYCLOAK_ISSUER
        value: https://keycloak-foj7.onrender.com/realms/social-realm
      - key: NEXT_PUBLIC_API_BASE_URL
        value: https://social-backend-rba1.onrender.com
      - key: NEXT_PUBLIC_KEYCLOAK_ISSUER
        value: https://keycloak-foj7.onrender.com/realms/social-realm

  - type: web
    name: keycloak
    env: docker
    repo: https://github.com/prasad7bhise/social-backend
    branch: master
    dockerfilePath: ./keycloak/Dockerfile
    plan: free
    autoDeploy: false
    envVars:
      - key: KC_DB_URL_HOST
        fromService:
          type: postgres
          name: keycloak-db
          property: host
      # ... rest of DB config
      - key: KEYCLOAK_ADMIN_PASSWORD
        sync: false

  - type: postgres
    name: social-db
    plan: free

  - type: postgres
    name: keycloak-db
    plan: free
```

### Render Secrets

Defined via Render Dashboard (not in YAML):

| Secret | Value |
|---|---|
| `KEYCLOAK_ADMIN_PASSWORD` | (set in Render dashboard) |
| `KEYCLOAK_ADMIN_SECRET` | `z1rsgl4XOSflnpKbtCqDcdaB3PuUgTfx` |
| `NEXTAUTH_SECRET` | `K1MV3teGU0agdJMOnMVHQFc/2M95bwrWTTkuAzRHLfc=` |

---

## 8. CI/CD Pipeline

### Trigger

Push to `master` branch on either repo.

### Flow

```
Push → GitHub Actions
  ├── Test (unit tests)
  ├── Build Docker image
  ├── Push to ghcr.io/${{ github.repository }}:latest
  └── curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
        └── Render pulls source, builds, deploys
```

### GitHub Secrets Required

| Secret | Used In | Purpose |
|---|---|---|
| `RENDER_DEPLOY_HOOK` | Both repos | Render Deploy Hook URL (service-specific) |
| `GITHUB_TOKEN` | Auto-available | GHCR authentication |

### Render Deploy Hooks

Each Render service has a unique Deploy Hook URL:
- Format: `https://api.render.com/deploy/srv-{service-id}?key={key}`
- Found in: Render Dashboard → Service → Settings → Deploy Hook
- Stored as `RENDER_DEPLOY_HOOK` secret in each GitHub repo's Actions secrets

---

## 9. Deployment Process

### Initial Setup

1. Create both GitHub repos
2. Set up Render account
3. Create `render.yaml` with all 5 services
4. Push to backend repo → Render Blueprint auto-deploys all services
5. Create Render secrets (KEYCLOAK_ADMIN_PASSWORD, KEYCLOAK_ADMIN_SECRET, NEXTAUTH_SECRET)

### Ongoing Deployments

1. Developer merges PR to `master`
2. GitHub Actions pipeline runs tests → builds Docker → pushes to GHCR → calls Deploy Hook
3. Render builds from source (Blueprints) or pulls from GHCR
4. Service deploys with new code

### Manual Deploy

Via Render Dashboard → Service → Manual Deploy → "Clear build cache & deploy"

---

## 10. URLs & Environment Variables

### Service URLs

| Service | URL |
|---|---|
| Frontend | `https://social-frontend-b5n2.onrender.com` |
| Backend | `https://social-backend-rba1.onrender.com` |
| Keycloak | `https://keycloak-foj7.onrender.com` |
| Keycloak Admin Console | `https://keycloak-foj7.onrender.com/admin/` |
| Keycloak Realm | `https://keycloak-foj7.onrender.com/realms/social-realm` |

**Note**: Render Blueprint auto-assigns URL suffixes (`-b5n2`, `-rba1`, `-foj7`). These suffixes are stable but unique to each deployment. All env vars must reference the exact suffixes.

### Env Var Reference Map

```
Frontend (social-frontend-b5n2)
  ├── NEXTAUTH_URL = https://social-frontend-b5n2.onrender.com
  ├── NEXTAUTH_SECRET = (Render secret)
  ├── KEYCLOAK_CLIENT_ID = social-frontend
  ├── KEYCLOAK_ISSUER = https://keycloak-foj7.onrender.com/realms/social-realm
  ├── NEXT_PUBLIC_API_BASE_URL = https://social-backend-rba1.onrender.com
  └── NEXT_PUBLIC_KEYCLOAK_ISSUER = https://keycloak-foj7.onrender.com/realms/social-realm

Backend (social-backend-rba1)
  ├── SPRING_PROFILES_ACTIVE = postgres
  ├── DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD (from social-db)
  ├── KEYCLOAK_SERVER_URL = https://keycloak-foj7.onrender.com
  ├── KEYCLOAK_ISSUER = https://keycloak-foj7.onrender.com/realms/social-realm
  ├── KEYCLOAK_ADMIN_SECRET = (Render secret)
  ├── CORS_ALLOWED_ORIGINS = https://social-frontend-b5n2.onrender.com
  └── spring.datasource/spring.jpa (PostgreSQL config)

Keycloak (keycloak-foj7)
  ├── KC_DB_URL_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD (from keycloak-db)
  ├── KC_HOSTNAME = keycloak-foj7.onrender.com
  ├── KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD (Render secret)
  └── JAVA_OPTS_APPEND = "-Xms128m -Xmx384m"
```

---

## 11. Critical Bugs & Fixes

### Bug 1: Next.js 16 HOSTNAME Binding (502 Bad Gateway)

**Symptom**: Frontend returns HTTP 502 on all pages. Server logs show "Ready" on port 10000, but Render proxy can't connect.

**Root Cause**: Next.js 16 standalone `server.js` generated at build time contains:

```javascript
const hostname = process.env.HOSTNAME || '0.0.0.0';
```

Render sets the `HOSTNAME` environment variable to the internal pod hostname (e.g., `srv-d8essaog4nts73a92v3g-hibernate-...`). The Next.js server binds to **that specific hostname** instead of `0.0.0.0`, making it unreachable from Render's proxy.

**Fix** (`Dockerfile`):

```dockerfile
# Before (broken)
CMD ["node", "server.js"]

# After (fixed)
CMD ["sh", "-c", "unset HOSTNAME && exec node server.js"]
```

Unsetting `HOSTNAME` causes `process.env.HOSTNAME` to be `undefined`, so Next.js falls back to `'0.0.0.0'` and listens on all interfaces.

**Verification**: Local Docker test with `HOSTNAME=srv-d8essaog4nts73a92v3g-hibernate-test` confirmed 502 → after fix, 200.

### Bug 2: Hardcoded localhost Logout URLs

**Symptom**: InactivityWrapper logout redirects to `http://localhost:8081/...` and `http://localhost:3000` instead of production URLs.

**Root Cause**: Logout URLs were hardcoded as strings.

**Fix** (`app/components/InactivityWrapper.tsx`):

```typescript
// Before (broken)
window.location.href =
  "http://localhost:8081/realms/social-realm/protocol/openid-connect/logout" +
  `?id_token_hint=${...}` +
  "&post_logout_redirect_uri=http://localhost:3000";

// After (fixed)
const keycloakIssuer =
  process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ||
  "http://localhost:8081/realms/social-realm";
window.location.href =
  `${keycloakIssuer}/protocol/openid-connect/logout` +
  `?id_token_hint=${...}` +
  `&post_logout_redirect_uri=${window.location.origin}`;
```

### Bug 3: Backend Docker CMD Shell Variable Expansion

**Symptom**: Backend starts with default profile instead of `postgres`.

**Root Cause**: Docker CMD in exec form (`CMD ["java", "-jar", ...]`) doesn't expand shell variables like `${SPRING_PROFILES_ACTIVE}`.

**Fix**: Removed `--spring.profiles.active=${SPRING_PROFILES_ACTIVE:-default}` from CMD. Spring Boot reads `SPRING_PROFILES_ACTIVE` env var automatically — no need to pass it as a command-line argument.

### Bug 4: Spring Boot String Bean Injection

**Symptom**: `SecurityConfig` fails to inject `@Value("${cors.allowed-origins}")` String field.

**Root Cause**: `@AllArgsConstructor` creates a constructor that requires ALL fields (including `@Value` fields which are processed by `AutowiredAnnotationBeanPostProcessor`). The `String` type can't be resolved as a bean.

**Fix**: Changed `@AllArgsConstructor` to `@RequiredArgsConstructor` — only final fields are constructor-injected. `@Value` fields are injected directly.

---

## 12. Key Files Reference

| File | Purpose | Repo |
|---|---|---|
| `render.yaml` | All 5 services, env vars, Blueprint config | `social-backend` |
| `Dockerfile` (root) | Spring Boot multi-stage build | `social-backend` |
| `keycloak/Dockerfile` | Keycloak multi-stage with `--import-realm` | `social-backend` |
| `keycloak/start.sh` | KC_DB_URL construction from individual vars | `social-backend` |
| `keycloak/social-realm-realm.json` | Realm with clients, users, roles | `social-backend` |
| `.github/workflows/deploy.yml` | Backend CI/CD | `social-backend` |
| `src/main/resources/application-postgres.yml` | PostgreSQL profile config | `social-backend` |
| `src/main/java/.../SecurityConfig.java` | CORS, security filter chain | `social-backend` |
| `src/main/java/.../AuthController.java` | Health check endpoint | `social-backend` |
| `Dockerfile` (root) | Next.js standalone build | `social-frontend` |
| `next.config.ts` | Standalone output config | `social-frontend` |
| `.github/workflows/deploy.yml` | Frontend CI/CD | `social-frontend` |
| `lib/auth/nextAuthOptions.ts` | NextAuth with Keycloak + Credentials providers | `social-frontend` |
| `app/components/InactivityWrapper.tsx` | Logout with env-var-based URLs | `social-frontend` |
| `app/layout.tsx` | Root layout with SessionProviderWrapper | `social-frontend` |
| `.env.example` | Local dev env var template | `social-frontend` |

---

## 13. Remaining Steps

### High Priority

1. **Keycloak realm re-import**:
   - Navigate to `https://keycloak-foj7.onrender.com/admin/` → Master realm → Realms → `social-realm`
   - Click "Delete" and confirm
   - Trigger Keycloak redeploy (CD pipeline or Render manual deploy)
   - Realm will re-import with updated production redirect URIs

2. **End-to-end auth test**:
   - Register a new user
   - Login with credentials
   - Login with Keycloak SSO
   - Verify session persistence and logout

### Future Improvements

- **File upload support**: Upgrade backend to Render Starter plan ($7/mo) to enable Persistent Disk for photo uploads
- **Monitoring**: Add uptime monitoring (e.g., UptimeRobot free tier)
- **Custom domain**: Point custom domain at Render services
- **Prettier deploy logs**: Add notification to Slack/Discord on deploy success/failure

---

## Appendix A: Useful Commands

### Local Development

```bash
# Backend
cd socialbackend
mvn clean install
SPRING_PROFILES_ACTIVE=postgres mvn spring-boot:run

# Frontend
cd socialffrontend
npm install
npm run dev

# Keycloak (local)
docker compose -f keycloak/docker-compose.yml up

# Test Docker image locally
docker build -t social-frontend:test .
docker run --rm -p 3000:3000 \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=test-secret \
  -e KEYCLOAK_CLIENT_ID=social-frontend \
  -e KEYCLOAK_ISSUER=http://localhost:8081/realms/social-realm \
  -e NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 \
  social-frontend:test
```

### Testing Production

```bash
# Check service health
curl -w "\nHTTP: %{http_code}\n" https://social-frontend-b5n2.onrender.com/
curl -w "\nHTTP: %{http_code}\n" https://social-backend-rba1.onrender.com/api/auth/test
curl -w "\nHTTP: %{http_code}\n" https://keycloak-foj7.onrender.com/

# Trigger Render deploy hook
curl -X POST $RENDER_DEPLOY_HOOK_URL
```

### PDF Conversion

```bash
# Install pandoc (macOS)
brew install pandoc basictex
# Convert this guide to PDF
pandoc docs/DEPLOYMENT.md -o docs/DEPLOYMENT.pdf --pdf-engine=xelatex
```
