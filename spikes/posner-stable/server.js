const http = require('http');
const fs = require('fs');
const path = require('path');

let serverRunning = true;

const server = http.createServer((req, res) => {
    if (!serverRunning) {
        res.writeHead(503);
        res.end('Server is shutting down');
        return;
    }

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css'
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 Posner Spike server running at http://localhost:${PORT}`);
    console.log('🧪 Testing Posner molecule stability at 30Hz physics tick');
    console.log('⏹️  Press Ctrl+C to stop gracefully');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n⏹️  Received SIGINT, shutting down gracefully...');
    serverRunning = false;

    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });

    // Force exit after 5 seconds
    setTimeout(() => {
        console.log('⚠️  Force shutting down...');
        process.exit(1);
    }, 5000);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Received SIGTERM, shutting down gracefully...');
    serverRunning = false;

    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});