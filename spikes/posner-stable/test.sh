#!/bin/bash

echo "🧪 Posner Molecule Stability Spike (SPIKE-01)"
echo "============================================"
echo ""
echo "This spike tests whether the 39-atom Posner molecule ($Ca_9(PO_4)_6$)"
echo "can maintain geometric stability at a 30Hz physics tick with graceful degradation."
echo ""
echo "📋 Test Instructions:"
echo "1. Run: ./test.sh (starts server)"
echo "2. Open http://localhost:8080 in your browser"
echo "3. Observe the molecule for 30-60 seconds"
echo "4. Monitor FPS and LOD level in top-left corner"
echo "5. Force performance drops to test degradation (open many browser tabs)"
echo ""
echo "🎯 Success Criteria:"
echo "• FPS stays above 50 (graceful degradation activates below 50)"
echo "• LOD level increases automatically when FPS drops"
echo "• Molecule maintains stable tetrahedral structure"
echo "• No visual collision artifacts or structural collapse"
echo ""
echo "⚡ New Features:"
echo "• Automatic LOD (Level of Detail) degradation"
echo "• Real-time performance monitoring"
echo "• Graceful server shutdown (Ctrl+C)"
echo "• Visual LOD indicators (yellow flash on degradation)"
echo ""
echo "Starting server with graceful shutdown handling..."

cd "$(dirname "$0")"

# Trap SIGINT for graceful shutdown
trap 'echo -e "\n⏹️  Shutting down server gracefully..."; exit 0' INT

node server.js