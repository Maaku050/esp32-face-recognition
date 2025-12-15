#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: bash setup.sh"
    exit 1
fi

echo "Starting InsightFace Service..."
echo ""

# Activate virtual environment
source venv/bin/activate

# Run the service
python insightface_service.py

# Deactivate on exit
deactivate