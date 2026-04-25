/**
 * Test harness for ghost molecule interpolation spike
 */

// Import performance API for Node.js
const { performance } = require('perf_hooks');
const InterpolationTest = require('./interpolation-test');

console.log('🧪 Starting Ghost Molecule Interpolation Spike (SPIKE-03)');
console.log('Testing 2Hz -> 60fps interpolation for 50 ghost molecules');
console.log('─'.repeat(60));

// Create test instance
const test = new InterpolationTest();

// Performance tracking
let frameCount = 0;
let lastReportTime = performance.now();
let totalFrames = 0;

// Test duration: 30 seconds
const testDuration = 30000;
const startTime = performance.now();

// Main test loop using setInterval for Node.js compatibility
let animateInterval = null;

function startTest() {
    animateInterval = setInterval(() => {
        const currentTime = performance.now();
        const deltaTime = currentTime - (startTest.lastTime || startTime);
        startTest.lastTime = currentTime;
        
        // Update test
        test.update(currentTime);
        
        // Report performance every second
        if (currentTime - lastReportTime >= 1000) {
            const metrics = test.getMetrics();
            console.log(`📊 Frame ${++frameCount}: FPS=${metrics.fps}, ` +
                       `Molecules=${metrics.moleculeCount}, ` +
                       `Interpolating=${metrics.interpolatingCount}, ` +
                       `Avg Progress=${(metrics.avgInterpolationProgress*100).toFixed(1)}%`);
            lastReportTime = currentTime;
        }
        
        totalFrames++;
        
        // Continue test until duration elapsed
        if (currentTime - startTime >= testDuration) {
            clearInterval(animateInterval);
            showResults();
        }
    }, 16.67); // ~60fps
}

function showResults() {
    // Test complete - show final results
    console.log('─'.repeat(60));
    console.log('🏁 SPIKE-03 COMPLETE');
    const finalMetrics = test.getMetrics();
    console.log(`Final Results:`);
    console.log(`  Duration: ${((performance.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`  Average FPS: ${finalMetrics.fps}`);
    console.log(`  Total Frames: ${totalFrames}`);
    console.log(`  Molecules Tested: ${finalMetrics.moleculeCount}`);
    console.log(`  Interpolation Method: Hermite Spline`);
    
    // Assessment
    if (finalMetrics.fps >= 55) {
        console.log('✅ RESULT: EXCELLENT - 2Hz interpolation viable for 60fps target');
    } else if (finalMetrics.fps >= 45) {
        console.log('⚠️ RESULT: GOOD - Minor optimizations may be needed');
    } else {
        console.log('❌ RESULT: POOR - Interpolation too expensive for target');
    }
}

// Start the test
startTest();