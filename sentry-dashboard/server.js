/**
 * Production Server
 * Starts both Next.js and SSH Gateway together
 */

const { spawn } = require('child_process');
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

// Start Next.js server
function startNextServer() {
    log('NEXT', colors.cyan, 'Starting Next.js server...');

    const next = spawn('npx', ['next', 'start'], {
        cwd: process.cwd(),
        shell: true,
        stdio: 'pipe',
        env: { ...process.env },
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

// Start SSH Gateway
function startSSHGateway() {
    log('SSH', colors.green, 'Starting SSH Gateway...');

    const tsPath = path.join(__dirname, 'server', 'ssh-gateway.ts');

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

// Start SSH Gateway after a short delay
setTimeout(() => {
    startSSHGateway();
}, 3000);
