#!/bin/bash

echo ""
echo "========================================"
echo "  Stopping FinPlan Development Stack"
echo "========================================"
echo ""

docker-compose -f docker-compose.dev.yml down

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to stop services!"
    exit 1
fi

echo ""
echo "========================================"
echo "  ✅ All Services Stopped Successfully!"
echo "========================================"
echo ""
