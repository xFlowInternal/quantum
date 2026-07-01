#!/bin/bash

echo "🛑 Stopping Quantum Vault Development Environment..."
echo ""

# Stop Docker containers
docker-compose down

echo ""
echo "✅ Development environment stopped"
echo ""
echo "To remove volumes (WARNING: deletes all data):"
echo "  docker-compose down -v"
