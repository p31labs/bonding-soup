import type { Atom, Bond } from './soupPhysics';
import type { SoupEngine } from './soup';

interface Molecule {
  id: string;
  name: string;
  emotionalContext: string;
  atoms: Atom[];
  bonds: Bond[];
  personality: string;
  zone: string;
  creationTime: number;
  significance: number;
  heritage?: HeritageRecord[];
  generation?: number;
}

interface HeritageRecord {
  parentId: string;
  reactionType: string;
  timestamp: number;
  emotionalContext: string;
}

class MemoryPanel {
  private panelElement: HTMLElement | null = null;
  private isVisible = false;

  constructor(private soup: SoupEngine) {
    this.createPanel();
  }

  private createPanel() {
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'memory-panel';
    this.panelElement.classList.add('soup-memory-panel');
    this.panelElement.setAttribute('role', 'dialog');
    this.panelElement.setAttribute('aria-labelledby', 'memory-panel-title');
    this.panelElement.setAttribute('aria-hidden', 'true');
    this.panelElement.hidden = true;

    // Header
    const header = document.createElement('div');
    header.className = 'soup-memory-panel__header';

    const title = document.createElement('h3');
    title.id = 'memory-panel-title';
    title.className = 'soup-memory-panel__title';
    title.textContent = 'Molecular Memory';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'soup-memory-panel__close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close molecular memory');
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Stats
    const statsDiv = document.createElement('div');
    statsDiv.id = 'memory-stats';
    statsDiv.className = 'soup-memory-panel__stats';

    const zoneRow = document.createElement('div');
    zoneRow.id = 'memory-spawn-row';
    zoneRow.className = 'soup-memory-panel__zone-row';
    const zoneLabel = document.createElement('span');
    zoneLabel.textContent = 'Rehydration spawn: ';
    const zoneSelect = document.createElement('select');
    zoneSelect.id = 'memory-zone-select';
    zoneSelect.className = 'soup-memory-panel__zone-select';
    zoneSelect.setAttribute('aria-label', 'Zone to place molecule when returning to Soup');
    const zones: { v: 'calm' | 'lab' | 'kitchen' | 'deep' | 'center'; l: string }[] = [
      { v: 'calm', l: 'Calm (breathing)' },
      { v: 'lab', l: 'Lab' },
      { v: 'kitchen', l: 'Kitchen' },
      { v: 'deep', l: 'Deep' },
      { v: 'center', l: 'World center' }
    ];
    zones.forEach((z) => {
      const o = document.createElement('option');
      o.value = z.v;
      o.textContent = z.l;
      zoneSelect.appendChild(o);
    });
    zoneRow.appendChild(zoneLabel);
    zoneRow.appendChild(zoneSelect);

    // Molecule list
    const listDiv = document.createElement('div');
    listDiv.id = 'memory-list';
    listDiv.className = 'soup-memory-panel__list';

    // Privacy footer — honest disclosure of where the memory lives.
    const footer = document.createElement('p');
    footer.className = 'soup-memory-panel__footer';
    footer.textContent = 'Stored locally in your browser. Never uploaded.';

    this.panelElement.appendChild(header);
    this.panelElement.appendChild(statsDiv);
    this.panelElement.appendChild(zoneRow);
    this.panelElement.appendChild(listDiv);
    this.panelElement.appendChild(footer);

