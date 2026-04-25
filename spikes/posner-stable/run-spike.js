#!/usr/bin/env node

const { spawn } = require('child_process');
const PerformanceMonitor = require('./performance-monitor');

// Run the Posner spike with performance monitoring
console.log('🚀 Starting Posner Molecule Stability Spike (SPIKE-01)');
console.log('Testing 39-atom structure at 30Hz physics tick');
console.log('Target: 60fps with graceful degradation');
console.log('─'.repeat(50));

// Start the server
const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: ['inherit', 'pipe', 'pipe']
});

let monitor = new PerformanceMonitor();
let testDuration = 60000; // 60 seconds for longer testing
let startTime = Date.now();

// Monitor server output
server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Server:', output.trim());
});

server.stderr.on('data', (data) => {
    console.error('Server Error:', data.toString());
});

server.on('close', (code) => {
    const actualDuration = (Date.now() - startTime) / 1000;
    console.log(`\nServer exited with code ${code} after ${actualDuration.toFixed(1)}s`);
    console.log('─'.repeat(50));

    const summary = monitor.getSummary();
    console.log('📊 Performance Summary:');
    console.log(`   Duration: ${summary.duration.toFixed(1)}s`);
    console.log(`   Avg FPS: ${summary.averageFps.toFixed(1)}`);
    console.log(`   Avg Physics Hz: ${summary.averagePhysicsHz.toFixed(1)}`);
    console.log(`   Max Memory: ${summary.maxMemoryMB.toFixed(2)}MB`);
    console.log(`   Frame Drops: ${summary.frameDrops}`);
    console.log(`   Stability: ${summary.stabilityRating}`);

    console.log('\n✅ Spike Results:');
    if (summary.stabilityRating === 'EXCELLENT' || summary.stabilityRating === 'GOOD') {
        console.log('   🟢 PASS: Posner molecule stable at 30Hz');
        console.log('   → Proceed with full molecular physics implementation');
        console.log('   → LOD system successfully prevents performance degradation');
    } else if (summary.stabilityRating === 'ACCEPTABLE') {
        console.log('   🟡 CAUTION: Performance acceptable with LOD degradation');
        console.log('   → Review collision detection optimization');
        console.log('   → Consider reducing atom count for mobile devices');
    } else {
        console.log('   🔴 REVIEW: Performance concerns detected');
        console.log('   → Implement more aggressive LOD system');
        console.log('   → Consider simplified physics model');
    }

    process.exit(code || 0);
});

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
    console.log('\n⏹️  Test interrupted by user, terminating server...');
    server.kill('SIGTERM');

    // Give server time to shut down gracefully
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

// Auto-terminate after test duration
const timeout = setTimeout(() => {
    console.log(`\n⏰ Test duration complete (${testDuration/1000}s), terminating server...`);
    server.kill('SIGTERM');
}, testDuration);

// Keep-alive ping to monitor server health
const healthCheck = setInterval(() => {
    // Simple health monitoring - could be enhanced with actual HTTP checks
    if (!server.killed) {
        monitor.recordFrame(); // Record that we're still running
    }
}, 1000);

// Cleanup on exit
process.on('exit', () => {
    clearTimeout(timeout);
    clearInterval(healthCheck);
});