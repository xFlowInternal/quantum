# Getting Started with Quantum Vault

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Docker 20+ ([Download](https://www.docker.com/))
- Git 2.30+ ([Download](https://git-scm.com/))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/quantum-vault.git
cd quantum-vault
```

### 2. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for:
- Root workspace
- Backend
- Frontend
- Crypto module

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=quantumvault
DB_PASSWORD=dev_password
DB_NAME=quantumvault_dev

REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development
```

### 4. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

Verify services are running:
```bash
docker ps
```

### 5. Run Database Migrations

```bash
cd backend
npm run migrate
cd ..
```

### 6. Start Development Servers

Open three terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Docker Logs (optional):**
```bash
docker-compose logs -f
```

## Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/api/health
- Metrics: http://localhost:3000/metrics

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Run tests:
```bash
npm test
```

4. Commit your changes:
```bash
git add .
git commit -m "Description of changes"
```

5. Push to your fork:
```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request

### Running Tests

```bash
# All tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Crypto tests
cd crypto && npm test

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npx prettier --write .
```

## Project Structure

```
quantum-vault/
├── backend/          # Backend API
│   ├── src/         # Source code
│   ├── tests/       # Tests
│   └── database/    # Migrations
├── frontend/        # React frontend
│   ├── src/         # Source code
│   └── tests/       # Tests
├── crypto/          # Crypto module
│   ├── ecc/         # ECC implementation
│   ├── pqc/         # PQC implementation
│   └── qrng/        # QRNG integration
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

## Common Tasks

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
cd backend && npm run migrate
```

### View Logs

```bash
# Docker logs
docker-compose logs -f

# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev
```

### Stop Services

```bash
# Stop Docker containers
docker-compose down

# Stop development servers
# Press Ctrl+C in each terminal
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Restart Docker
docker-compose down
docker-compose up -d

# Clean Docker
docker system prune -a
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker exec quantum-vault-postgres pg_isready -U quantumvault

# Connect to database
docker exec -it quantum-vault-postgres psql -U quantumvault -d quantumvault_dev
```

### Redis Connection Issues

```bash
# Check Redis is running
docker exec quantum-vault-redis redis-cli ping

# Connect to Redis
docker exec -it quantum-vault-redis redis-cli
```

## Next Steps

- Read the [Architecture Documentation](../architecture/SYSTEM-ARCHITECTURE.md)
- Review the [API Reference](../api/API-REFERENCE.md)
- Check the [Security Guidelines](../security/THREAT-MODEL.md)
- Join our community discussions

## Getting Help

- Open an issue on GitHub
- Check existing documentation
- Review closed issues for solutions
- Contact maintainers

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
