const { performance } = require('perf_hooks');

// Performance monitoring for Posner Spike
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            physicsHz: [],
            memoryUsage: [],
            collisionChecks: [],
            frameDrops: 0
        };

        this.startTime = performance.now();
        this.frameCount = 0;
        this.physicsCount = 0;
        this.lastMeasurement = this.startTime;
    }

    recordFrame() {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastMeasurement >= 1000) {
            const fps = (this.frameCount * 1000) / (now - this.lastMeasurement);
            const physicsHz = (this.physicsCount * 1000) / (now - this.lastMeasurement);

            this.metrics.fps.push(fps);
            this.metrics.physicsHz.push(physicsHz);
            this.metrics.memoryUsage.push(process.memoryUsage().heapUsed);

            // Check for frame drops (assuming 60fps target)
            if (fps < 55) {
                this.metrics.frameDrops++;
            }

            console.log(`FPS: ${fps.toFixed(1)}, Physics: ${physicsHz.toFixed(1)}Hz, Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);

            this.frameCount = 0;
            this.physicsCount = 0;
            this.lastMeasurement = now;
        }
    }

    recordPhysicsTick() {
        this.physicsCount++;
    }

    recordCollisionCheck(count) {
        this.metrics.collisionChecks.push(count);
    }

    getSummary() {
        const avgFps = this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
        const avgPhysicsHz = this.metrics.physicsHz.reduce((a, b) => a + b, 0) / this.metrics.physicsHz.length;
        const maxMemory = Math.max(...this.metrics.memoryUsage) / 1024 / 1024;
        const totalCollisionChecks = this.metrics.collisionChecks.reduce((a, b) => a + b, 0);

        return {
            duration: (performance.now() - this.startTime) / 1000,
            averageFps: avgFps,
            averagePhysicsHz: avgPhysicsHz,
            maxMemoryMB: maxMemory,
            frameDrops: this.metrics.frameDrops,
            totalCollisionChecks: totalCollisionChecks,
            stabilityRating: this.calculateStability(avgFps, this.metrics.frameDrops)
        };
    }

    calculateStability(avgFps, frameDrops) {
        if (avgFps >= 55 && frameDrops === 0) return 'EXCELLENT';
        if (avgFps >= 50 && frameDrops <= 2) return 'GOOD';
        if (avgFps >= 40 && frameDrops <= 5) return 'ACCEPTABLE';
        return 'POOR';
    }
}

module.exports = PerformanceMonitor;