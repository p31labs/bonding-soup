/**
 * Mock WebSocket Server for BONDING WCD-32 Testing
 * Simulates multiplayer environment with ghost molecules and social events
 */

const WebSocket = require('ws');

// Server configuration
const PORT = 8082;
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const MOLECULE_UPDATE_INTERVAL = 500; // 2Hz
const MAX_CLIENTS = 10;

// Mock player data
let mockPlayers = new Map();
let clientConnections = new Map();
let eventHistory = [];
let pingCount = 0;

// Initialize mock players
function initializeMockPlayers() {
    const personalities = ['mediator', 'rock', 'loner', 'fuel', 'messenger', 'builder', 'oracle'];
    const elements = ['H', 'O', 'C', 'Ca', 'N', 'P'];

    for (let i = 0; i < 8; i++) {
        mockPlayers.set(`mock_player_${i}`, {
            id: `mock_player_${i}`,
            molecules: [],
            personality: personalities[Math.floor(Math.random() * personalities.length)],
            lastUpdate: Date.now()
        });
    }

    // Generate initial molecule positions for mock players
    mockPlayers.forEach((player, playerId) => {
        for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) { // 2-4 molecules per player
            const molecule = {
                id: `${playerId}_mol_${j}`,
                x: 200 + Math.random() * 1200,
                y: 150 + Math.random() * 600,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                personality: player.personality,
                element: elements[Math.floor(Math.random() * elements.length)]
            };
            player.molecules.push(molecule);
        }
    });

    console.log(`Initialized ${mockPlayers.size} mock players with ${Array.from(mockPlayers.values()).reduce((sum, p) => sum + p.molecules.length, 0)} molecules`);
}

// Update mock player positions
function updateMockPlayers() {
    mockPlayers.forEach((player, playerId) => {
        player.molecules.forEach(molecule => {
            // Apply some random movement
            molecule.x += molecule.vx;
            molecule.y += molecule.vy;

            // Add some randomness
            molecule.vx += (Math.random() - 0.5) * 0.1;
            molecule.vy += (Math.random() - 0.5) * 0.1;

            // Dampen velocity
            molecule.vx *= 0.98;
            molecule.vy *= 0.98;

            // Boundary wrapping
            if (molecule.x < 0) molecule.x = 1600;
            if (molecule.x > 1600) molecule.x = 0;
            if (molecule.y < 0) molecule.y = 900;
            if (molecule.y > 900) molecule.y = 0;
        });
    });
}

// Broadcast molecule updates to all connected clients
function broadcastMoleculeUpdates() {
    if (clientConnections.size === 0) return;

    // Collect all molecules from mock players
    const allMolecules = [];
    mockPlayers.forEach(player => {
        allMolecules.push(...player.molecules);
    });

    const updateMessage = {
        type: 'moleculeStateUpdate',
        timestamp: Date.now(),
        data: allMolecules
    };

    const messageString = JSON.stringify(updateMessage);

    // Send to all connected clients
    clientConnections.forEach((clientData, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(messageString);
            } catch (error) {
                console.error('Failed to send molecule update:', error);
            }
        }
    });
}

// Handle heartbeat mechanism
function startHeartbeat() {
    setInterval(() => {
        clientConnections.forEach((clientData, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                const heartbeatMessage = {
                    type: 'heartbeat',
                    serverTime: Date.now(),
                    clientCount: clientConnections.size,
                    moleculeCount: Array.from(mockPlayers.values()).reduce((sum, p) => sum + p.molecules.length, 0)
                };

                try {
                    ws.send(JSON.stringify(heartbeatMessage));
                } catch (error) {
                    console.error('Failed to send heartbeat:', error);
                }
            }
        });
    }, HEARTBEAT_INTERVAL);
}

// Handle incoming messages from clients
function handleClientMessage(ws, message, clientData) {
    try {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'heartbeat':
                // Client heartbeat - just log
                console.log(`Heartbeat from ${clientData.id}`);
                break;

            case 'ping':
                // Handle ping from client
                handlePing(ws, data, clientData);
                break;

            default:
                console.log(`Unknown message type from ${clientData.id}:`, data.type);
        }
    } catch (error) {
        console.error(`Failed to parse message from ${clientData.id}:`, error);
    }
}

