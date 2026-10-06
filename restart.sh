#!/bin/bash
echo "Stopping old processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "python3 app.py" 2>/dev/null
pkill -f vite 2>/dev/null
sleep 2

echo "Starting backend..."
cd /workspaces/ehr-blockchain-ransomware-detection/backend
nohup node server.js > backend.log 2>&1 &

echo "Starting AI service..."
cd /workspaces/ehr-blockchain-ransomware-detection/ai-service
nohup python3 app.py > ai.log 2>&1 &

echo "Starting frontend..."
cd /workspaces/ehr-blockchain-ransomware-detection/frontend
nohup npm run dev -- --port 5173 --strictPort > frontend.log 2>&1 &

sleep 4
echo ""
echo "=== STATUS CHECK ==="
curl -s http://localhost:4000/api/chain > /dev/null && echo "✅ Backend (4000) is UP" || echo "❌ Backend (4000) FAILED"
curl -s http://localhost:5000/health > /dev/null && echo "✅ AI service (5000) is UP" || echo "❌ AI service (5000) FAILED"
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend (5173) is UP" || echo "❌ Frontend (5173) FAILED"