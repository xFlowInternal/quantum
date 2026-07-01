# Quantum Vault: Build Guide

**Version:** 1.0.0  
**Last Updated:** December 1, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Development Setup](#development-setup)
4. [Building for Production](#building-for-production)
5. [Running Tests](#running-tests)
6. [Docker Build](#docker-build)
7. [Troubleshooting](#troubleshooting)
8. [Build Optimization](#build-optimization)

---

## Prerequisites

### System Requirements

**Operating System:**
- Linux (Ubuntu 20.04+ recommended)
- macOS 11+
- Windows 10+ (with WSL2 recommended)

**Required Software:**
```bash
Node.js >= 18.0.0 (20.x LTS recommended)
npm >= 9.0.0 (10.x recommended)
PostgreSQL >= 15.0
Redis >= 7.0
Git >= 2.30
```

**Optional Software:**
```bash
Docker >= 20.10 (for containerized builds)
Docker Compose >= 2.0
PM2 (for production process management)
```

### Hardware Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB free space

**Recommended:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 20GB free space

---

## Quick Start

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/muhammadalihussnain/quantum-vault.git
cd quantum-vault

# Verify you're on the main branch
git branch
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, backend, frontend, crypto)
npm install

# Or install individually
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd crypto && npm install && cd ..
```

### 3. Set Up Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Minimum required variables:**
```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=quantumvault
DB_PASSWORD=your_password
DB_NAME=quantumvault_dev
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
CORS_ORIGIN=http://localhost:5173
```

### 4. Start Services

```bash
# Start PostgreSQL and Redis (if using Docker)
docker-compose up -d postgres redis

# Or start system services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

### 5. Run Database Migrations

```bash
cd backend
node database/migrate.js
cd ..
```

### 6. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 7. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

---

## Development Setup

### Detailed Installation Steps

#### 1. Install Node.js

**Ubuntu/Debian:**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

**macOS:**
```bash
# Using Homebrew
brew install node@20

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Windows:**
```bash
# Download installer from nodejs.org
# Or use nvm-windows
# Or use WSL2 and follow Linux instructions
```

#### 2. Install PostgreSQL

**Ubuntu/Debian:**
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL 15
sudo apt update
sudo apt install -y postgresql-15

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE USER quantumvault WITH PASSWORD 'your_password';
CREATE DATABASE quantumvault_dev OWNER quantumvault;
GRANT ALL PRIVILEGES ON DATABASE quantumvault_dev TO quantumvault;
\q
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb quantumvault_dev
```

**Windows:**
```bash
# Download installer from postgresql.org
# Or use Docker (recommended)
docker run -d \
  --name postgres \
  -e POSTGRES_USER=quantumvault \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=quantumvault_dev \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 3. Install Redis

**Ubuntu/Debian:**
```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

**macOS:**
```bash
# Using Homebrew
brew install redis
brew services start redis

# Test Redis
redis-cli ping
```

**Windows:**
```bash
# Use Docker (recommended)
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Or use WSL2 and follow Linux instructions
```

#### 4. Configure Development Environment

**Create .env file:**
```bash
cat > .env << 'EOF'
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=quantumvault
DB_PASSWORD=your_password
DB_NAME=quantumvault_dev
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=dev_secret_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
EOF
```

#### 5. Install Project Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install crypto dependencies
cd ../crypto
npm install

cd ..
```

**Expected output:**
```
added 535 packages in 45s (backend)
added 312 packages in 30s (frontend)
added 89 packages in 15s (crypto)
```

#### 6. Run Database Migrations

```bash
cd backend
node database/migrate.js
```

**Expected output:**
```
🔄 Starting database migrations...
✓ Migrations table ready
✓ Found 0 executed migrations
✓ Found 1 migration files
📝 Running migration: 001_initial_schema.sql
✅ Migration 001_initial_schema.sql completed
✅ Successfully ran 1 migration(s)
🎉 Migration process completed
```

#### 7. Verify Setup

```bash
# Check database tables
psql -U quantumvault -d quantumvault_dev -c "\dt"

# Expected tables:
# users, sessions, messages, audit_logs, 
# performance_metrics, webauthn_credentials, migrations
```

### Development Scripts

**Backend:**
```bash
cd backend

# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/models/User.test.js

# Lint code
npm run lint

# Format code
npm run format
```

**Frontend:**
```bash
cd frontend

# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

**Crypto:**
```bash
cd crypto

# Run tests
npm test

# Run benchmarks
npm run benchmark

# Run specific test
npm test -- tests/qrng.test.js
```

---

## Building for Production

### 1. Frontend Build

```bash
cd frontend

# Clean previous builds
rm -rf dist

# Build for production
npm run build

# Output will be in frontend/dist/
```

**Build output:**
```
vite v5.0.0 building for production...
✓ 234 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.30 kB
dist/assets/index-a1b2c3d4.css   12.34 kB │ gzip:  3.45 kB
dist/assets/index-e5f6g7h8.js   145.67 kB │ gzip: 45.67 kB
✓ built in 3.45s
```

**Verify build:**
```bash
# Preview production build
npm run preview

# Or serve with a static server
npx serve -s dist -p 3000
```

### 2. Backend Build

The backend doesn't require a build step (Node.js runs directly), but you should:

```bash
cd backend

# Install production dependencies only
npm ci --production

# Or if already installed
npm prune --production

# Verify no dev dependencies
npm ls --depth=0
```

### 3. Crypto Module Build

```bash
cd crypto

# Install production dependencies
npm ci --production

# Run tests to verify
npm test
```

### 4. Create Production Bundle

```bash
# From project root
cd ..

# Create production directory
mkdir -p production

# Copy necessary files
cp -r backend production/
cp -r crypto production/
cp -r frontend/dist production/frontend
cp .env.example production/.env
cp package.json production/
cp README.md production/

# Remove development files
cd production
rm -rf backend/tests
rm -rf backend/node_modules
rm -rf crypto/tests
rm -rf crypto/benchmarks
rm -rf crypto/node_modules

# Install production dependencies
cd backend && npm ci --production && cd ..
cd crypto && npm ci --production && cd ..

# Create tarball
cd ..
tar -czf quantum-vault-production.tar.gz production/
```

### 5. Production Environment Variables

Create production `.env`:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (use production credentials)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=quantumvault_prod
DB_PASSWORD=strong_production_password
DB_NAME=quantumvault_prod
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis (use production credentials)
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password
REDIS_DB=0

# JWT (generate strong secret)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS (use production domain)
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 6. Production Deployment

**Using PM2:**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Using Docker:**
```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

**Using systemd:**
```bash
# Create systemd service file
sudo nano /etc/systemd/system/quantum-vault.service
```

```ini
[Unit]
Description=Quantum Vault Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=quantumvault
WorkingDirectory=/opt/quantum-vault/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable quantum-vault
sudo systemctl start quantum-vault
sudo systemctl status quantum-vault
```

---

## Running Tests

### All Tests

```bash
# Run all tests from root
./scripts/run-all-tests.sh
```

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/models/
npm test -- tests/auth/
npm test -- tests/integration/
npm test -- tests/performance/

# Run specific test file
npm test -- tests/models/User.test.js

# Run in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --verbose
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch

# Run specific test
npm test -- src/components/Auth.test.jsx
```

### Crypto Tests

```bash
cd crypto

# Run all tests
npm test

# Run specific test suite
npm test -- tests/qrng.test.js
npm test -- tests/kyber.test.js
npm test -- tests/dilithium.test.js
npm test -- tests/hybrid.test.js

# Run benchmarks
npm run benchmark
```

### Integration Tests

```bash
# Ensure services are running
docker-compose up -d postgres redis

# Run integration tests
cd backend
npm test -- tests/integration/

# Expected output:
# ✓ Complete registration flow
# ✓ Complete login flow
# ✓ Token refresh flow
# ✓ Session management
# ✓ Concurrent operations
```

### Performance Tests

```bash
cd backend

# Run performance tests
npm test -- tests/performance/

# Expected output:
# ✓ Health check < 50ms
# ✓ Authentication < 500ms
# ✓ Protected routes < 100ms
# ✓ 50 concurrent requests < 2s
```

### Test Coverage

```bash
# Generate coverage report
cd backend
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Expected coverage:
# Statements: >90%
# Branches: >85%
# Functions: >90%
# Lines: >90%
```

---

## Docker Build

### Development with Docker

**1. Start all services:**
```bash
# Start PostgreSQL, Redis, and application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**2. Build specific service:**
```bash
# Build backend
docker-compose build backend

# Build frontend
docker-compose build frontend

# Build all
docker-compose build
```

### Production Docker Build

**1. Create Dockerfiles:**

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**2. Build production images:**
```bash
# Build backend image
docker build -t quantum-vault-backend:1.0.0 ./backend

# Build frontend image
docker build -t quantum-vault-frontend:1.0.0 ./frontend

# Tag for registry
docker tag quantum-vault-backend:1.0.0 your-registry/quantum-vault-backend:1.0.0
docker tag quantum-vault-frontend:1.0.0 your-registry/quantum-vault-frontend:1.0.0

# Push to registry
docker push your-registry/quantum-vault-backend:1.0.0
docker push your-registry/quantum-vault-frontend:1.0.0
```

**3. Run production containers:**
```bash
# Using docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Or manually
docker run -d \
  --name quantum-vault-backend \
  -p 3000:3000 \
  --env-file .env \
  quantum-vault-backend:1.0.0

docker run -d \
  --name quantum-vault-frontend \
  -p 80:80 \
  quantum-vault-frontend:1.0.0
```

### Docker Optimization

**Multi-stage builds:**
```dockerfile
# Reduce image size with multi-stage builds
FROM node:20-alpine AS builder
# ... build steps ...

FROM node:20-alpine
COPY --from=builder /app/dist ./dist
# ... minimal runtime ...
```

**Layer caching:**
```dockerfile
# Copy package files first for better caching
COPY package*.json ./
RUN npm ci
COPY . .
```

**Security:**
```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

---

## Troubleshooting

### Common Build Issues

**1. Node modules not found**
```bash
# Problem: Cannot find module 'express'
# Solution: Install dependencies
npm install

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

**2. Port already in use**
```bash
# Problem: Error: listen EADDRINUSE: address already in use :::3000
# Solution: Kill process using port
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**3. Database connection failed**
```bash
# Problem: Error: connect ECONNREFUSED 127.0.0.1:5432
# Solution: Start PostgreSQL
sudo systemctl start postgresql

# Or check if running
sudo systemctl status postgresql

# Check connection
psql -U quantumvault -d quantumvault_dev -h localhost
```

**4. Redis connection failed**
```bash
# Problem: Error: connect ECONNREFUSED 127.0.0.1:6379
# Solution: Start Redis
sudo systemctl start redis-server

# Or check if running
redis-cli ping
```

**5. Migration failed**
```bash
# Problem: Migration error
# Solution: Reset database
psql -U quantumvault -d quantumvault_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Run migrations again
node backend/database/migrate.js
```

**6. Frontend build failed**
```bash
# Problem: Build failed with errors
# Solution: Clear cache and rebuild
cd frontend
rm -rf node_modules dist .vite
npm install
npm run build
```

**7. Tests failing**
```bash
# Problem: Tests failing
# Solution: Ensure services are running
docker-compose up -d postgres redis

# Clear test database
psql -U quantumvault -d quantumvault_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Run tests
npm test
```

### Build Performance Issues

**Slow npm install:**
```bash
# Use npm ci for faster installs
npm ci

# Or use pnpm (faster alternative)
npm install -g pnpm
pnpm install
```

**Slow frontend build:**
```bash
# Enable build cache
export VITE_BUILD_CACHE=true

# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Build
npm run build
```

**Slow tests:**
```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Run only changed tests
npm test -- --onlyChanged

# Skip slow tests
npm test -- --testPathIgnorePatterns=performance
```

---

## Build Optimization

### Frontend Optimization

**1. Code Splitting:**
```javascript
// Use dynamic imports
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
```

**2. Bundle Analysis:**
```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Build with analysis
npm run build -- --mode analyze

# View report
open dist/stats.html
```

**3. Asset Optimization:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          crypto: ['./src/utils/crypto.js'],
        },
      },
    },
  },
};
```

### Backend Optimization

**1. Production Dependencies:**
```bash
# Remove dev dependencies
npm prune --production

