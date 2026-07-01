# CI/CD & Security Automation Guide

**Quantum Vault - Continuous Integration & Deployment**

---

## 📋 Overview

This document describes the CI/CD pipeline and security automation for Quantum Vault.

### Pipeline Components
1. **Code Quality & Linting** - ESLint, Prettier
2. **Unit Tests** - Jest with coverage
3. **Security Scanning** - Snyk, CodeQL, OWASP
4. **Build Verification** - Frontend build
5. **Performance Tests** - API benchmarks
6. **Deployment** - Staging & Production

---

## 🔄 CI/CD Workflows

### Main CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **Lint** - Code quality checks
2. **Test Unit** - Run all unit tests with coverage
3. **Security** - Dependency vulnerability scanning
4. **CodeQL** - Static security analysis
5. **Build** - Verify frontend builds
6. **Performance** - Run performance benchmarks (main branch only)
7. **Deploy Staging** - Deploy to staging (develop branch)
8. **Deploy Production** - Deploy to production (main branch)

### Security Workflow (`.github/workflows/security.yml`)

**Triggers:**
- Daily at 2 AM UTC (scheduled)
- Push to `main` branch
- Pull requests to `main`
- Manual trigger (workflow_dispatch)

**Jobs:**
1. **Dependency Scan** - npm audit for all workspaces
2. **Snyk Scan** - Vulnerability scanning
3. **OWASP Dependency Check** - Security analysis
4. **Secret Scan** - TruffleHog secret detection
5. **Container Scan** - Trivy Docker image scanning
6. **License Check** - License compliance
7. **Security Summary** - Aggregate report

---

## 🔍 Static Analysis Tools

### 1. ESLint (Code Quality)

**Configuration:** `.eslintrc.json`

**Rules Enforced:**
- No `var`, use `const`/`let`
- Strict equality (`===`)
- No `eval()` or similar dangerous functions
- Require curly braces
- Async/await best practices
- No unused variables

**Usage:**
```bash
# Lint backend
npm run lint --workspace=backend

# Lint frontend
npm run lint --workspace=frontend

# Auto-fix issues
npm run lint:fix --workspace=backend
```

### 2. CodeQL (Security Analysis)

**What it does:**
- Scans code for security vulnerabilities
- Detects SQL injection, XSS, etc.
- Analyzes data flow
- Provides security alerts

**Configuration:** Automatic in GitHub Actions

**Queries:** `security-and-quality`

### 3. Snyk (Dependency Scanning)

**What it does:**
- Scans npm dependencies for known vulnerabilities
- Provides fix recommendations
- Monitors continuously

**Setup:**
1. Sign up at https://snyk.io
2. Add `SNYK_TOKEN` to GitHub Secrets
3. Automatic scanning on every push

**Severity Thresholds:**
- CI Pipeline: High severity
- Security Workflow: Medium severity

### 4. OWASP Dependency Check

**What it does:**
- Identifies known vulnerabilities in dependencies
- Uses CVE database
- Generates HTML reports

**Configuration:** Automatic in security workflow

### 5. TruffleHog (Secret Scanning)

**What it does:**
- Scans for accidentally committed secrets
- Checks API keys, passwords, tokens
- Scans entire git history

**What it detects:**
- AWS keys
- API tokens
- Private keys
- Passwords in code

### 6. Trivy (Container Scanning)

**What it does:**
- Scans Docker images for vulnerabilities
- Checks OS packages
- Analyzes application dependencies

**Usage:**
```bash
# Scan Docker image locally
docker build -t quantum-vault .
trivy image quantum-vault
```

---

## 🧪 Testing Strategy

### Unit Tests

**Coverage Target:** >90%

**Backend Tests:**
- Models (User, Session, Message)
- Services (JWT, Auth)
- Utilities (Metrics, Validators)

**Crypto Tests:**
- QRNG service
- Kyber (ML-KEM-768)
- Dilithium (ML-DSA-65)
- Hybrid cryptography

**Run Tests:**
```bash
# All tests
./scripts/run-all-tests.sh

# Backend only
npm test --workspace=backend

# Crypto only
npm test --workspace=crypto

# With coverage
npm test --workspace=backend -- --coverage
```

### Integration Tests

**What's tested:**
- Complete auth workflows
- API endpoint interactions
- Database operations
- Redis caching

**Location:** `backend/tests/integration/`

### Performance Tests

**Benchmarks:**
- API response times
- Concurrent request handling
- Database query performance
- Redis operation speed
- Memory usage

**Location:** `backend/tests/performance/`

**Run Performance Tests:**
```bash
npm test --workspace=backend -- tests/performance
```

