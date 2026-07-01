#!/bin/bash

echo "🚀 Installing Quantum Vault..."
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

echo "✓ All prerequisites met"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing crypto dependencies..."
cd crypto && npm install && cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Start Docker containers: docker-compose up -d"
echo "  3. Run migrations: npm run migrate"
echo "  4. Start development: npm run dev"
