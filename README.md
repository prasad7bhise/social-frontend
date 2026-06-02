# Social Frontend

Next.js 16 social media frontend with NextAuth.js and Keycloak authentication.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** with Server Components
- **NextAuth.js v4** (Keycloak + Credentials providers)
- **Tailwind CSS 4**
- **TypeScript**

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=supersecret
KEYCLOAK_CLIENT_ID=social-frontend
KEYCLOAK_ISSUER=http://localhost:8081/realms/social-realm
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8081/realms/social-realm
```

### Run Tests

```bash
npm run test       # vitest (unit tests)
npm run test:watch # watch mode
npm run lint       # ESLint
```

## Deployment

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for the full deployment guide covering Docker, CI/CD, and Render configuration.

## Project Structure

```
app/
├── api/auth/[...nextauth]/   # NextAuth route handler
├── components/               # Shared React components
├── feed/                     # Feed page
├── login/                    # Login page
├── messages/                 # Messages page
├── notifications/            # Notifications page
├── profile/                  # Profile page
├── explore/                  # Explore page
├── signup/                   # Registration page
├── user/[id]/               # User profile page
├── layout.tsx                # Root layout
└── page.tsx                  # Landing page

lib/
├── auth/nextAuthOptions.ts  # NextAuth config (Keycloak + Credentials)
├── types/                   # TypeScript types & enums
└── api.ts                   # API client

test/
└── setup.ts                 # Vitest setup
```

## Key Features

- **Keycloak SSO** login via OpenID Connect
- **Credentials login** with direct password grant
- **Session management** with 30-day max age, inactivity timeout
- **Emoji picker** for messages
- **Real-time polling** for messages & notifications (2s interval)
- **Responsive design** with dark theme

## CI/CD

- **GitHub Actions** — test → build Docker → push to GHCR → deploy to Render
- **Docker** multi-stage with `output: "standalone"` (see `Dockerfile`)
- See [deploy.yml](.github/workflows/deploy.yml) for workflow configuration
