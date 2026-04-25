/**
 * SPIKE-02: Spatial Chat Gravity Model
 * Testing DOM-to-Canvas performance for orbiting chat messages
 */

interface ChatMessage {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  orbitCenter: { x: number; y: number };
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  opacity: number;
  age: number;
  maxAge: number;
}

// Mock chat system for performance testing
class SpatialChatSpike {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private messages: ChatMessage[] = [];
  private messageCount = 0;
  private fps = 0;
  private lastFrameTime = performance.now();
  private frameCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupMockMessages();
    this.startAnimation();
  }

  /**
   * Create mock chat messages orbiting molecules
   */
  private setupMockMessages() {
    // Simulate 20 molecules with orbiting messages (realistic chat scenario)
    const moleculePositions = [
      { x: 200, y: 200 }, { x: 400, y: 250 }, { x: 600, y: 300 },
      { x: 250, y: 400 }, { x: 450, y: 450 }, { x: 650, y: 350 },
      { x: 300, y: 150 }, { x: 500, y: 100 }, { x: 700, y: 200 },
      { x: 350, y: 500 }, { x: 550, y: 550 }, { x: 150, y: 350 },
      { x: 750, y: 450 }, { x: 100, y: 250 }, { x: 800, y: 150 },
      { x: 450, y: 350 }, { x: 250, y: 550 }, { x: 650, y: 500 },
      { x: 150, y: 450 }, { x: 750, y: 250 }
    ];

    moleculePositions.forEach((pos, index) => {
      // Each molecule gets 1-3 orbiting messages
      const messageCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < messageCount; i++) {
        const message = this.createMockMessage(pos.x, pos.y, index, i);
        this.messages.push(message);
      }
    });

    console.log(`SPIKE-02: Created ${this.messages.length} orbiting chat messages`);
  }

  /**
   * Create a mock chat message
   */
  private createMockMessage(centerX: number, centerY: number, moleculeIndex: number, messageIndex: number): ChatMessage {
    const messages = [
      "Hello!", "How are you?", "Nice molecule!", "What's up?", "LOL",
      "Beautiful!", "So cool!", "Amazing!", "❤️", "👍", "😊",
      "This is great!", "Wonderful!", "Fantastic!", "Awesome!"
    ];

    const authors = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];

    return {
      id: `msg_${moleculeIndex}_${messageIndex}_${Date.now()}`,
      text: messages[Math.floor(Math.random() * messages.length)],
      author: authors[Math.floor(Math.random() * authors.length)],
      timestamp: Date.now() - Math.random() * 300000, // Random age up to 5 minutes
      orbitCenter: { x: centerX, y: centerY },
      orbitRadius: 60 + Math.random() * 40, // 60-100px radius
      orbitAngle: Math.random() * Math.PI * 2, // Random starting angle
      orbitSpeed: 0.5 + Math.random() * 1.0, // 0.5-1.5 rad/s
      opacity: 1.0,
      age: 0,
      maxAge: 300000 // 5 minutes
    };
  }

  /**
   * Start the animation loop
   */
  private startAnimation() {
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;

      // Update messages
      this.updateMessages(deltaTime);

      // Render
      this.render();

      // Update FPS counter
      this.frameCount++;
      if (currentTime - this.lastFrameTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Update message positions and properties
   */
  private updateMessages(deltaTime: number) {
    this.messages.forEach(message => {
      // Update orbit
      message.orbitAngle += message.orbitSpeed * deltaTime;

      // Update age and opacity
      message.age += deltaTime * 1000;
      const ageRatio = message.age / message.maxAge;

      if (ageRatio > 0.7) {
        // Fade out in last 30% of lifetime
        message.opacity = Math.max(0, 1 - ((ageRatio - 0.7) / 0.3));
      }

      // Remove old messages
      if (message.age >= message.maxAge) {
        const index = this.messages.indexOf(message);
        if (index > -1) {
          this.messages.splice(index, 1);
        }
      }
    });

    // Add new messages occasionally to maintain count
    if (this.messages.length < 30 && Math.random() < 0.02) {
      const randomMolecule = this.messages[Math.floor(Math.random() * this.messages.length)];
      if (randomMolecule) {
        const newMessage = this.createMockMessage(
          randomMolecule.orbitCenter.x + (Math.random() - 0.5) * 100,
          randomMolecule.orbitCenter.y + (Math.random() - 0.5) * 100,
          this.messageCount++,
          0
        );
        this.messages.push(newMessage);
      }
    }
  }

  /**
   * Render all messages
   */
  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw molecule centers (small dots)
    this.ctx.fillStyle = '#666';
    const moleculeCenters = new Set<string>();
    this.messages.forEach(message => {
      const key = `${message.orbitCenter.x},${message.orbitCenter.y}`;
      if (!moleculeCenters.has(key)) {
        moleculeCenters.add(key);
        this.ctx.beginPath();
        this.ctx.arc(message.orbitCenter.x, message.orbitCenter.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw orbiting messages
    this.messages.forEach(message => {
      // Calculate position on orbit
      const x = message.orbitCenter.x + Math.cos(message.orbitAngle) * message.orbitRadius;
      const y = message.orbitCenter.y + Math.sin(message.orbitAngle) * message.orbitRadius;

      // Draw message bubble
      this.drawMessageBubble(x, y, message);
    });

    // Draw performance stats
    this.drawPerformanceStats();
  }

  /**
   * Draw a message bubble with text
   */
  private drawMessageBubble(x: number, y: number, message: ChatMessage) {
    this.ctx.save();

    // Set opacity
    this.ctx.globalAlpha = message.opacity;

    // Measure text
    this.ctx.font = '12px monospace';
    const textWidth = this.ctx.measureText(message.text).width;
    const padding = 8;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = 20;

    // Draw bubble background
    this.ctx.fillStyle = 'rgba(64, 64, 64, 0.8)';
    this.ctx.fillRect(x - bubbleWidth/2, y - bubbleHeight/2, bubbleWidth, bubbleHeight);

    // Draw bubble border
    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - bubbleWidth/2, y - bubbleHeight/2, bubbleWidth, bubbleHeight);

    // Draw text
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message.text, x, y + 4);

    // Draw author (smaller, below)
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
    this.ctx.fillText(message.author, x, y + 18);

    this.ctx.restore();
  }

  /**
   * Draw performance statistics
   */
  private drawPerformanceStats() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';

    const stats = [
      `FPS: ${this.fps}`,
      `Messages: ${this.messages.length}`,
      `Active Orbits: ${this.messages.length}`,
      `Canvas Render: ${this.messages.length} elements`
    ];

    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 10, 20 + index * 20);
    });

    // Performance assessment
    const assessment = this.assessPerformance();
    this.ctx.fillStyle = assessment.color;
    this.ctx.fillText(`Assessment: ${assessment.text}`, 10, 20 + stats.length * 20);
  }

  /**
   * Assess performance based on current metrics
   */
  private assessPerformance(): { text: string; color: string } {
    if (this.fps >= 55) {
      return { text: "EXCELLENT - Full chat system viable", color: "#4CAF50" };
    } else if (this.fps >= 45) {
      return { text: "GOOD - Minor optimizations needed", color: "#FF9800" };
    } else if (this.fps >= 35) {
      return { text: "ACCEPTABLE - Significant optimizations needed", color: "#FF5722" };
    } else {
      return { text: "POOR - Alternative chat system required", color: "#F44336" };
    }
  }
}

