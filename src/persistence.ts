/**
 * BONDING Persistence Layer (WCD-33)
 * Molecular heritage and global archive system
 */
import { getBondingArchiveUrl } from './archiveConfig';
import type { Atom, Bond } from './soupPhysics';

export interface SavedMolecule {
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
  personality: string;
  creationTime: number;
  emotionalContext: string;
  zone: string;
  creator: string;
  significance: number; // 0-1 scale of emotional importance
  heritage?: HeritageRecord[]; // Molecular ancestry
  generation?: number; // Generation number in heritage chain
}

export interface HeritageRecord {
  parentId: string;
  reactionType: string;
  timestamp: number;
  emotionalContext: string;
}

/** Sanitized highlight record from GET /api/archive (WCD-33 Worker) */
export interface RemoteArchiveRow {
  id: string;
  name: string;
  elementTally: Record<string, number>;
  personality: string;
  zone: string;
  emotionalContext: string;
  significance: number;
  creationTime: number;
  generation?: number;
  creatorLabel: string;
}

export interface GlobalArchive {
  posnerMolecules: SavedMolecule[];
  communityHighlights: SavedMolecule[];
  totalSyntheses: number;
  lastUpdate: number;
  heritageChains: Map<string, HeritageRecord[]>; // moleculeId -> heritage records
  /** Community-wide count from the WCD-33 Worker (last successful sync) */
  communitySynthesisServerTotal?: number;
  communityServerLastUpdate?: number;
}

export class PersistenceLayer {
  private savedMolecules: Map<string, SavedMolecule> = new Map();
  private globalArchive: GlobalArchive = {
    posnerMolecules: [],
    communityHighlights: [],
    totalSyntheses: 0,
    lastUpdate: Date.now(),
    heritageChains: new Map()
  };

  /** Syntheses to POST on next sync to the community archive (local lab counter stays in totalSyntheses) */
  private synthesesSinceLastPost = 0;

  constructor() {
    this.loadFromStorage();
    this.loadGlobalArchive();
  }

  /**
   * Save a molecule with emotional context and heritage
   */
  saveMolecule(moleculeData: {
    id: string;
    atoms: Atom[];
    bonds: Bond[];
    personality: string;
    zone: string;
    emotionalContext?: string;
    significance?: number;
    parentIds?: string[]; // IDs of parent molecules
    reactionType?: string; // Type of reaction that created this molecule
  }): string {
    // Track molecular heritage
    const heritage: HeritageRecord[] = [];
    let generation = 0;

    if (moleculeData.parentIds && moleculeData.reactionType) {
      for (const parentId of moleculeData.parentIds) {
        const parent = this.savedMolecules.get(parentId);
        if (parent) {
          heritage.push({
            parentId,
            reactionType: moleculeData.reactionType,
            timestamp: Date.now(),
            emotionalContext: moleculeData.emotionalContext || 'Molecular transformation'
          });
          generation = Math.max(generation, (parent.generation || 0) + 1);
        }
      }
      // Update global heritage chains
      this.globalArchive.heritageChains.set(moleculeData.id, heritage);
    }

    const savedMolecule: SavedMolecule = {
      id: moleculeData.id,
      name: this.generateMoleculeName(moleculeData),
      atoms: moleculeData.atoms,
      bonds: moleculeData.bonds,
      personality: moleculeData.personality,
      creationTime: Date.now(),
      emotionalContext: moleculeData.emotionalContext || 'A molecule of significance',
      zone: moleculeData.zone,
      creator: this.getCurrentUser(),
      significance: moleculeData.significance || 0.5,
      heritage: heritage.length > 0 ? heritage : undefined,
      generation
    };

    this.savedMolecules.set(savedMolecule.id, savedMolecule);
    this.saveToStorage();

    // Check if this is a Posner molecule or community highlight
    if (this.isPosnerMolecule(savedMolecule)) {
      this.addToGlobalArchive(savedMolecule, 'posner');
    } else if (savedMolecule.significance > 0.8) {
      this.addToGlobalArchive(savedMolecule, 'highlight');
    }

    console.log(`💾 Molecule saved: ${savedMolecule.name} (${savedMolecule.emotionalContext})`);
    return savedMolecule.id;
  }

