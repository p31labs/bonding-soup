/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEODESIC_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
