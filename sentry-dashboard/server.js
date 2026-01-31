const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function log(prefix, color, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color}[${timestamp}] [${prefix}]${colors.reset} ${message}`);
}

// Check if running in standalone mode (Docker)
const isStandalone = fs.existsSync(path.join(__dirname, '.next', 'standalone'));

// Start Next.js server
function startNextServer() {
    log('NEXT', colors.cyan, 'Starting Next.js server...');

    if (isStandalone) {
        // Docker standalone mode - run the built-in server.js directly
        log('NEXT', colors.cyan, 'Running in standalone mode...');

        // Import and run the standalone server
        const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
        if (fs.existsSync(standaloneServerPath)) {
            require(standaloneServerPath);
            log('NEXT', colors.green, 'Standalone server started on port 3000');
        } else {
            log('NEXT', colors.red, 'Standalone server.js not found!');
            process.exit(1);
        }
    } else {
        // Development/non-standalone mode
        const next = spawn('npm', ['run', 'start'], {
            cwd: process.cwd(),
            shell: true,
            stdio: 'pipe',
        });

        next.stdout.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            lines.forEach(line => log('NEXT', colors.cyan, line));
        });

        next.stderr.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            lines.forEach(line => log('NEXT', colors.yellow, line));
        });

        next.on('close', (code) => {
            log('NEXT', colors.red, `Process exited with code ${code}`);
            process.exit(code);
        });

        return next;
    }
}

// Start SSH Gateway
function startSSHGateway() {
    log('SSH', colors.green, 'Starting SSH Gateway...');

    // Check for compiled JS version first (Docker), then try tsx (development)
    const compiledPath = path.join(__dirname, 'server', 'ssh-gateway.js');
    const tsPath = path.join(__dirname, 'server', 'ssh-gateway.ts');

    if (fs.existsSync(compiledPath)) {
        // Use compiled JavaScript version
        log('SSH', colors.green, 'Using compiled ssh-gateway.js');
        try {
            require(compiledPath);
            log('SSH', colors.green, `SSH Gateway started on port ${process.env.SSH_GATEWAY_PORT || 3001}`);
        } catch (err) {
            log('SSH', colors.red, `Failed to start SSH Gateway: ${err.message}`);
        }
    } else if (fs.existsSync(tsPath)) {
        // Use tsx for TypeScript (development)
        log('SSH', colors.green, 'Using tsx for ssh-gateway.ts');
        const gateway = spawn('npx', ['tsx', 'server/ssh-gateway.ts'], {
            cwd: process.cwd(),
            shell: true,
            stdio: 'pipe',
            env: { ...process.env },
        });

        gateway.stdout.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            lines.forEach(line => log('SSH', colors.green, line));
        });

        gateway.stderr.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            lines.forEach(line => log('SSH', colors.yellow, line));
        });

        gateway.on('close', (code) => {
            log('SSH', colors.red, `Gateway exited with code ${code}`);
            if (code !== 0) {
                log('SSH', colors.yellow, 'Restarting SSH Gateway in 5 seconds...');
                setTimeout(startSSHGateway, 5000);
            }
        });

        return gateway;
    } else {
        log('SSH', colors.red, 'SSH Gateway not found! Skipping...');
    }
}

// Handle process signals
process.on('SIGINT', () => {
    log('MAIN', colors.red, 'Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('MAIN', colors.red, 'Shutting down...');
    process.exit(0);
});

// Start both servers
log('MAIN', colors.cyan, '========================================');
log('MAIN', colors.cyan, 'Sentry Dashboard - Production Server');
log('MAIN', colors.cyan, '========================================');

startNextServer();

// Small delay to let Next.js start first
setTimeout(() => {
    startSSHGateway();
}, 2000);