---

## 🚀 Deployment

### Environments

**1. Staging**
- Branch: `develop`
- URL: `https://staging.quantum-vault.example.com`
- Auto-deploy on push to `develop`

**2. Production**
- Branch: `main`
- URL: `https://quantum-vault.example.com`
- Auto-deploy on push to `main` (after all tests pass)

### Deployment Platforms

**Recommended Options:**

**1. Render.com** (Easiest)
```yaml
# render.yaml
services:
  - type: web
    name: quantum-vault-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

**2. Railway.app**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

**3. AWS (Advanced)**
- ECS/Fargate for containers
- RDS for PostgreSQL
- ElastiCache for Redis
- CloudFront for frontend

### Environment Variables

**Required for Production:**
```bash
NODE_ENV=production
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=quantumvault_prod
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CORS_ORIGIN=https://your-frontend-domain.com
```

**GitHub Secrets to Configure:**
```
SNYK_TOKEN          - Snyk API token
SLACK_WEBHOOK_URL   - Slack notifications (optional)
DEPLOY_KEY          - SSH key for deployment (if needed)
```

---

## 📊 Monitoring & Alerts

### Code Coverage

**Codecov Integration:**
- Automatic coverage reports
- PR comments with coverage changes
- Coverage badges

**Setup:**
1. Sign up at https://codecov.io
2. Add repository
3. Coverage automatically uploaded by CI

### Security Alerts

**GitHub Security Advisories:**
- Automatic Dependabot alerts
- Security vulnerability notifications
- Suggested fixes

**Snyk Monitoring:**
- Continuous dependency monitoring
- Email alerts for new vulnerabilities
- Fix PRs automatically created

### Performance Monitoring

**Prometheus Metrics:**
- API response times
- Request rates
- Error rates
- Resource usage

**Grafana Dashboards:**
- Real-time metrics visualization
- Custom alerts
- Historical data

---

## 🔒 Security Best Practices

### 1. Secrets Management

**Never commit:**
- API keys
- Passwords
- Private keys
- JWT secrets

**Use:**
- Environment variables
- GitHub Secrets
- Secret management services (AWS Secrets Manager, HashiCorp Vault)

### 2. Dependency Updates

**Regular updates:**
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

### 3. Code Review

**Required for:**
- All pull requests
- Security-sensitive changes
- Dependency updates

**Checklist:**
- Tests passing
- Coverage maintained
- No security issues
- Code quality standards met

### 4. Branch Protection

**Configure on GitHub:**
- Require PR reviews
- Require status checks to pass
- Require branches to be up to date
- No force pushes
- No deletions

---

## 🛠️ Troubleshooting

### CI Pipeline Failures

**Lint Failures:**
```bash
# Fix locally
npm run lint:fix --workspace=backend
npm run lint:fix --workspace=frontend
```

**Test Failures:**
```bash
# Run tests locally
npm test --workspace=backend

# Check specific test
npm test --workspace=backend -- tests/models/User.test.js
```

**Build Failures:**
```bash
# Build frontend locally
npm run build --workspace=frontend

# Check for errors
npm run build --workspace=frontend -- --mode production
```

### Security Scan Issues

**High Severity Vulnerabilities:**
1. Check Snyk/npm audit output
2. Update affected packages
3. If no fix available, assess risk
4. Consider alternative packages

**False Positives:**
1. Review the vulnerability
2. Check if it affects your code
3. Add to ignore list if safe
4. Document the decision

---

## 📈 Metrics & KPIs

### CI/CD Performance

**Target Metrics:**
- Build time: <5 minutes
- Test time: <3 minutes
- Deploy time: <2 minutes
- Total pipeline: <10 minutes

### Code Quality

**Target Metrics:**
- Test coverage: >90%
- ESLint errors: 0
- Security vulnerabilities: 0 high/critical
- Code duplication: <5%

### Deployment

**Target Metrics:**
- Deployment frequency: Multiple per day
- Lead time: <1 hour
- Mean time to recovery: <15 minutes
- Change failure rate: <5%

---

## 🎯 Next Steps

### Week 11 Checklist

- [x] CI/CD pipeline configured
- [x] Security scanning automated
- [x] Static analysis tools integrated
- [x] Deployment workflows created
- [x] Documentation complete

### Future Enhancements

1. **E2E Tests** - Playwright/Cypress
2. **Load Testing** - k6/Artillery
3. **Chaos Engineering** - Chaos Monkey
4. **Blue-Green Deployment** - Zero-downtime deploys
5. **Canary Releases** - Gradual rollouts

---

**Last Updated:** December 1, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
