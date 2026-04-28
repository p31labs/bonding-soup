/**
 * C.A.R.S. mock WebSocket — WCD-32 + family rooms · wire catalog: cars-contract/p31.carsWire.json
 * - room=mock (default): synthetic ghost players (original behavior)
 * - any other ?room=…: only real clients; each sends playerState with molecules
 */
const WebSocket = require('ws');
const { URL } = require('url');

const PORT = parseInt(process.env.MOCK_WS_PORT || '8082', 10) || 8082;
const HEARTBEAT_INTERVAL = 5000;
const MOLECULE_UPDATE_INTERVAL = 500;
const MOCK_ROOM = 'mock';

const clientConnections = new Map(); // ws -> { id, room, displayName, connectedAt }
const rooms = new Map(); // roomId -> Set<ws>

// Mock NPC data (room === mock only)
let mockPlayers = new Map();
let eventHistory = []; // mock room / legacy: kept for any global fallback
const eventLogByRoom = new Map(); // roomId -> entry[]
const MAX_LOG_PER_ROOM = 50;
const MAX_MOLECULES_PER_MSG = 400;
const WORLD_W = 1600;
const WORLD_H = 800;
let pingCount = 0;

function roomClients(room) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  return rooms.get(room);
}

function addClientToRoom(ws, room) {
  roomClients(room).add(ws);
}

function removeClientFromRoom(ws, room) {
  const s = rooms.get(room);
  if (s) {
    s.delete(ws);
    if (s.size === 0) rooms.delete(room);
  }
}

function initMockPlayers() {
  const personalities = ['mediator', 'rock', 'loner', 'fuel', 'messenger', 'builder', 'oracle'];
  const elements = ['H', 'O', 'C', 'Ca', 'N', 'P'];
  mockPlayers = new Map();
  for (let i = 0; i < 8; i++) {
    const pid = `mock_player_${i}`;
    const p = { id: pid, molecules: [], personality: personalities[Math.floor(Math.random() * personalities.length)], lastUpdate: Date.now() };
    for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
      p.molecules.push({
        id: `${pid}_mol_${j}`,
        x: 200 + Math.random() * 1200,
        y: 150 + Math.random() * 600,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        personality: p.personality,
        element: elements[Math.floor(Math.random() * elements.length)],
      });
    }
    mockPlayers.set(pid, p);
  }
}

function updateMockPlayers() {
  mockPlayers.forEach((player) => {
    player.molecules.forEach((molecule) => {
      molecule.x += molecule.vx;
      molecule.y += molecule.vy;
      molecule.vx += (Math.random() - 0.5) * 0.1;
      molecule.vy += (Math.random() - 0.5) * 0.1;
      molecule.vx *= 0.98;
      molecule.vy *= 0.98;
      if (molecule.x < 0) molecule.x = 1600;
      if (molecule.x > 1600) molecule.x = 0;
      if (molecule.y < 0) molecule.y = 900;
      if (molecule.y > 900) molecule.y = 0;
    });
  });
}

// Latest molecules per client in family (non-mock) rooms: room -> Map<clientId, { molecules, displayName }>
const familyPlayerStates = new Map();

function appendEventForRoom(room, eventEntry) {
  if (!eventLogByRoom.has(room)) {
    eventLogByRoom.set(room, []);
  }
  const a = eventLogByRoom.get(room);
  a.push(eventEntry);
  if (a.length > MAX_LOG_PER_ROOM) {
    a.splice(0, a.length - MAX_LOG_PER_ROOM);
  }
}

function tailEventLogForRoom(room) {
  return (eventLogByRoom.get(room) || []).slice(-10);
}

/** Docs + UI (above) stay aligned with this process (below): same port, same commands. */
function localRunbookPayload(port) {
  return {
    echo: 'as-above-so-below',
    port,
    lines: [
      'Static site: from repo root run `npm run demo` — open soup.html (default :8080).',
      `This mock WebSocket: listening on port ${port} (env MOCK_WS_PORT overrides; file default 8082).`,
      'Household play: same ?room=… on your LAN; not public matchmaking.',
    ],
  };
}

/** Other clients in the same room (for presence UI + heartbeats) */
function rosterExcludingSelf(room, selfId) {
  const r = roomClients(room);
  const out = [];
  r.forEach((w) => {
    const cd = clientConnections.get(w);
    if (cd && cd.id !== selfId) {
      out.push({
        id: String(cd.id).slice(0, 64),
        displayName: String(cd.displayName).slice(0, 32),
      });
    }
  });
  out.sort((a, b) => a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id));
  return out;
}

