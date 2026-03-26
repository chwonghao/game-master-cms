# Production Setup Instructions

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (for containerization)

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update with your values:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/game_master_cms
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
GAME_CLIENT_API_KEY=your-game-api-key-here
NODE_ENV=development
```

Generate secrets:

```bash
# For NEXTAUTH_SECRET (run in Node)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For GAME_CLIENT_API_KEY
openssl rand -base64 32
```

### 3. Database Setup

Initialize the database schema:

```bash
npx prisma migrate dev
```

This will:
- Create the database schema
- Generate Prisma Client
- Run migrations

### 4. Seed Demo Users

Demo accounts are available with password `password123`:
- admin@gamemaster.dev (ADMIN role)
- editor@gamemaster.dev (EDITOR role)  
- analyst@gamemaster.dev (ANALYST role)

**Important**: In production, use the seed script to hash passwords:

```bash
npx prisma db seed
```

This requires a `prisma/seed.ts` file (see DEPLOYMENT.md for example).

### 5. Start Development Server

```bash
npm run dev
```

Access the application at `http://localhost:3000`

## Authentication

### NextAuth.js Setup

The application uses NextAuth.js with:
- **Provider**: Credentials (email/password)
- **Storage**: PostgreSQL via Prisma Adapter
- **Session**: JWT-based with 7-day expiry
- **Password Hashing**: bcryptjs (10 salt rounds)

### User Roles

- **ADMIN**: Full access to all features
- **EDITOR**: Can create/edit/delete games and levels
- **ANALYST**: Read-only access to analytics

### API Authentication

**CMS Endpoints** (require session):
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"title": "Game", "genre": "Puzzle"}'
```

**Client Endpoints** (require API key):
```bash
curl http://localhost:3000/api/client/games/game-id/levels/level-id \
  -H "x-api-key: your-game-client-api-key"
```

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main CMS interface
│   ├── login/              # Login page
│   ├── api/
│   │   ├── auth/           # NextAuth endpoint
│   │   ├── games/          # Games CRUD (protected)
│   │   ├── users/          # User management (protected)
│   │   └── client/         # Game client API (API key protected)
│   └── layout.tsx          # Root layout with SessionProvider
├── components/
│   ├── auth/               # Authentication components
│   ├── game/               # Game editor components
│   └── analytics/          # Analytics dashboard
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── api-security.ts     # Security helpers
│   └── prisma.ts           # Prisma client
└── types/
    └── game.ts             # Type definitions
```

## Key Files

- [src/lib/auth.ts](src/lib/auth.ts) - NextAuth configuration with Credentials provider
- [src/lib/api-security.ts](src/lib/api-security.ts) - Session verification and API key validation
- [src/components/AuthSessionProvider.tsx](src/components/AuthSessionProvider.tsx) - SessionProvider wrapper
- [Dockerfile](Dockerfile) - Production-ready multi-stage build
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide

## Building for Production

```bash
# Build Next.js application
npm run build

# Start production server
npm start
```

With Docker:

```bash
docker build -t game-master-cms:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="..." \
  -e GAME_CLIENT_API_KEY="..." \
  game-master-cms:latest
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXTAUTH_URL` | Application URL for auth callbacks | `https://app.example.com` |
| `NEXTAUTH_SECRET` | Secret for JWT signing & encryption | 32+ character random string |
| `GAME_CLIENT_API_KEY` | API key for game client requests | Random 32-char base64 string |
| `NODE_ENV` | Runtime environment | `production` or `development` |

## Testing APIs

### Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gamemaster.dev",
    "password": "password123"
  }' \
  -c cookies.txt
```

### Create Game (requires session)

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat cookies.txt)" \
  -d '{
    "title": "My Game",
    "genre": "Puzzle"
  }'
```

### Fetch Level Data (requires API key)

```bash
curl http://localhost:3000/api/client/games/game-123/levels/level-456 \
  -H "x-api-key: your-api-key"
```

## Troubleshooting

**Login not working?**
- Check DATABASE_URL is correct
- Verify demo user exists: `npx prisma studio` → Users table
- Ensure password is hashed with bcryptjs

**API returns 401?**
- CMS endpoints need valid session
- Client endpoints need valid x-api-key header
- Check NEXTAUTH_SECRET is set

**Database connection error?**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Test with: `psql $DATABASE_URL -c "SELECT 1"`

**Docker build fails?**
- Run `npm install` locally first
- Check Node version: `node -v` (need 18+)
- Check Docker daemon is running

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

## Security Notes

✅ All CMS endpoints protected with session verification  
✅ Client API endpoints protected with API key validation  
✅ Passwords hashed with bcryptjs (10 rounds)  
✅ JWT tokens used for session management  
✅ CSRF protection via NextAuth cookies  
❌ HTTPS required in production (use reverse proxy/load balancer)  

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).
