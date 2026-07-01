# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Link to GitHub (First Time Only)

```bash
# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/quantum-vault.git
git push -u origin main
```

See [GITHUB-SETUP.md](GITHUB-SETUP.md) for detailed instructions.

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

### 4. Verify Setup

```bash
./scripts/setup/verify-day1.sh
```

---

## 📚 Key Documents

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview |
| [WEEK1-SUMMARY.md](WEEK1-SUMMARY.md) | Week 1 completion summary |
| [PROGRESS.md](PROGRESS.md) | Detailed progress tracking |
| [GITHUB-SETUP.md](GITHUB-SETUP.md) | GitHub setup instructions |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [docs/guides/GETTING-STARTED.md](docs/guides/GETTING-STARTED.md) | Full getting started guide |

---

## 🎯 Current Status

**Week 1: Complete ✅**
- All foundation work done
- Documentation complete
- Ready for Week 2

**Next: Week 2 - Database Setup**

---

## 🔧 Useful Commands

```bash
# Start development environment
./scripts/setup/start-dev.sh

# Stop development environment
./scripts/setup/stop-dev.sh

# Run tests (when implemented)
npm test

# Lint code
npm run lint

# View Docker logs
docker-compose logs -f

# Check Git status
git status

# View commit history
git log --oneline
```

---

## 📊 Project Structure

```
quantum-vault/
├── backend/          # Backend API (Node.js + Express)
├── frontend/         # Frontend (React + Vite)
├── crypto/           # Crypto module (ECC + PQC + QRNG)
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── .github/          # GitHub templates
```

---

## 🆘 Need Help?

1. Check [docs/guides/GETTING-STARTED.md](docs/guides/GETTING-STARTED.md)
2. Review [WEEK1-SUMMARY.md](WEEK1-SUMMARY.md)
3. Read [COMPLETE-12-WEEK-ROADMAP.md](COMPLETE-12-WEEK-ROADMAP.md)
4. Open an issue on GitHub (after pushing)

---

## ✅ Week 1 Checklist

- [x] Project structure created
- [x] Git initialized
- [x] Documentation written
- [x] Configuration files created
- [x] Development environment set up
- [x] Testing framework configured
- [x] Ready to push to GitHub

**Next:** Link to GitHub and start Week 2!