function sanitizeMolecule(m) {
  if (!m || typeof m !== "object") return null;
  const id = m.id != null ? String(m.id).slice(0, 200) : "";
  if (!id) return null;
  let x = Number(m.x);
  let y = Number(m.y);
  let vx = Number(m.vx);
  let vy = Number(m.vy);
  if (!Number.isFinite(x)) x = 0;
  if (!Number.isFinite(y)) y = 0;
  if (!Number.isFinite(vx)) vx = 0;
  if (!Number.isFinite(vy)) vy = 0;
  x = Math.max(0, Math.min(WORLD_W, x));
  y = Math.max(0, Math.min(WORLD_H, y));
  return {
    id,
    x,
    y,
    vx,
    vy,
    personality: typeof m.personality === "string" ? m.personality.slice(0, 32) : "mediator",
    element: typeof m.element === "string" ? m.element.slice(0, 8) : "O",
  };
}

function allMockMolecules() {
  const all = [];
  mockPlayers.forEach((player) => {
    all.push(...player.molecules);
  });
  return all;
}

/** Broadcast mock NPCs to every client in mock room */
function broadcastMockRoom() {
  const r = roomClients(MOCK_ROOM);
  if (r.size === 0) return;
  const updateMessage = { type: 'moleculeStateUpdate', timestamp: Date.now(), data: allMockMolecules() };
  const messageString = JSON.stringify(updateMessage);
  r.forEach((other) => {
    if (other.readyState === WebSocket.OPEN) {
      try { other.send(messageString); } catch (e) { console.error(e); }
    }
  });
}

/** Each client in family room gets *others'* molecules with prefixed ids */
function broadcastFamilyRoom(room) {
  const r = roomClients(room);
  if (r.size === 0) return;
  const byClient = familyPlayerStates.get(room);
  if (!byClient) return;

  r.forEach((otherWs) => {
    const self = clientConnections.get(otherWs);
    if (!self) return;
    const merged = [];
    byClient.forEach((payload, clientId) => {
      if (clientId === self.id) return;
      (payload.molecules || []).forEach((m) => {
        merged.push({ ...m, id: `${clientId}/${m.id}` });
      });
    });
    const msg = JSON.stringify({
      type: 'moleculeStateUpdate',
      timestamp: Date.now(),
      data: { fullSnapshot: true, molecules: merged },
    });
    if (otherWs.readyState === WebSocket.OPEN) {
      try { otherWs.send(msg); } catch (e) { console.error(e); }
    }
  });
}

function broadcastMoleculeUpdates() {
  broadcastMockRoom();
  for (const room of familyPlayerStates.keys()) {
    if (room === MOCK_ROOM) continue;
    broadcastFamilyRoom(room);
  }
}

function startHeartbeat() {
  setInterval(() => {
    clientConnections.forEach((clientData, ws) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const room = clientData.room;
      const inRoom = roomClients(room);
      const n = inRoom ? inRoom.size : 0;
      const others = n > 0 ? n - 1 : 0;
      let familyMol = 0;
      if (room !== MOCK_ROOM) {
        const by = familyPlayerStates.get(room);
        if (by) {
          by.forEach((pl, cid) => {
            if (cid === clientData.id) return;
            familyMol += (pl.molecules && pl.molecules.length) || 0;
          });
        }
      }
      const heartbeatMessage = {
        type: 'heartbeat',
        serverTime: Date.now(),
        clientCount: n,
        /** Other clients in the same room (not counting self) */
        peerCount: others,
        moleculeCount: room === MOCK_ROOM
          ? allMockMolecules().length
          : familyMol,
        room,
        roster: rosterExcludingSelf(room, clientData.id),
      };
      try { ws.send(JSON.stringify(heartbeatMessage)); } catch (e) { console.error(e); }
    });
  }, HEARTBEAT_INTERVAL);
}

function handleClientMessage(ws, message, clientData) {
  let data;
  try { data = JSON.parse(message); } catch { return; }

  const room = clientData.room;
  if (data.type === 'playerState' && room !== MOCK_ROOM) {
    if (!familyPlayerStates.has(room)) familyPlayerStates.set(room, new Map());
    const raw = Array.isArray(data.molecules) ? data.molecules : [];
    const molecules = raw
      .slice(0, MAX_MOLECULES_PER_MSG)
      .map(sanitizeMolecule)
      .filter(Boolean);
    familyPlayerStates.get(room).set(clientData.id, {
      molecules,
      displayName: clientData.displayName,
    });
    broadcastFamilyRoom(room);
    return;
  }

  switch (data.type) {
    case 'heartbeat':
      break;
    case 'ping': handlePing(ws, data, clientData, room);
      break;
    default: break;
  }
}

