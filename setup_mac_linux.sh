#!/usr/bin/env bash
set -euo pipefail

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
(
  cd frontend
  npm install
)

echo "Setup complete. Start the backend and frontend in separate terminals."
