#!/bin/bash

# Start backend API
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend (exposed preview port)
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
