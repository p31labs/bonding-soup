#!/usr/bin/env node
/**
 * Static replay: JSON fixtures must match GeodesicClientMessage / GeodesicServerMessage shapes
 * (packages/shared/src/geodesic-room-wire.ts). No Worker, no WebSocket.
 *
 * Skip: missing fixture file, P31_SKIP_GEODESIC_WIRE_FIXTURES=1.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_WIRE = "p31.geodesicRoomWire/0.2.2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fixturePath = path.join(__dirname, "fixtures", "geodesic-room-wire-messages.json");

const V = new Set(["v0", "v1", "v2", "v3"]);
const SHAPE_TYPES = new Set(["tet", "oct", "ico", "cube"]);
const OP_TYPES = new Set([
  "SET_VERTEX",
  "ADD_SHAPE",
  "MOVE_SHAPE",
  "REMOVE_SHAPE",
  "RESET_SHAPES",
  "ADD_STRUT",
  "REMOVE_STRUT",
]);
const ERR_CODES = new Set(["SHAPE_CAP", "STRUT_CAP"]);

function die(msg) {
  console.error("verify-geodesic-wire-fixtures:", msg);
  process.exit(1);
}

function need(obj, keys, ctx) {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null) die(`${ctx}: missing ${k}`);
  }
}

function checkVertexPos(p, ctx) {
  need(p, ["x", "y", "z", "label"], ctx);
  for (const k of ["x", "y", "z"]) {
    if (typeof p[k] !== "number") die(`${ctx}: ${k} must be number`);
  }
  if (typeof p.label !== "string") die(`${ctx}: label must be string`);
}

function checkVertices(state, ctx) {
  if (typeof state !== "object" || state === null) die(`${ctx}: state object`);
  for (const id of V) {
    if (!state[id]) die(`${ctx}: missing vertex ${id}`);
    checkVertexPos(state[id], `${ctx}.${id}`);
  }
}

function checkRigidity(r, ctx) {
  need(r, ["V", "E", "F", "rigid", "m"], ctx);
  for (const k of ["V", "E", "F", "m"]) {
    if (typeof r[k] !== "number") die(`${ctx}: rigidity.${k} must be number`);
  }
  if (typeof r.rigid !== "boolean") die(`${ctx}: rigidity.rigid must be boolean`);
}

function validateClient(m, i) {
  const ctx = `clientMessages[${i}]`;
  if (!m || typeof m.type !== "string") die(`${ctx}: type required`);
  switch (m.type) {
    case "SET_VERTEX":
      need(m, ["id", "x", "y", "z"], ctx);
      if (!V.has(m.id)) die(`${ctx}: bad vertex id`);
      break;
    case "ADD_SHAPE":
      need(m, ["shapeId", "shapeType", "x", "y", "z"], ctx);
      if (!SHAPE_TYPES.has(m.shapeType)) die(`${ctx}: bad shapeType`);
      break;
    case "MOVE_SHAPE":
      need(m, ["shapeId", "x", "y", "z"], ctx);
      break;
    case "REMOVE_SHAPE":
      need(m, ["shapeId"], ctx);
      break;
    case "RESET_SHAPES":
      break;
    case "ADD_STRUT":
      need(m, ["strutId", "aShape", "aVi", "bShape", "bVi"], ctx);
      for (const k of ["aVi", "bVi"]) {
        if (typeof m[k] !== "number") die(`${ctx}: ${k} must be number`);
      }
      break;
    case "REMOVE_STRUT":
      need(m, ["strutId"], ctx);
      break;
    case "RESET":
    case "ping":
      break;
    default:
      die(`${ctx}: unknown type ${m.type}`);
  }
}

function validateServer(m, i) {
  const ctx = `serverMessages[${i}]`;
  if (!m || typeof m.type !== "string") die(`${ctx}: type required`);
  switch (m.type) {
    case "hello":
      need(m, ["state", "shapes", "struts", "version", "clientId", "rigidity"], ctx);
      checkVertices(m.state, ctx);
      if (typeof m.shapes !== "object" || m.shapes === null) die(`${ctx}: shapes`);
      if (typeof m.struts !== "object" || m.struts === null) die(`${ctx}: struts`);
      if (typeof m.version !== "number") die(`${ctx}: version`);
      if (typeof m.clientId !== "string") die(`${ctx}: clientId`);
      checkRigidity(m.rigidity, ctx);
      break;
    case "op": {
      need(m, ["op"], ctx);
      const op = m.op;
      if (!op || typeof op !== "object") die(`${ctx}: op object`);
      need(op, ["type", "version", "ts", "clientId"], ctx + ".op");
      if (!OP_TYPES.has(op.type)) die(`${ctx}: bad op.type`);
      if (typeof op.version !== "number" || typeof op.ts !== "number") die(`${ctx}: op version/ts`);
      if (typeof op.clientId !== "string") die(`${ctx}: op.clientId`);
      if (op.type === "SET_VERTEX") {
        need(op, ["id", "x", "y", "z"], ctx + ".op");
        if (!V.has(op.id)) die(`${ctx}: op SET_VERTEX id`);
      } else if (op.type === "ADD_SHAPE") {
        need(op, ["shapeId", "shapeType", "x", "y", "z"], ctx + ".op");
        if (!SHAPE_TYPES.has(op.shapeType)) die(`${ctx}: op ADD_SHAPE shapeType`);
      } else if (op.type === "MOVE_SHAPE") {
        need(op, ["shapeId", "x", "y", "z"], ctx + ".op");
      } else if (op.type === "REMOVE_SHAPE") {
        need(op, ["shapeId"], ctx + ".op");
      } else if (op.type === "ADD_STRUT") {
        need(op, ["strutId", "aShape", "aVi", "bShape", "bVi"], ctx + ".op");
      } else if (op.type === "REMOVE_STRUT") {
        need(op, ["strutId"], ctx + ".op");
      }
      if (op.rigidity !== undefined) checkRigidity(op.rigidity, ctx + ".op.rigidity");
      break;
    }
    case "reset":
      need(m, ["state", "version", "ts"], ctx);
      checkVertices(m.state, ctx);
      if (typeof m.version !== "number" || typeof m.ts !== "number") die(`${ctx}: version/ts`);
      break;
    case "joined":
    case "left":
      need(m, ["clientId", "ts"], ctx);
      break;
    case "pong":
      need(m, ["ts"], ctx);
      if (typeof m.ts !== "number") die(`${ctx}: ts`);
      break;
    case "error":
      need(m, ["code", "max"], ctx);
      if (!ERR_CODES.has(m.code)) die(`${ctx}: bad error code`);
      if (typeof m.max !== "number") die(`${ctx}: max`);
      break;
    default:
      die(`${ctx}: unknown type ${m.type}`);
  }
}

function main() {
  if (process.env.P31_SKIP_GEODESIC_WIRE_FIXTURES === "1") {
    console.log("verify-geodesic-wire-fixtures: skip — P31_SKIP_GEODESIC_WIRE_FIXTURES=1");
    return;
  }
  if (!fs.existsSync(fixturePath)) {
    console.log("verify-geodesic-wire-fixtures: skip — no fixture file");
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  } catch (e) {
    die(`parse: ${e instanceof Error ? e.message : e}`);
  }

  if (data.schema !== "p31.geodesicRoomWire.fixtures/1.0.0") {
    die(`fixture schema mismatch (got ${data.schema})`);
  }
  if (data.wireSchema !== EXPECTED_WIRE) {
    die(`fixture wireSchema must be ${EXPECTED_WIRE} (got ${data.wireSchema}) — update fixture + shared/worker together`);
  }

  const cm = data.clientMessages;
  const sm = data.serverMessages;
  if (!Array.isArray(cm) || cm.length < 5) die("clientMessages[] required");
  if (!Array.isArray(sm) || sm.length < 5) die("serverMessages[] required");

  cm.forEach(validateClient);
  sm.forEach(validateServer);

  console.log(
    "verify-geodesic-wire-fixtures: OK —",
    cm.length,
    "client +",
    sm.length,
    "server samples @",
    EXPECTED_WIRE
  );
}

main();
