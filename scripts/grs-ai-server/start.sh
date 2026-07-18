#!/usr/bin/env bash
# GRS AI Server — start script (Linux / macOS)
# Usage: bash start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "[GRS] Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install / update dependencies
echo "[GRS] Installing dependencies..."
pip install --quiet -r requirements.txt

# Start server
PORT="${PORT:-8765}"
echo "[GRS] Starting server on port ${PORT}"
uvicorn main:app --host 0.0.0.0 --port "${PORT}" --log-level info
