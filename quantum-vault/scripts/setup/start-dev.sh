#!/bin/bash

echo "🚀 Starting Quantum Vault Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check PostgreSQL
echo "Checking PostgreSQL..."
docker exec quantum-vault-postgres pg_isready -U quantumvault > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Redis
echo "Checking Redis..."
docker exec quantum-vault-redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "Services running:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  - Backend: cd backend && npm run dev"
echo "  - Frontend: cd frontend && npm run dev"
echo "  - View logs: docker-compose logs -f"
