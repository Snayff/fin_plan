#!/bin/bash

echo ""
echo "========================================"
echo "  Starting FinPlan Development Stack"
echo "========================================"
echo ""

echo "[1/3] Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to start services!"
    echo "   Make sure Docker is running."
    exit 1
fi

echo ""
echo "[2/3] Waiting for services to be healthy..."
sleep 10

echo ""
echo "[3/3] Running database migrations..."
docker-compose -f docker-compose.dev.yml exec -T backend bun run db:migrate

echo ""
echo "========================================"
echo "  ✅ All Services Started Successfully!"
echo "========================================"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  Prisma Studio: Run 'bun run db:studio'"
echo ""
echo "  View logs: bun run docker:logs"
echo "  Stop services: bun run stop (or ./stop-dev.sh)"
echo ""
