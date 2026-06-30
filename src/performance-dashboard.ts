/**
 * BONDING Performance Dashboard
 * Real-time visual performance monitoring
 */

export class PerformanceDashboard {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private metrics: {
    fps: number[];
    memory: number[];
    molecules: number[];
    reactions: number[];
    networkLatency: number[];
  } = {
    fps: [],
    memory: [],
    molecules: [],
    reactions: [],
    networkLatency: []
  };

  private maxDataPoints = 60; // 60 seconds of data
  private updateInterval = 1000; // Update every second
  private lastUpdate = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initializeCanvas();
  }

  private initializeCanvas(): void {
    this.canvas.width = 400;
    this.canvas.height = 200;
    this.canvas.style.border = '1px solid #333';
    this.canvas.style.background = '#1a1a22';
  }

  /**
   * Update performance metrics
   */
  updateMetrics(stats: { physics?: { fps?: number }; molecules?: number; reactionHistory?: number }, soup: unknown): void {
    const now = performance.now();

    if (now - this.lastUpdate >= this.updateInterval) {
      this.lastUpdate = now;

      // Collect current metrics
      this.metrics.fps.push(stats.physics?.fps || 0);
      this.metrics.memory.push(((performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0) / 1024 / 1024);
      this.metrics.molecules.push(stats.molecules || 0);
      this.metrics.reactions.push(stats.reactionHistory || 0);
      this.metrics.networkLatency.push(Math.random() * 50 + 10); // Simulated latency

      // Keep only recent data
      Object.keys(this.metrics).forEach(key => {
        if (this.metrics[key as keyof typeof this.metrics].length > this.maxDataPoints) {
            this.metrics[key as keyof typeof this.metrics].shift();
        }
      });

      this.render();
    }
  }

  /**
   * Render the performance dashboard
   */
  private render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw metrics
    this.drawMetricLine('fps', '#4CAF50', 60); // Target 60fps
    this.drawMetricLine('memory', '#FF9800', 50); // Target <50MB
    this.drawMetricLine('molecules', '#2196F3', 50); // Molecule count
    this.drawMetricLine('networkLatency', '#9C27B0', 100); // Network latency

    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const labels = [
      'FPS (green)',
      'Memory MB (orange)',
      'Molecules (blue)',
      'Network ms (purple)'
    ];

    labels.forEach((label, index) => {
      ctx.fillStyle = this.getMetricColor(index);
      ctx.fillText(label, 10, 20 + index * 15);
    });

    // Draw current values
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(`${this.metrics.fps[this.metrics.fps.length - 1] || 0} FPS`, width - 10, 20);

    ctx.fillStyle = '#FF9800';
    ctx.fillText(`${this.metrics.memory[this.metrics.memory.length - 1]?.toFixed(1) || 0} MB`, width - 10, 35);

    ctx.fillStyle = '#2196F3';
    ctx.fillText(`${this.metrics.molecules[this.metrics.molecules.length - 1] || 0} mols`, width - 10, 50);

    ctx.fillStyle = '#9C27B0';
    ctx.fillText(`${this.metrics.networkLatency[this.metrics.networkLatency.length - 1]?.toFixed(0) || 0} ms`, width - 10, 65);
  }

  /**
   * Draw a metric line on the chart
   */
  private drawMetricLine(metric: keyof typeof this.metrics, color: string, maxValue: number): void {
    const data = this.metrics[metric];
    if (data.length < 2) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - (Math.min(value, maxValue) / maxValue) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * Get color for metric labels
   */
  private getMetricColor(index: number): string {
    const colors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0'];
    return colors[index] || '#fff';
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageFps: number;
    peakMemory: number;
    averageMolecules: number;
    totalReactions: number;
    stability: string;
  } {
    const avgFps = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
    const peakMemory = Math.max(...this.metrics.memory);
    const avgMolecules = this.metrics.molecules.reduce((a, b) => a + b, 0) / this.metrics.molecules.length;
    const totalReactions = this.metrics.reactions[this.metrics.reactions.length - 1] || 0;

    let stability = 'Unknown';
    if (avgFps >= 55) stability = 'Excellent';
    else if (avgFps >= 45) stability = 'Good';
    else if (avgFps >= 35) stability = 'Acceptable';
    else stability = 'Poor';

    return {
      averageFps: avgFps,
      peakMemory,
      averageMolecules: avgMolecules,
      totalReactions,
      stability
    };
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.PerformanceDashboard = PerformanceDashboard;
}