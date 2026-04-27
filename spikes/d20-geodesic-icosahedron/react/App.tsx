import { useState } from "react";
import GeodesicSeal from "./GeodesicSeal";
import { HolographicD20 } from "./HolographicD20";

export default function App() {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12 md:flex-row md:items-start md:justify-center">
      <section className="flex flex-col items-center gap-4">
        <h1 className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-500/80">
          Natural 20 seal
        </h1>
        <GeodesicSeal />
      </section>
      <section className="flex flex-col items-center gap-4">
        <h1 className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-500/80">
          Holographic D20
        </h1>
        <HolographicD20 activeId={activeId} onSelect={setActiveId} />
        {activeId != null ? (
          <p className="font-mono text-sm text-white/60">Face {activeId} selected</p>
        ) : null}
      </section>
    </main>
  );
}
