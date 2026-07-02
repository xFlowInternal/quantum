# GitHub Repository Setup Guide

## Linking Your Local Repository to GitHub

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Fill in the details:
   - **Repository name:** quantum-vault
   - **Description:** Hybrid Quantum-Classical Secure Chat Application
   - **Visibility:** Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Step 2: Link Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/quantum-vault.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/quantum-vault.git

# Verify remote was added
git remote -v

# Push your code to GitHub
git push -u origin main
```

### Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all files and commits
3. Check that all 4 commits are visible:
   - Initial commit
   - Add progress tracking document
   - Add Day 1 verification script
   - Week 1 Days 2-7: Complete foundation setup

### Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Login to GitHub
gh auth login

# Create repository and push
gh repo create quantum-vault --public --source=. --remote=origin --push
```

## Repository Settings (Recommended)

### 1. Branch Protection

Go to Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

### 2. Enable GitHub Actions

Go to Settings → Actions → General:
- ✅ Allow all actions and reusable workflows

### 3. Security Settings

Go to Settings → Security:
- ✅ Enable Dependabot alerts
- ✅ Enable Dependabot security updates
- ✅ Enable CodeQL analysis

### 4. Add Topics

Go to repository main page → About (gear icon):
- Add topics: `quantum-cryptography`, `chat-application`, `post-quantum`, `security`, `nodejs`, `react`

### 5. Add Description

In the About section:
- Description: "Hybrid Quantum-Classical Secure Chat Application with ECC, PQC, and QRNG"
- Website: (add when deployed)

## Collaborators

To add collaborators:
1. Go to Settings → Collaborators
2. Click "Add people"
3. Enter their GitHub username
4. Select permission level

## GitHub Pages (Optional)

To host documentation:
1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: main
4. Folder: /docs
5. Save

## Useful GitHub Features

### Issues
- Use the templates we created in `.github/ISSUE_TEMPLATE/`
- Label issues appropriately
- Assign to team members

### Projects
- Create a project board for tracking progress
- Use the 12-week roadmap as milestones

### Discussions
- Enable Discussions for community Q&A
- Create categories: General, Ideas, Q&A, Show and Tell

### Wiki
- Enable Wiki for additional documentation
- Link to main docs in the repository

## Continuous Integration (Week 11)

We'll set up GitHub Actions later, but the structure is ready:
- `.github/workflows/` directory exists
- CI/CD pipelines will be added in Week 11

## Current Repository Status

```
✅ 30 directories created
✅ 35+ files created
✅ 4 commits made
✅ Complete Week 1 foundation
✅ Ready to push to GitHub
```

## What's Included

### Documentation
- README.md with project overview
- CONTRIBUTING.md with contribution guidelines
- CODE_OF_CONDUCT.md
- SECURITY.md with security policy
- LICENSE (MIT)
- Complete architecture documentation
- API reference
- Getting started guide

### Configuration
- package.json for all workspaces
- Docker Compose for development
- ESLint and Prettier configuration
- Jest and Vitest configuration
- Environment variable templates

### Templates
- Bug report template
- Feature request template
- Security vulnerability template
- Pull request template

### Scripts
- Installation script
- Development start/stop scripts
- Verification scripts

## Next Steps After Pushing

1. ✅ Push code to GitHub
2. ✅ Verify all files are uploaded
3. ✅ Configure repository settings
4. ✅ Add repository description and topics
5. ✅ Enable security features
6. Continue with Week 2: Database Setup

## Troubleshooting

### Authentication Issues

If you get authentication errors:

**HTTPS:**
```bash
# Use personal access token
# Generate at: Settings → Developer settings → Personal access tokens
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/quantum-vault.git
```

**SSH:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
cat ~/.ssh/id_ed25519.pub

# Use SSH URL
git remote set-url origin git@github.com:YOUR_USERNAME/quantum-vault.git
```

### Large File Issues

If you have large files:
```bash
# Check file sizes
find . -type f -size +50M

# Use Git LFS if needed
git lfs install
git lfs track "*.large-extension"
```

### Push Rejected

If push is rejected:
```bash
# Force push (only if you're sure)
git push -u origin main --force

# Or pull first
git pull origin main --rebase
git push -u origin main
```

## Support

If you encounter issues:
1. Check GitHub documentation
2. Review error messages carefully
3. Search for similar issues on Stack Overflow
4. Open an issue in this repository (after pushing)

---

**Ready to push?** Run these commands:

```bash
# Make sure you're in the project directory
cd ~/quantum-vault

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/quantum-vault.git

# Push to GitHub
git push -u origin main
```

**Success!** Your code is now on GitHub! 🎉
