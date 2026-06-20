#!/bin/bash
# start.sh - Startup script for Render
# Place this in: D:/bhora-ai/commentary-orchestrator/start.sh

set -e

echo "=========================================="
echo "🎙️  Commentary Orchestrator Starting..."
echo "=========================================="
echo ""

# Check if Liquidsoap is running
echo "🔍 Checking Liquidsoap status..."
if pgrep -x "liquidsoap" > /dev/null; then
    echo "✅ Liquidsoap is already running"
else
    echo "⚠️  Liquidsoap not running. Starting Liquidsoap..."
    
    # Start Liquidsoap in the background
    liquidsoap /app/liquidsoap.liq &
    
    # Wait for Liquidsoap to start
    sleep 5
    echo "✅ Liquidsoap started"
fi

echo ""
echo "🚀 Starting Python Orchestrator..."
echo "=========================================="
echo ""

# Run the Python orchestrator
python -u orchestrator.py