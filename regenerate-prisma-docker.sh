#!/bin/bash

echo "===================================="
echo "  Prisma Client Regeneration Script"
echo "  For Docker Development Environment"
echo "===================================="
echo ""

echo "Step 1: Regenerating Prisma client inside Docker container..."
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to regenerate Prisma client in Docker."
    echo "Make sure the backend container is running."
    echo "Try: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

echo ""
echo "Step 2: Restarting backend container to apply changes..."
docker-compose -f docker-compose.dev.yml restart backend

echo ""
echo "Step 3: Waiting for backend to start..."
sleep 5

echo ""
echo "===================================="
echo "  ✓ Prisma client regenerated!"
echo "  ✓ Backend container restarted!"
echo "===================================="
echo ""
echo "The backend should now be running with the updated Prisma client."
echo "Check logs with: docker-compose -f docker-compose.dev.yml logs -f backend"
echo ""