  /**
   * Load a saved molecule
   */
  loadMolecule(id: string): SavedMolecule | null {
    return this.savedMolecules.get(id) || null;
  }

  /**
   * Get all saved molecules
   */
  getSavedMolecules(): SavedMolecule[] {
    return Array.from(this.savedMolecules.values()).sort((a, b) => b.significance - a.significance);
  }

  /**
   * Delete a saved molecule
   */
  deleteMolecule(id: string): boolean {
    const deleted = this.savedMolecules.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Get global archive data
   */
  getGlobalArchive(): GlobalArchive {
    return this.globalArchive;
  }

  /**
   * Check if molecule is a Posner structure
   */
  private isPosnerMolecule(molecule: SavedMolecule): boolean {
    // Simple check for calcium phosphate structure
    const calciumCount = molecule.atoms.filter(atom => atom.element === 'Ca').length;
    const phosphorusCount = molecule.atoms.filter(atom => atom.element === 'P').length;
    const oxygenCount = molecule.atoms.filter(atom => atom.element === 'O').length;

    // Posner molecule: Ca9(PO4)6 = 9 Ca, 6 P, 24 O = 39 atoms total
    return calciumCount >= 9 && phosphorusCount >= 6 && oxygenCount >= 24;
  }

  /**
   * Add molecule to global archive
   */
  private addToGlobalArchive(molecule: SavedMolecule, type: 'posner' | 'highlight'): void {
    if (type === 'posner') {
      this.globalArchive.posnerMolecules.push(molecule);
      // Keep only most recent Posner molecules
      if (this.globalArchive.posnerMolecules.length > 10) {
        this.globalArchive.posnerMolecules = this.globalArchive.posnerMolecules.slice(-10);
      }
    } else {
      this.globalArchive.communityHighlights.push(molecule);
      // Keep only top 20 highlights
      if (this.globalArchive.communityHighlights.length > 20) {
        this.globalArchive.communityHighlights.sort((a, b) => b.significance - a.significance);
        this.globalArchive.communityHighlights = this.globalArchive.communityHighlights.slice(0, 20);
      }
    }

    this.globalArchive.lastUpdate = Date.now();
    this.saveGlobalArchive();
    void this.pushToRemoteArchive(molecule, type);
  }

  /**
   * Record a synthesis event
   */
  recordSynthesis(): void {
    this.globalArchive.totalSyntheses++;
    this.synthesesSinceLastPost++;
    this.saveGlobalArchive();
  }

  /**
   * Generate a meaningful name for a molecule
   */
  private generateMoleculeName(moleculeData: { atoms: Atom[]; personality?: string; zone?: string }): string {
    const elements = moleculeData.atoms.map((atom: Atom) => atom.element);
    const uniqueElements = [...new Set(elements)];
    const personality = moleculeData.personality || 'fuel';
    const zone = moleculeData.zone || 'open';

    // Create meaningful names based on composition and context
    if (uniqueElements.includes('Ca') && uniqueElements.includes('P')) {
      return 'Crystal of Stability';
    }
    if (uniqueElements.includes('H') && uniqueElements.includes('O')) {
      return personality === 'mediator' ? 'Tear of Understanding' : 'Drop of Emotion';
    }
    if (zone === 'calm') {
      return 'Breath of Peace';
    }
    if (zone === 'deep') {
      return 'Echo of Depth';
    }

    // Default naming
    return `${personality.charAt(0).toUpperCase() + personality.slice(1)} Essence`;
  }

  /**
   * Get current user (placeholder for real authentication)
   */
  private getCurrentUser(): string {
    // In a real implementation, this would come from authentication
    return localStorage.getItem('bonding-user') || 'Anonymous Explorer';
  }

  /**
   * Save molecules to local storage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.savedMolecules.entries());
      localStorage.setItem('bonding-saved-molecules', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save molecules to localStorage:', error);
    }
  }

  /**
   * Load molecules from local storage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('bonding-saved-molecules');
      if (data) {
        const parsed = JSON.parse(data);
        this.savedMolecules = new Map(parsed);
        console.log(`Loaded ${this.savedMolecules.size} saved molecules`);
      }
    } catch (error) {
      console.warn('Failed to load molecules from localStorage:', error);
    }
  }

  /**
   * Save global archive to local storage (in real implementation, this would be server-side)
   */
  private saveGlobalArchive(): void {
    try {
      // Convert Map to serializable object
      const archiveData = {
        ...this.globalArchive,
        heritageChains: Object.fromEntries(this.globalArchive.heritageChains)
      };
      localStorage.setItem('bonding-global-archive', JSON.stringify(archiveData));
    } catch (error) {
      console.warn('Failed to save global archive:', error);
    }
  }

  /**
   * Load global archive from local storage
   */
  private loadGlobalArchive(): void {
    try {
      const data = localStorage.getItem('bonding-global-archive');
      if (data) {
        const parsed = JSON.parse(data);
        // Convert heritageChains back to Map
        this.globalArchive = {
          ...parsed,
          heritageChains: new Map(Object.entries(parsed.heritageChains || {}))
        };
        console.log(`Loaded global archive: ${this.globalArchive.posnerMolecules.length} Posners, ${this.globalArchive.communityHighlights.length} highlights, ${this.globalArchive.heritageChains.size} heritage chains`);
      }
    } catch (error) {
      console.warn('Failed to load global archive:', error);
    }
  }

  /**
   * Get molecular heritage chain
   */
  getMolecularHeritage(moleculeId: string): HeritageRecord[] {
    return this.globalArchive.heritageChains.get(moleculeId) || [];
  }

  /**
   * Get molecules by generation
   */
  getMoleculesByGeneration(generation: number): SavedMolecule[] {
    return Array.from(this.savedMolecules.values())
      .filter(m => m.generation === generation)
      .sort((a, b) => b.significance - a.significance);
  }

  private elementTallyFromAtoms(atoms: { element?: string }[]): Record<string, number> {
    const t: Record<string, number> = {};
    for (const a of atoms) {
      const el = a && a.element != null ? String(a.element) : 'X';
      t[el] = (t[el] || 0) + 1;
    }
    return t;
  }

  private tallyToPlaceholderAtoms(tally: Record<string, number>): Atom[] {
    const atoms: Atom[] = [];
    let n = 0;
    for (const [el, c] of Object.entries(tally)) {
      const count = Math.min(Math.floor(c), 5000);
      for (let i = 0; i < count; i++) {
        atoms.push({
          id: `arch-${n++}`, element: el, x: 0, y: 0,
          vx: 0, vy: 0, color: '#888', radius: 4, mass: 1, charge: 0,
        });
      }
    }
    return atoms;
  }

  private remoteRowToSaved(r: RemoteArchiveRow): SavedMolecule {
    return {
      id: r.id,
      name: r.name,
      atoms: this.tallyToPlaceholderAtoms(r.elementTally),
      bonds: [],
      personality: r.personality,
      creationTime: r.creationTime,
      emotionalContext: r.emotionalContext,
      zone: r.zone,
      creator: r.creatorLabel,
      significance: r.significance,
      generation: r.generation
    };
  }

  private isRemoteRow(x: unknown): x is RemoteArchiveRow {
    if (x === null || typeof x !== 'object') return false;
    const o = x as Record<string, unknown>;
    return (
      typeof o.id === 'string' &&
      typeof o.name === 'string' &&
      o.elementTally != null && typeof o.elementTally === 'object' &&
      typeof o.personality === 'string' &&
      typeof o.zone === 'string' &&
      typeof o.emotionalContext === 'string' &&
      typeof o.significance === 'number' &&
      typeof o.creationTime === 'number' &&
      (o.generation === undefined || typeof o.generation === 'number') &&
      typeof o.creatorLabel === 'string'
    );
  }

  private warnArchiveResponse(status: number, context: string): void {
    if (status === 429) {
      console.warn(`WCD-33 ${context}: rate limited (429) — try again in ~1 minute.`);
    } else if (status === 403) {
      console.warn(
        `WCD-33 ${context}: origin not allowed (403) — set Worker ARCHIVE_CORS_ALLOW to this page’s origin, or use same origin as the game.`
      );
    } else {
      console.warn(`WCD-33 ${context}: rejected`, status);
    }
  }

  private async pushToRemoteArchive(molecule: SavedMolecule, type: 'posner' | 'highlight'): Promise<void> {
    const base = getBondingArchiveUrl();
    if (!base) return;
    const body = {
      id: molecule.id,
      name: molecule.name,
      elementTally: this.elementTallyFromAtoms(molecule.atoms),
      personality: molecule.personality,
      zone: molecule.zone,
      emotionalContext: molecule.emotionalContext,
      significance: molecule.significance,
      creationTime: molecule.creationTime,
      generation: molecule.generation,
      kind: type,
      creatorLabel: (molecule.creator || 'Anonymous').slice(0, 40)
    };
    try {
      const res = await fetch(`${base}/api/highlight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        this.warnArchiveResponse(res.status, 'POST /api/highlight');
      }
    } catch (e) {
      console.warn('WCD-33 highlight push: network or CORS error; local state is fine.', e);
    }
  }

  /**
   * Sync with the WCD-33 global archive Worker (read community lists + post synthesis delta).
   * No remote URL: no-op; local sim continues unchanged.
   */
  async syncGlobalArchive(): Promise<void> {
    const base = getBondingArchiveUrl();
    if (!base) {
      return;
    }

    try {
      if (this.synthesesSinceLastPost > 0) {
        const n = this.synthesesSinceLastPost;
        const r = await fetch(`${base}/api/synthesis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ increment: n })
        });
        if (r.ok) {
          this.synthesesSinceLastPost = 0;
        } else if (r.status === 429 || r.status === 403) {
          this.warnArchiveResponse(r.status, 'POST /api/synthesis');
        }
      }

      const res = await fetch(`${base}/api/archive`);
      if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
          this.warnArchiveResponse(res.status, 'GET /api/archive');
        } else {
          console.warn('Global archive fetch failed', res.status);
        }
        return;
      }
      const data = (await res.json()) as {
        totalSyntheses?: unknown;
        lastUpdate?: unknown;
        communityHighlights?: unknown;
        posnerMolecules?: unknown;
      };

      if (typeof data.totalSyntheses === 'number' && Number.isFinite(data.totalSyntheses)) {
        this.globalArchive.communitySynthesisServerTotal = data.totalSyntheses;
      }
      if (typeof data.lastUpdate === 'number' && Number.isFinite(data.lastUpdate)) {
        this.globalArchive.communityServerLastUpdate = data.lastUpdate;
      }

      const ch: SavedMolecule[] = [];
      if (Array.isArray(data.communityHighlights)) {
        for (const row of data.communityHighlights) {
          if (this.isRemoteRow(row)) ch.push(this.remoteRowToSaved(row));
        }
      }
      const pm: SavedMolecule[] = [];
      if (Array.isArray(data.posnerMolecules)) {
        for (const row of data.posnerMolecules) {
          if (this.isRemoteRow(row)) pm.push(this.remoteRowToSaved(row));
        }
      }

      this.globalArchive.communityHighlights = ch;
      this.globalArchive.posnerMolecules = pm;
      this.globalArchive.lastUpdate = Date.now();
      this.saveGlobalArchive();
      console.log('Global archive synced (WCD-33)');
    } catch (e) {
      console.warn('Global archive sync failed (network); local state preserved', e);
    }
  }

  /**
   * Get persistence statistics
   */
  getStats(): {
    savedMolecules: number;
    posnerMolecules: number;
    communityHighlights: number;
    totalSyntheses: number;
    totalHeritageChains: number;
    communitySynthesisPulse: number;
  } {
    return {
      savedMolecules: this.savedMolecules.size,
      posnerMolecules: this.globalArchive.posnerMolecules.length,
      communityHighlights: this.globalArchive.communityHighlights.length,
      totalSyntheses: this.globalArchive.totalSyntheses,
      totalHeritageChains: this.globalArchive.heritageChains.size,
      communitySynthesisPulse: this.globalArchive.communitySynthesisServerTotal ?? 0
    };
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.PersistenceLayer = PersistenceLayer;
}