# Verify
npm ls --depth=0 --production
```

**2. Environment Variables:**
```bash
# Use production settings
NODE_ENV=production
LOG_LEVEL=info
```

**3. Process Management:**
```bash
# Use PM2 cluster mode
pm2 start ecosystem.config.js --instances max
```

### Database Optimization

**1. Connection Pooling:**
```javascript
// Optimize pool size
DB_POOL_MIN=2
DB_POOL_MAX=20
```

**2. Query Optimization:**
```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_messages_created ON messages(created_at DESC);

-- Analyze tables
ANALYZE users;
ANALYZE messages;
```

### Build Scripts

**package.json scripts:**
```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm ci --production",
    "build:frontend": "cd frontend && npm run build",
    "build:docker": "docker-compose -f docker-compose.prod.yml build",
    "build:production": "./scripts/build-production.sh",
    "test:all": "./scripts/run-all-tests.sh",
    "deploy": "npm run build && npm run test:all && npm run deploy:production"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Build

The project includes automated builds via GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Build Frontend
  run: |
    cd frontend
    npm ci
    npm run build
    
- name: Upload Build Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: frontend-build
    path: frontend/dist
```

### Local CI Simulation

```bash
# Run the same checks as CI
npm run lint
npm run test
npm run build

# Or use act to run GitHub Actions locally
brew install act
act -j build
```

---

## Build Checklist

### Pre-Build
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Services running (PostgreSQL, Redis)

### Build
- [ ] Frontend builds successfully
- [ ] No build warnings or errors
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes (if applicable)

### Post-Build
- [ ] Build artifacts created
- [ ] Build size acceptable
- [ ] Production bundle tested
- [ ] Performance benchmarks met
- [ ] Security scan passed

---

## Support

For build issues:
- Check [Troubleshooting](#troubleshooting) section
- Review [GitHub Issues](https://github.com/muhammadalihussnain/quantum-vault/issues)
- Contact: support@quantum-vault.example.com

---

**Last Updated:** December 1, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
