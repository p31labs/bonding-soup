/**
 * C.A.R.S. Soundtrack Engine
 * Generative audio for the sim (Collaborative Affective Realtime Sim)
 * Molecule chords, zone audio, 8-oscillator limit
 */

import { P31_CONSTANTS } from "./p31-constants-generated";

export interface AudioZone {
  name: string;
  x: number;
  y: number;
  radius: number;
  audioProfile: ZoneAudioProfile;
}

export interface ZoneAudioProfile {
  baseFrequency: number; // Hz
  rhythmPattern?: number[]; // BPM sequence
  chordProgression?: string[]; // Chord names
  reverbLevel: number;
  filterCutoff: number;
}

export interface MoleculeAudio {
  atomId: string;
  oscillator?: OscillatorNode;
  gainNode?: GainNode;
  filterNode?: BiquadFilterNode;
  chord: string[];
  baseFrequency: number;
  lastUpdate: number;
}

export class SoundtrackEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;

  private moleculeAudio = new Map<string, MoleculeAudio>();
  private zones: AudioZone[] = [];
  private activeOscillators = 0;
  private maxOscillators = 8;

  // Zone audio profiles
  private zoneProfiles = {
    calm: {
      baseFrequency: 528, // C5 note for centering
      rhythmPattern: [4, 4, 6], // 4-4-6 breathing
      reverbLevel: 0.3,
      filterCutoff: 2000
    },
    deep: {
      baseFrequency: P31_CONSTANTS.physics.larmorHz,
      reverbLevel: 0.8,
      filterCutoff: 800
    },
    lab: {
      baseFrequency: 440, // A4 concert pitch
      reverbLevel: 0.1,
      filterCutoff: 4000
    },
    kitchen: {
      baseFrequency: 330, // E4
      reverbLevel: 0.2,
      filterCutoff: 3000
    }
  };

  constructor() {
    this.initializeAudio();
    this.setupZones();
  }

  /**
   * Initialize Web Audio API context and nodes
   */
  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return;
    }

    if (!this.audioContext) return;

    // Master gain and compression
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Quiet ambient level

    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Reverb setup
    this.reverb = this.audioContext.createConvolver();
    this.createReverbImpulse();

    // Connect audio graph
    if (this.masterGain && this.compressor && this.reverb) {
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.reverb);
      this.reverb.connect(this.audioContext.destination);
    }
  }

  /**
   * Create reverb impulse response
   */
  private createReverbImpulse() {
    if (!this.audioContext) return;

    const length = this.audioContext.sampleRate * 2; // 2 second reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    if (this.reverb) {
      this.reverb.buffer = impulse;
    }
  }

  /**
   * Set up the four audio zones
   */
  private setupZones() {
    this.zones = [
      {
        name: 'calm',
        x: 2000,
        y: 2000,
        radius: 600,
        audioProfile: this.zoneProfiles.calm
      },
      {
        name: 'lab',
        x: 1000,
        y: 1000,
        radius: 800,
        audioProfile: this.zoneProfiles.lab
      },
      {
        name: 'kitchen',
        x: 3000,
        y: 3000,
        radius: 700,
        audioProfile: this.zoneProfiles.kitchen
      },
      {
        name: 'deep',
        x: 2000,
        y: 2000,
        radius: 800,
        audioProfile: this.zoneProfiles.deep
      }
    ];
  }

  /**
   * Register a molecule for audio generation
   */
  registerMolecule(atomId: string, element: string, x: number, y: number) {
    if (this.moleculeAudio.has(atomId) || this.activeOscillators >= this.maxOscillators) {
      return; // Skip if already registered or at oscillator limit
    }

    const audio = this.createMoleculeAudio(atomId, element, x, y);
    this.moleculeAudio.set(atomId, audio);
    this.activeOscillators++;

    // Start audio generation
    this.updateMoleculeAudio(audio, x, y);
  }

  /**
   * Create audio nodes for a molecule
   */
  private createMoleculeAudio(atomId: string, element: string, x: number, y: number): MoleculeAudio {
    const baseFreq = this.getBaseFrequencyForElement(element);
    const chord = this.generateChordForElement(element);

    return {
      atomId,
      chord,
      baseFrequency: baseFreq,
      lastUpdate: this.audioContext ? this.audioContext.currentTime : 0
    };
  }

  /**
   * Update molecule audio based on position and zone
   */
  updateMoleculeAudio(moleculeAudio: MoleculeAudio, x: number, y: number) {
    const now = this.audioContext ? this.audioContext.currentTime : 0;

    // Throttle updates to avoid excessive audio node creation
    if (now - moleculeAudio.lastUpdate < 0.1) return;

    // Determine current zone
    const zone = this.getCurrentZone(x, y);
    const zoneProfile = zone ? zone.audioProfile : this.zoneProfiles.lab;

    // Update or create oscillator
    if (!moleculeAudio.oscillator) {
      this.createOscillatorForMolecule(moleculeAudio, zoneProfile);
    } else {
      this.updateOscillatorForZone(moleculeAudio, zoneProfile);
    }

    moleculeAudio.lastUpdate = now;
  }

  /**
   * Create oscillator for molecule
   */
  private createOscillatorForMolecule(moleculeAudio: MoleculeAudio, zoneProfile: ZoneAudioProfile) {
    if (!this.audioContext || this.activeOscillators >= this.maxOscillators) {
      this.voiceSteal(); // Free up an oscillator
      if (!this.audioContext) return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    // Configure nodes
    oscillator.type = 'sine';
    oscillator.frequency.value = moleculeAudio.baseFrequency;

    filterNode.type = 'lowpass';
    filterNode.frequency.value = zoneProfile.filterCutoff;

    gainNode.gain.value = 0.1; // Quiet ambient level

    // Connect audio graph
    if (this.masterGain) {
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(this.masterGain);
    }

    // Start oscillator
    oscillator.start();

    moleculeAudio.oscillator = oscillator;
    moleculeAudio.gainNode = gainNode;
    moleculeAudio.filterNode = filterNode;
  }

  /**
   * Update oscillator parameters for zone
   */
  private updateOscillatorForZone(moleculeAudio: MoleculeAudio, zoneProfile: ZoneAudioProfile) {
    if (moleculeAudio.filterNode && this.audioContext) {
      moleculeAudio.filterNode.frequency.setTargetAtTime(
        zoneProfile.filterCutoff,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  /**
   * Voice stealing: remove quietest oscillator when at limit
   */
  private voiceSteal() {
    let quietestAudio: MoleculeAudio | null = null;
    let quietestGain = Infinity;

    for (const audio of this.moleculeAudio.values()) {
      if (audio.gainNode && audio.gainNode.gain.value < quietestGain) {
        quietestGain = audio.gainNode.gain.value;
        quietestAudio = audio;
      }
    }

    if (quietestAudio) {
      this.removeMoleculeAudio(quietestAudio.atomId);
    }
  }

  /**
   * Remove molecule audio
   */
  removeMoleculeAudio(atomId: string) {
    const audio = this.moleculeAudio.get(atomId);
    if (audio) {
      if (audio.oscillator) {
        audio.oscillator.stop();
        audio.oscillator.disconnect();
      }
      if (audio.gainNode) audio.gainNode.disconnect();
      if (audio.filterNode) audio.filterNode.disconnect();

      this.moleculeAudio.delete(atomId);
      this.activeOscillators--;
    }
  }

  /**
   * Get base frequency for element
   */
  private getBaseFrequencyForElement(element: string): number {
    const elementFrequencies: { [key: string]: number } = {
      'H': 261.63,  // C4
      'C': 293.66,  // D4
      'N': 329.63,  // E4
      'O': 349.23,  // F4
      'P': 392.00,  // G4
      'Ca': 440.00, // A4
      'Na': 493.88, // B4
      'Cl': 523.25  // C5
    };

    return elementFrequencies[element] || 440; // Default to A4
  }

  /**
   * Generate chord for element
   */
  private generateChordForElement(element: string): string[] {
    const elementChords: { [key: string]: string[] } = {
      'H': ['C4', 'E4', 'G4'],     // Major
      'C': ['D4', 'F#4', 'A4'],    // Major 6th
      'N': ['E4', 'G#4', 'B4'],    // Minor
      'O': ['F4', 'A4', 'C5'],     // Major
      'P': ['G4', 'B4', 'D5'],     // Major
      'Ca': ['A4', 'C#5', 'E5'],   // Minor
      'Na': ['B4', 'D#5', 'F#5'],  // Diminished
      'Cl': ['C5', 'E5', 'G5']     // Major
    };

    return elementChords[element] || ['A4', 'C#5', 'E5'];
  }

  /**
   * Get current zone for position
   */
  private getCurrentZone(x: number, y: number): AudioZone | null {
    for (const zone of this.zones) {
      const dx = x - zone.x;
      const dy = y - zone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= zone.radius) {
        return zone;
      }
    }
    return null;
  }

  /**
   * Update all molecule audio positions
   */
  updateAllMoleculeAudio(atomPositions: { id: string; x: number; y: number; element: string }[]) {
    // Update existing molecules
    atomPositions.forEach(atom => {
      const audio = this.moleculeAudio.get(atom.id);
      if (audio) {
        this.updateMoleculeAudio(audio, atom.x, atom.y);
      } else {
        // Register new molecules if we have capacity
        this.registerMolecule(atom.id, atom.element, atom.x, atom.y);
      }
    });

    // Remove audio for molecules that no longer exist
    const currentIds = new Set(atomPositions.map(atom => atom.id));
    for (const atomId of this.moleculeAudio.keys()) {
      if (!currentIds.has(atomId)) {
        this.removeMoleculeAudio(atomId);
      }
    }
  }

  /**
   * Get audio statistics
   */
  getAudioStats() {
    return {
      activeOscillators: this.activeOscillators,
      maxOscillators: this.maxOscillators,
      registeredMolecules: this.moleculeAudio.size,
      currentZone: 'detected automatically'
    };
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Cleanup audio resources
   */
  dispose() {
    // Stop all oscillators
    for (const audio of this.moleculeAudio.values()) {
      if (audio.oscillator) {
        try {
          audio.oscillator.stop();
        } catch (e) {
          // Oscillator may already be stopped
        }
      }
    }

    // Clear references
    this.moleculeAudio.clear();
    this.activeOscillators = 0;

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(e => {
        // Context may already be closed
      });
    }
  }
}

// Utility function to convert note names to frequencies
export function noteToFrequency(note: string): number {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = parseInt(note.slice(-1));
  const noteName = note.slice(0, -1);

  const noteIndex = noteNames.indexOf(noteName);
  const midiNumber = (octave + 1) * 12 + noteIndex;

  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}