// Performance monitoring for the spike
class SpikePerformanceMonitor {
  private startTime = performance.now();
  private fpsHistory: number[] = [];
  private messageCountHistory: number[] = [];

  recordFrame(fps: number, messageCount: number) {
    this.fpsHistory.push(fps);
    this.messageCountHistory.push(messageCount);

    // Keep only last 60 seconds of data
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
      this.messageCountHistory.shift();
    }
  }

  getSummary() {
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const avgMessages = this.messageCountHistory.reduce((a, b) => a + b, 0) / this.messageCountHistory.length;
    const minFps = Math.min(...this.fpsHistory);
    const maxMessages = Math.max(...this.messageCountHistory);

    return {
      duration: (performance.now() - this.startTime) / 1000,
      averageFps: avgFps,
      minFps: minFps,
      averageMessages: avgMessages,
      maxMessages: maxMessages,
      stabilityRating: this.calculateStability(avgFps, minFps)
    };
  }

  private calculateStability(avgFps: number, minFps: number): string {
    if (avgFps >= 55 && minFps >= 50) return 'EXCELLENT';
    if (avgFps >= 50 && minFps >= 40) return 'GOOD';
    if (avgFps >= 45 && minFps >= 35) return 'ACCEPTABLE';
    return 'POOR';
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  (window as any).SpatialChatSpike = SpatialChatSpike;
  (window as any).SpikePerformanceMonitor = SpikePerformanceMonitor;
}