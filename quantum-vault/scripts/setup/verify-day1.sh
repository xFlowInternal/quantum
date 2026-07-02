#!/bin/bash

echo "🔍 Verifying Week 1 Day 1 Setup..."
echo ""

# Check Node.js
echo "✓ Checking Node.js version..."
node --version

# Check npm
echo "✓ Checking npm version..."
npm --version

# Check Docker
echo "✓ Checking Docker version..."
docker --version

# Check Git
echo "✓ Checking Git version..."
git --version

echo ""
echo "📁 Verifying directory structure..."
if [ -d "backend/src/auth" ] && [ -d "frontend/src/components" ] && [ -d "crypto/ecc" ]; then
    echo "✓ All directories created successfully"
else
    echo "✗ Some directories are missing"
    exit 1
fi

echo ""
echo "📄 Verifying configuration files..."
files=("README.md" "package.json" ".gitignore" "docker-compose.yml" ".eslintrc.json" ".prettierrc")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file is missing"
        exit 1
    fi
done

echo ""
echo "🔧 Checking Git status..."
git status --short

echo ""
echo "💾 Checking disk usage..."
du -sh .

echo ""
echo "✅ Week 1 Day 1 verification complete!"
echo ""
echo "Next steps:"
echo "  1. Review the created files"
echo "  2. Proceed to Day 2: Architecture Documentation"
echo "  3. Or start Docker containers: docker-compose up -d"
