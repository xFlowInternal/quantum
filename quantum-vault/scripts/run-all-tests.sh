#!/bin/bash

# Run All Tests Script
# Executes complete test suite for Quantum Vault

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              QUANTUM VAULT - COMPREHENSIVE TEST SUITE                ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if services are running
echo "🔍 Checking services..."
if ! docker ps | grep -q postgres; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "   Run: docker-compose up -d"
    exit 1
fi

if ! docker ps | grep -q redis; then
    echo -e "${RED}❌ Redis is not running${NC}"
    echo "   Run: docker-compose up -d"
    exit 1
fi

echo -e "${GREEN}✅ Services are running${NC}"
echo ""

# Run backend tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 BACKEND TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend
npm test -- --coverage --verbose 2>&1 | tee ../test-results-backend.log
BACKEND_EXIT=$?
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 CRYPTO TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd crypto
npm test -- --coverage --verbose 2>&1 | tee ../test-results-crypto.log
CRYPTO_EXIT=$?
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Backend tests: PASSED${NC}"
else
    echo -e "${RED}❌ Backend tests: FAILED${NC}"
fi

if [ $CRYPTO_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Crypto tests: PASSED${NC}"
else
    echo -e "${RED}❌ Crypto tests: FAILED${NC}"
fi

echo ""
echo "📄 Test logs saved to:"
echo "   - test-results-backend.log"
echo "   - test-results-crypto.log"
echo ""

# Exit with error if any tests failed
if [ $BACKEND_EXIT -ne 0 ] || [ $CRYPTO_EXIT -ne 0 ]; then
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
