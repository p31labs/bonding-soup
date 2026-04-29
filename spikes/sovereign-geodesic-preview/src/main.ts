import "./style.css";
import type { GeodesicStateSnapshot } from "./types";

const DEFAULT_WORKER_ORIGIN = "https://geodesic-room.trimtab-signal.workers.dev";

function apiStateUrl(room: string): string {
  const id = encodeURIComponent(room.trim());
  const h = typeof location !== "undefined" ? location.hostname : "";
  const local = h === "localhost" || h === "127.0.0.1";
  if (local) {
    return `/api/geodesic/${id}/state`;
  }
  const origin = import.meta.env.VITE_GEODESIC_ORIGIN || DEFAULT_WORKER_ORIGIN;
  return `${String(origin).replace(/\/$/, "")}/api/geodesic/${id}/state`;
}

function shapeCount(s: GeodesicStateSnapshot): number {
  return s.shapes && typeof s.shapes === "object" ? Object.keys(s.shapes).length : 0;
}

function coherenceHint(s: GeodesicStateSnapshot): number {
  const n = shapeCount(s);
  const rigidBonus = s.rigidity?.rigid ? 0.12 : 0;
  return Math.min(1, Math.max(0, 0.15 + n * 0.02 + rigidBonus));
}

function renderDerived(s: GeodesicStateSnapshot): void {
  const elShapes = document.getElementById("d-shapes");
  const elVer = document.getElementById("d-version");
  const elRigid = document.getElementById("d-rigid");
  const elCoh = document.getElementById("d-coh");
  if (!elShapes || !elVer || !elRigid || !elCoh) return;
  elShapes.textContent = String(shapeCount(s));
  elVer.textContent = String(s.version ?? "—");
  const r = s.rigidity;
  elRigid.textContent = r ? JSON.stringify(r) : "—";
  elCoh.textContent = coherenceHint(s).toFixed(3);
}

async function fetchState(room: string): Promise<GeodesicStateSnapshot> {
  const url = apiStateUrl(room);
  const res = await fetch(url, { credentials: "omit", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as GeodesicStateSnapshot;
}

function main(): void {
  const roomEl = document.getElementById("room") as HTMLInputElement | null;
  const btn = document.getElementById("fetch-once");
  const autoEl = document.getElementById("auto") as HTMLInputElement | null;
  const statusEl = document.getElementById("status");
  const rawEl = document.getElementById("raw");

  if (!roomEl || !btn || !autoEl || !statusEl || !rawEl) return;

  const room = roomEl;
  const status = statusEl;
  const raw = rawEl;
  const auto = autoEl;

  let timer: ReturnType<typeof setInterval> | null = null;

  async function run(label: string): Promise<void> {
    status.textContent = label + "…";
    try {
      const data = await fetchState(room.value || "demo");
      raw.textContent = JSON.stringify(data, null, 2);
      renderDerived(data);
      status.textContent = "OK · " + new Date().toISOString();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      raw.textContent = "—";
      status.textContent = "Error: " + msg;
      if (/Failed to fetch|NetworkError/i.test(msg)) {
        status.textContent +=
          " · Local dev: run `npm run dev` here so /api proxies to the Worker. Direct file open hits CORS.";
      }
    }
  }

  btn.addEventListener("click", () => run("Fetching"));

  auto.addEventListener("change", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (auto.checked) {
      void run("Auto");
      timer = setInterval(() => void run("Auto"), 3000);
    }
  });

  const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
  const qr = q.get("room");
  if (qr) room.value = qr.slice(0, 64);

  void run("Boot");
}

main();