    document.body.appendChild(this.panelElement);
  }

  show() {
    if (!this.panelElement) return;

    this.isVisible = true;
    this.panelElement.hidden = false;
    this.panelElement.setAttribute('aria-hidden', 'false');
    this.updateContent();
  }

  hide() {
    if (!this.panelElement) return;

    this.isVisible = false;
    this.panelElement.hidden = true;
    this.panelElement.setAttribute('aria-hidden', 'true');
  }

  private updateContent() {
    if (!this.panelElement) return;

    const stats = this.soup.getPersistenceStats();
    const savedMolecules = this.soup.getSavedMolecules();

    // Update stats
    const statsEl = document.getElementById('memory-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div>Saved Molecules: ${stats.savedMolecules}</div>
        <div>Posner Molecules: ${stats.posnerMolecules}</div>
        <div>Community Highlights: ${stats.communityHighlights}</div>
        <div>Total Syntheses (local): ${stats.totalSyntheses}</div>
        <div>Community pulse (WCD-33): ${stats.communitySynthesisPulse}</div>
        <div>Heritage Chains: ${stats.totalHeritageChains}</div>
      `;
    }

    // Update molecule list
    const listEl = document.getElementById('memory-list');
    if (listEl) {
      listEl.innerHTML = '';

      if (savedMolecules.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'soup-memory-panel__empty';
        empty.textContent =
          'No saved molecules yet. Tap a molecule and choose "Save this structure" — or significant molecules save themselves.';
        listEl.appendChild(empty);
        return;
      }

      // Significance is *not* a star rating (no engagement metric, see
      // ETHICAL-STYLE-MAP §6). Surface only a "Posner" / "Highlight" tag when
      // the geometry passes the canonical archive thresholds.
      const archive = this.soup.getGlobalArchive
        ? this.soup.getGlobalArchive()
        : { posnerMolecules: [], communityHighlights: [] };
      const posnerIds = new Set(
        (archive.posnerMolecules || []).map((m: { id: string }) => m.id)
      );
      const highlightIds = new Set(
        (archive.communityHighlights || []).map((m: { id: string }) => m.id)
      );

      savedMolecules.forEach((molecule: Molecule) => {
        const item = document.createElement('div');
        item.className = 'soup-memory-panel__item';

        const time = new Date(molecule.creationTime).toLocaleString();
        const generationInfo = molecule.generation ? ` · Gen ${molecule.generation}` : '';

        const tags: string[] = [];
        if (posnerIds.has(molecule.id)) tags.push('Posner');
        if (highlightIds.has(molecule.id)) tags.push('Highlight');
        const tagBlock = tags.length
          ? `<span class="soup-memory-panel__tag">${tags.join(' · ')}</span>`
          : '';

        let heritageBlock = '';
        if (molecule.heritage && molecule.heritage.length > 0) {
          const h = molecule.heritage[0] as { parentId?: string; reactionType?: string };
          const rest = molecule.heritage.length > 1 ? ` +${molecule.heritage.length - 1} more` : '';
          const pid = String(h.parentId || '?').replace(/[<>]/g, '').slice(0, 24);
          const rtype = String(h.reactionType || '?').replace(/[<>]/g, '');
          heritageBlock = `<div class="soup-memory-panel__heritage">↳ from <code>${pid}</code> via ${rtype}${rest}</div>`;
        }

        item.innerHTML = `
          <div class="soup-memory-panel__name">${molecule.name}${tagBlock}</div>
          <div class="soup-memory-panel__meta">
            ${molecule.emotionalContext}<br>
            ${molecule.personality} · zone ${molecule.zone}<br>
            ${time}${generationInfo}
          </div>
          <div class="soup-memory-panel__counts">
            ${molecule.atoms.length} atoms · ${molecule.bonds.length} bonds${
              molecule.heritage ? ` · ${molecule.heritage.length} heritage link(s)` : ''
            }
          </div>
          ${heritageBlock}
        `;

        // Add rehydration button — calm cyan, not extractive blue
        const loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'soup-memory-panel__return-btn';
        loadBtn.textContent = 'Return to Soup';
        loadBtn.title = 'Spawns a fresh instance at the selected zone; new id, bonds rewired, ready to react';
        loadBtn.onclick = () => {
          const sel = document.getElementById('memory-zone-select') as HTMLSelectElement | null;
          const z = (sel?.value || 'calm') as 'calm' | 'lab' | 'kitchen' | 'deep' | 'center';
          this.rehydrateMolecule(molecule, z);
        };

        item.appendChild(loadBtn);
        listEl.appendChild(item);
      });
    }
  }

  private rehydrateMolecule(molecule: Molecule, targetZone: 'calm' | 'lab' | 'kitchen' | 'deep' | 'center') {
    const newId = this.soup.rehydrateSavedMolecule(molecule.id, { targetZone });
    if (newId) {
      console.log(`Return to Soup: rehydrated ${molecule.name} → ${newId} @ ${targetZone}`);
      this.hide();
    } else {
      console.warn('Rehydration failed for', molecule.id);
    }
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.MemoryPanel = MemoryPanel;
}