function handlePing(ws, pingData, clientData, room) {
  pingCount++;
  const eventEntry = {
    id: `ping_${pingCount}_${Date.now()}`,
    type: 'ping',
    actorId: clientData.id,
    targetId: pingData.targetId,
    message: `pinged ${pingData.targetId} with ${pingData.emoji}`,
    timestamp: Date.now(),
  };
  eventHistory.push(eventEntry);
  if (eventHistory.length > 50) eventHistory = eventHistory.slice(-50);
  appendEventForRoom(room, eventEntry);

  const pingBroadcast = { type: 'ping', data: { id: eventEntry.id, targetId: pingData.targetId, emoji: pingData.emoji, position: pingData.position, senderId: clientData.id } };
  const ps = JSON.stringify(pingBroadcast);
  const r = roomClients(room);
  r.forEach((otherWs) => {
    if (otherWs !== ws && otherWs.readyState === WebSocket.OPEN) {
      try { otherWs.send(ps); } catch (e) { console.error(e); }
    }
  });
  broadcastEventLog(room);
}

function broadcastEventLog(room) {
  const r = roomClients(room);
  const eventLogMessage = { type: 'eventLog', data: tailEventLogForRoom(room) };
  const s = JSON.stringify(eventLogMessage);
  r.forEach((other) => { if (other.readyState === WebSocket.OPEN) { try { other.send(s); } catch (e) { console.error(e); } } });
}

function endClientSession(ws, clientId) {
  const cd = clientConnections.get(ws);
  if (!cd) {
    return;
  }
  clientConnections.delete(ws);
  removeClientFromRoom(ws, cd.room);
  if (cd.room !== MOCK_ROOM && familyPlayerStates.has(cd.room)) {
    const m = familyPlayerStates.get(cd.room);
    m.delete(cd.id);
    if (m.size === 0) {
      familyPlayerStates.delete(cd.room);
    } else {
      broadcastFamilyRoom(cd.room);
    }
  }
  console.log(`Client session ended: ${clientId} (${clientConnections.size} total)`);
}

function handleConnection(ws, request) {
  let room = MOCK_ROOM;
  let displayName = 'player';
  try {
    const u = new URL(request.url || '/', 'http://localhost');
    if (u.searchParams.get('room')) room = u.searchParams.get('room').slice(0, 64) || MOCK_ROOM;
    if (u.searchParams.get('name')) displayName = u.searchParams.get('name').slice(0, 32) || 'player';
  } catch (e) { /* default */ }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const clientData = { id: clientId, room, displayName, connectedAt: Date.now() };
  clientConnections.set(ws, clientData);
  addClientToRoom(ws, room);

  console.log(`Client ${clientId} joined room "${room}" as "${displayName}" (total: ${roomClients(room).size})`);

  if (room !== MOCK_ROOM && !familyPlayerStates.has(room)) familyPlayerStates.set(room, new Map());

  const initMessage = {
    type: 'connectionInit',
    data: {
      clientId,
      serverTime: Date.now(),
      eventLog: tailEventLogForRoom(room),
      room,
      displayName,
      molecules: [],
      roster: rosterExcludingSelf(room, clientId),
      localRunbook: localRunbookPayload(PORT),
    },
  };
  try { ws.send(JSON.stringify(initMessage)); } catch (e) { console.error(e); }

  ws.on('message', (message) => handleClientMessage(ws, message, clientData));
  ws.on('close', () => {
    endClientSession(ws, clientId);
  });
  ws.on('error', () => {
    endClientSession(ws, clientId);
  });
}

function startServer() {
  const wss = new WebSocket.Server({ port: PORT, perMessageDeflate: false });
  initMockPlayers();
  setInterval(updateMockPlayers, MOLECULE_UPDATE_INTERVAL);
  setInterval(broadcastMoleculeUpdates, MOLECULE_UPDATE_INTERVAL);
  startHeartbeat();
  wss.on('connection', handleConnection);
  console.log(`C.A.R.S. mock WS on :${PORT}`);
  console.log(`  room=${MOCK_ROOM} (or omit): synthetic + NPC molecules`);
  console.log('  ?room=your-house-phrase&name=Initials : family sync (no NPCs)');
  console.log('  e.g. soup.html?ws=ws://localhost:8082&room=kitchen&name=SJ');
  const rb = localRunbookPayload(PORT);
  console.log('');
  console.log('— as above (README / connectionInit.localRunbook) · so below (this PID) —');
  rb.lines.forEach((line) => {
    console.log('  ·', line);
  });
}
startServer();
