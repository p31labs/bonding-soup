/**
 * BONDING Memory Panel
 * UI for viewing and managing saved molecules
 */
interface Molecule {
  id: string;
  name: string;
  emotionalContext: string;
  atoms: any[];
  bonds: any[];
  personality: string;
  zone: string;
  creationTime: number;
  significance: number;
  heritage?: any[];
  generation?: number;
}

class MemoryPanel {
  private panelElement: HTMLElement | null = null;
  private isVisible = false;

  constructor(private soup: any) {
    this.createPanel();
  }

  private createPanel() {
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'memory-panel';
    this.panelElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(26, 26, 42, 0.95);
      border: 2px solid #9c27b0;
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 2000;
      display: none;
      font-family: monospace;
      color: white;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    `;

    const title = document.createElement('h3');
    title.textContent = '💾 Molecular Memory';
    title.style.cssText = `
      margin: 0;
      color: #9c27b0;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Stats
    const statsDiv = document.createElement('div');
    statsDiv.id = 'memory-stats';
    statsDiv.style.cssText = `
      margin-bottom: 15px;
      font-size: 12px;
    `;

    const zoneRow = document.createElement('div');
    zoneRow.id = 'memory-spawn-row';
    zoneRow.style.cssText = `
      margin-bottom: 12px;
      font-size: 12px;
      color: #ccc;
    `;
    const zoneLabel = document.createElement('span');
    zoneLabel.textContent = 'Rehydration spawn: ';
    const zoneSelect = document.createElement('select');
    zoneSelect.id = 'memory-zone-select';
    zoneSelect.setAttribute('aria-label', 'Zone to place molecule when returning to Soup');
    zoneSelect.style.cssText = `
      background: #1a1a2a;
      color: #fff;
      border: 1px solid #9c27b0;
      border-radius: 4px;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 12px;
    `;
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
    listDiv.style.cssText = `
      max-height: 250px;
      overflow-y: auto;
    `;

    this.panelElement.appendChild(header);
    this.panelElement.appendChild(statsDiv);
    this.panelElement.appendChild(zoneRow);
    this.panelElement.appendChild(listDiv);

    document.body.appendChild(this.panelElement);
  }

  show() {
    if (!this.panelElement) return;

    this.isVisible = true;
    this.panelElement.style.display = 'block';
    this.updateContent();
  }

  hide() {
    if (!this.panelElement) return;

    this.isVisible = false;
    this.panelElement.style.display = 'none';
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
        listEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No saved molecules yet. Significant molecules will be automatically saved here.</div>';
        return;
      }

      savedMolecules.forEach((molecule: Molecule) => {
        const item = document.createElement('div');
        item.style.cssText = `
          border: 1px solid #666;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 8px;
          background: rgba(64, 64, 64, 0.3);
        `;

        const time = new Date(molecule.creationTime).toLocaleString();
        const significanceStars = '⭐'.repeat(Math.floor(molecule.significance * 5));
        const generationInfo = molecule.generation ? ` | Gen ${molecule.generation}` : '';
        let heritageBlock = '';
        if (molecule.heritage && molecule.heritage.length > 0) {
          const h = molecule.heritage[0] as { parentId?: string; reactionType?: string };
          const rest = molecule.heritage.length > 1 ? ` +${molecule.heritage.length - 1} more` : '';
          const pid = String(h.parentId || '?').replace(/[<>]/g, '').slice(0, 24);
          const rtype = String(h.reactionType || '?').replace(/[<>]/g, '');
          heritageBlock = `<div style="font-size: 10px; color: #4fc3f7; margin-top: 4px;">Heritage: from <code>${pid}</code> via ${rtype}${rest}</div>`;
        }

        item.innerHTML = `
          <div style="font-weight: bold; color: #9c27b0;">${molecule.name}</div>
          <div style="font-size: 11px; color: #ccc; margin: 5px 0;">
            ${molecule.emotionalContext}<br>
            Personality: ${molecule.personality} | Born in zone: ${molecule.zone}<br>
            Created: ${time} | Significance: ${significanceStars}${generationInfo}
          </div>
          <div style="font-size: 10px; color: #888;">
            ${molecule.atoms.length} atoms, ${molecule.bonds.length} bonds
            ${molecule.heritage ? ` | ${molecule.heritage.length} heritage link(s)` : ''}
          </div>
          ${heritageBlock}
        `;

        // Add rehydration button
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Return to Soup';
        loadBtn.title = 'Spawns a fresh instance at the selected zone; new id, bonds rewired, ready to react';
        loadBtn.style.cssText = `
          margin-top: 5px;
          margin-right: 6px;
          padding: 4px 8px;
          background: #4a90e2;
          border: none;
          border-radius: 3px;
          color: white;
          cursor: pointer;
          font-size: 11px;
        `;
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
  (window as any).MemoryPanel = MemoryPanel;
}