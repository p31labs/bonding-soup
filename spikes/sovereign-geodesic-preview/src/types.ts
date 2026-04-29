/**
 * Minimal snapshot shape for GET /api/geodesic/:room/state.
 * Canonical when monorepo present: mirror `GeodesicRoomStateSnapshot` from
 * `andromeda/04_SOFTWARE/packages/shared/src/geodesic-room-wire.ts` — bump fields when wire changes.
 *
 * Live sample (2026): vertices v0–v3 + labels; shapes map; version; connections; rigidity {V,E,F,rigid}.
 */
export interface VertexEntry {
  x: number;
  y: number;
  z: number;
  label?: string;
}

export interface RigidityTelemetry {
  V: number;
  E: number;
  F: number;
  rigid: boolean;
}

export interface GeodesicStateSnapshot {
  vertices: Record<string, VertexEntry>;
  shapes: Record<string, unknown>;
  version: number;
  connections?: number;
  rigidity?: RigidityTelemetry;
}
