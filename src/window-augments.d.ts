interface TutorialSystemConstructor {
  new (soup: unknown): unknown;
}

interface SoupDemoObject {
  soup: unknown;
  createWaterMolecule: (x: number, y: number) => unknown;
  createHydrocarbonMolecule: (x: number, y: number) => unknown;
  createCalciumOxideMolecule: (x: number, y: number) => unknown;
  initializeSynthesisDemo: () => void;
}

interface MemoryPanelConstructor {
  new (soup: import('./soup').SoupEngine): unknown;
}

interface PerformanceDashboardConstructor {
  new (canvas: HTMLCanvasElement): unknown;
}

interface PersistenceLayerConstructor {
  new (): unknown;
}

declare global {
  interface Window {
    TutorialSystem: TutorialSystemConstructor;
    SoupDemo: SoupDemoObject;
    PersistenceLayer: PersistenceLayerConstructor;
    PerformanceDashboard: PerformanceDashboardConstructor;
    MemoryPanel: MemoryPanelConstructor;
    webkitAudioContext: typeof AudioContext;
  }
}

export {};
