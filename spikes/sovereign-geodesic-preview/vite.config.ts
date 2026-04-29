import { defineConfig } from "vite";

/**
 * Proxy /api → geodesic-room Worker so browser fetch from dev/preview origin avoids CORS.
 * Override: GEODESIC_ROOM_ORIGIN=https://other.workers.dev npm run dev
 */
const GEODESIC_ROOM_ORIGIN =
  process.env.GEODESIC_ROOM_ORIGIN || "https://geodesic-room.trimtab-signal.workers.dev";

export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: GEODESIC_ROOM_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 5174,
    proxy: {
      "/api": {
        target: GEODESIC_ROOM_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
