# Game Master CMS - Production Deployment Guide

## Overview

This guide covers deploying Game Master CMS to a VPS with PostgreSQL, Docker, and environment-based configuration.

## Prerequisites

- Docker installed on VPS
- Docker Compose (optional but recommended)
- PostgreSQL 14+ running on VPS or managed service
- Node.js 18+ for local development

## Environment Setup

### 1. Database Configuration

Ensure PostgreSQL is running and accessible:

```bash
# Connection string format
DATABASE_URL=postgresql://username:password@hostname:5432/game_master_cms

# Create database if needed
createdb game_master_cms
```

### 2. Environment Variables

Create `.env.production` on your VPS:

```bash
# Database
DATABASE_URL=postgresql://user:password@your-vps-ip:5432/game_master_cms

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-32-chars-minimum

# Game Client API
GAME_CLIENT_API_KEY=your-game-client-api-key

# Node
NODE_ENV=production
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Database Initialization

Before deploying, run Prisma migrations:

```bash
# Set up database schema
npx prisma migrate deploy

# Create demo users with hashed passwords
npx prisma db seed  # if seed file exists, otherwise see below
```

#### Seeding Demo Users

Create a seed script `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@gamemaster.dev" },
    update: { password: hashedPassword },
    create: {
      email: "admin@gamemaster.dev",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@gamemaster.dev" },
    update: { password: hashedPassword },
    create: {
      email: "editor@gamemaster.dev",
      password: hashedPassword,
      role: "EDITOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "analyst@gamemaster.dev" },
    update: { password: hashedPassword },
    create: {
      email: "analyst@gamemaster.dev",
      password: hashedPassword,
      role: "ANALYST",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Run seed:
```bash
npx prisma db seed
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t game-master-cms:latest .

# Or with custom tag
docker build -t game-master-cms:1.0.0 -t game-master-cms:latest .
```

### Run Docker Container

```bash
docker run \
  -d \
  --name game-master-cms \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/cms" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e GAME_CLIENT_API_KEY="your-api-key" \
  -e NODE_ENV="production" \
  game-master-cms:latest
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.9"

services:
  app:
    image: game-master-cms:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://cms_user:cms_password@postgres:5432/game_master_cms
      NEXTAUTH_URL: https://your-domain.com
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      GAME_CLIENT_API_KEY: ${GAME_CLIENT_API_KEY}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - cms-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cms_user
      POSTGRES_PASSWORD: cms_password
      POSTGRES_DB: game_master_cms
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cms_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - cms-network

volumes:
  postgres_data:

networks:
  cms-network:
    driver: bridge
```

Deploy with Compose:

```bash
# Create .env file with secrets
cat > .env << EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GAME_CLIENT_API_KEY=$(openssl rand -base64 32)
EOF

# Start services
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

## API Security

All CMS API endpoints require an active session:

```bash
# Example: Create a game (requires login)
curl -X POST http://localhost:3000/api/games \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"title": "New Game", "genre": "Puzzle"}'
```

Client API endpoints require the `x-api-key` header:

```bash
# Example: Get level data for game client
curl http://localhost:3000/api/client/games/game-id/levels/level-id \
  -H "x-api-key: your-game-client-api-key"
```

## Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL/TLS with Let's Encrypt

```bash
sudo certbot certonly --standalone -d your-domain.com
sudo certbot renew --dry-run  # Test renewal
```

## Monitoring & Logs

```bash
# View container logs
docker logs game-master-cms -f

# Check container status
docker ps | grep game-master-cms

# Enter container shell
docker exec -it game-master-cms sh

# Check database connection
docker exec -it game-master-cms npx prisma studio
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection string
PGPASSWORD=password psql -h localhost -U user -d game_master_cms -c "SELECT 1"

# Check Prisma connection
docker exec game-master-cms npx prisma migrate status
```

### Authentication Problems

- Verify `NEXTAUTH_SECRET` is set and consistent
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies and retry login

### API Key Issues

- Ensure `GAME_CLIENT_API_KEY` is set
- Clients must include `x-api-key` header
- Generate new key: `openssl rand -base64 32`

## Rollback Procedure

```bash
# Keep previous image
docker tag game-master-cms:latest game-master-cms:backup

# Restore previous version
docker stop game-master-cms
docker rm game-master-cms
docker run -d --name game-master-cms ... game-master-cms:previous
```

## Performance Optimization

- Use CDN for static assets in `public/`
- Enable database connection pooling
- Set appropriate Node memory limits
- Use Redis for session caching (advanced)

## Security Checklist

- [ ] Change all default passwords
- [ ] Use HTTPS/TLS in production
- [ ] Rotate `NEXTAUTH_SECRET` regularly
- [ ] Restrict `GAME_CLIENT_API_KEY` by IP (if possible)
- [ ] Enable database backups
- [ ] Set up monitoring/alerting
- [ ] Keep Docker images updated
- [ ] Review firewall rules

## Maintenance

### Regular Tasks

```bash
# Weekly: Check logs for errors
docker logs game-master-cms | tail -100

# Monthly: Run database maintenance
docker exec game-master-cms npx prisma db execute "VACUUM ANALYZE;"

# Quarterly: Update base image
docker pull node:18-alpine
docker build --no-cache -t game-master-cms:latest .
```

### Database Backups

```bash
# Backup
docker exec postgres pg_dump -U cms_user -d game_master_cms > backup.sql

# Restore
docker exec -i postgres psql -U cms_user -d game_master_cms < backup.sql
```

## Support

For issues or questions, check:
- Application logs: `docker logs game-master-cms`
- Database status: `docker exec postgres pg_isready`
- NextAuth docs: https://next-auth.js.org/
- Prisma docs: https://www.prisma.io/docs/
