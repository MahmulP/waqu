#!/bin/bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process on port 3000"

# Kill process on port 3030
lsof -ti:3030 | xargs kill -9 2>/dev/null || echo "No process on port 3030"

echo "Ports cleared!"