function handlePing(ws, pingData, clientData) {
    console.log(`Ping from ${clientData.id}: ${pingData.emoji} → ${pingData.targetId}`);

    pingCount++;

    // Create event log entry
    const eventEntry = {
        id: `ping_${pingCount}_${Date.now()}`,
        type: 'ping',
        actorId: clientData.id,
        targetId: pingData.targetId,
        message: `pinged ${pingData.targetId} with ${pingData.emoji}`,
        timestamp: Date.now()
    };

    eventHistory.push(eventEntry);

    // Keep event history limited
    if (eventHistory.length > 50) {
        eventHistory = eventHistory.slice(-50);
    }

    // Broadcast ping to all clients
    const pingBroadcast = {
        type: 'ping',
        data: {
            id: eventEntry.id,
            targetId: pingData.targetId,
            emoji: pingData.emoji,
            position: pingData.position,
            senderId: clientData.id
        }
    };

    clientConnections.forEach((otherClientData, otherWs) => {
        if (otherWs.readyState === WebSocket.OPEN) {
            try {
                otherWs.send(JSON.stringify(pingBroadcast));
            } catch (error) {
                console.error('Failed to broadcast ping:', error);
            }
        }
    });

    // Also broadcast updated event log
    broadcastEventLog();
}

function broadcastEventLog() {
    const eventLogMessage = {
        type: 'eventLog',
        data: eventHistory.slice(-10) // Send last 10 events
    };

    clientConnections.forEach((clientData, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(eventLogMessage));
            } catch (error) {
                console.error('Failed to send event log:', error);
            }
        }
    });
}

// Handle client connections
function handleConnection(ws, request) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientData = { id: clientId, connectedAt: Date.now() };

    clientConnections.set(ws, clientData);
    console.log(`Client connected: ${clientId} (${clientConnections.size} total clients)`);

    // Send initial connection data
    const initMessage = {
        type: 'connectionInit',
        data: {
            clientId: clientId,
            serverTime: Date.now(),
            eventLog: eventHistory.slice(-10),
            molecules: [] // Will be sent in first update cycle
        }
    };

    try {
        ws.send(JSON.stringify(initMessage));
    } catch (error) {
        console.error('Failed to send init message:', error);
    }

    // Handle incoming messages
    ws.on('message', (message) => {
        handleClientMessage(ws, message, clientData);
    });

    // Handle disconnection
    ws.on('close', () => {
        clientConnections.delete(ws);
        console.log(`Client disconnected: ${clientId} (${clientConnections.size} remaining clients)`);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`Client error for ${clientId}:`, error);
        clientConnections.delete(ws);
    });
}

// Start the server
function startServer() {
    const wss = new WebSocket.Server({
        port: PORT,
        perMessageDeflate: false
    });

    console.log(`🚀 BONDING Mock WebSocket Server started on port ${PORT}`);
    console.log(`📊 Simulating ${mockPlayers.size} players with ${Array.from(mockPlayers.values()).reduce((sum, p) => sum + p.molecules.length, 0)} molecules`);
    console.log(`⏰ Updates every ${MOLECULE_UPDATE_INTERVAL}ms (${1000/MOLECULE_UPDATE_INTERVAL}Hz)`);
    console.log('─'.repeat(60));

    // Initialize mock data
    initializeMockPlayers();

    // Start update cycles
    setInterval(updateMockPlayers, MOLECULE_UPDATE_INTERVAL);
    setInterval(broadcastMoleculeUpdates, MOLECULE_UPDATE_INTERVAL);
    startHeartbeat();

    // Handle new connections
    wss.on('connection', handleConnection);

    console.log('\n✅ Server ready - connect from soup-demo.html with WebSocket URL: ws://localhost:8082');
    console.log('📝 Server will simulate multiplayer environment with moving ghost molecules');
    console.log('🔔 Send pings from demo to see social event broadcasting');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down mock server...');
    clientConnections.clear();
    mockPlayers.clear();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Shutting down mock server...');
    clientConnections.clear();
    mockPlayers.clear();
    process.exit(0);
});

// Start the server
startServer();