/**
 * SSH Gateway Server
 * WebSocket server for SSH terminal streaming
 * Runs on a separate port from Next.js
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Client, ClientChannel } from 'ssh2';
import { createServer } from 'http';
import { decrypt } from '../lib/crypto';
import { getDatabase } from '../lib/db';

const SSH_GATEWAY_PORT = parseInt(process.env.SSH_GATEWAY_PORT || '3001');

interface SSHSession {
    ws: WebSocket;
    ssh: Client;
    stream: ClientChannel | null;
    credentialId: number;
}

const sessions = new Map<string, SSHSession>();

// Create HTTP server for WebSocket upgrade
const server = createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', activeSessions: sessions.size }));
        return;
    }
    res.writeHead(404);
    res.end('Not found');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws: WebSocket, req) => {
    const sessionId = crypto.randomUUID();
    console.log(`🔌 New SSH WebSocket connection: ${sessionId}`);

    let sshClient: Client | null = null;
    let stream: ClientChannel | null = null;

    ws.on('message', async (message: Buffer) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'connect':
                    await handleConnect(ws, data, sessionId);
                    break;

                case 'data':
                    // Send data to SSH stream
                    const session = sessions.get(sessionId);
                    if (session?.stream) {
                        session.stream.write(data.data);
                    }
                    break;

                case 'resize':
                    // Handle terminal resize
                    const resizeSession = sessions.get(sessionId);
                    if (resizeSession?.stream) {
                        resizeSession.stream.setWindow(data.rows, data.cols, data.height || 480, data.width || 640);
                    }
                    break;

                case 'disconnect':
                    await handleDisconnect(sessionId);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    });

    ws.on('close', () => {
        console.log(`🔌 SSH WebSocket closed: ${sessionId}`);
        handleDisconnect(sessionId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        handleDisconnect(sessionId);
    });
});

async function handleConnect(ws: WebSocket, data: { credentialId: number; cols?: number; rows?: number }, sessionId: string) {
    try {
        const db = await getDatabase();
        const credential = await db.getSSHCredentialById(data.credentialId);

        if (!credential) {
            ws.send(JSON.stringify({ type: 'error', message: 'Credential not found' }));
            return;
        }

        const sshClient = new Client();

        sshClient.on('ready', () => {
            console.log(`✅ SSH connected to ${credential.host}:${credential.port}`);

            sshClient.shell({
                term: 'xterm-256color',
                cols: data.cols || 80,
                rows: data.rows || 24,
            }, (err, stream) => {
                if (err) {
                    ws.send(JSON.stringify({ type: 'error', message: `Shell error: ${err.message}` }));
                    return;
                }

                // Store session
                sessions.set(sessionId, {
                    ws,
                    ssh: sshClient,
                    stream,
                    credentialId: data.credentialId
                });

                // Send connected message
                ws.send(JSON.stringify({ type: 'connected', sessionId }));

                // Stream SSH output to WebSocket
                stream.on('data', (chunk: Buffer) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'data', data: chunk.toString('utf8') }));
                    }
                });

                stream.stderr.on('data', (chunk: Buffer) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'data', data: chunk.toString('utf8') }));
                    }
                });

                stream.on('close', () => {
                    console.log(`📴 SSH stream closed for session ${sessionId}`);
                    ws.send(JSON.stringify({ type: 'disconnected' }));
                    handleDisconnect(sessionId);
                });
            });
        });

        sshClient.on('error', (err) => {
            console.error(`SSH error for session ${sessionId}:`, err);
            ws.send(JSON.stringify({ type: 'error', message: `SSH error: ${err.message}` }));
        });

        sshClient.on('close', () => {
            console.log(`📴 SSH connection closed for session ${sessionId}`);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'disconnected' }));
            }
        });

        // Prepare connection config
        const connectConfig: any = {
            host: credential.host,
            port: credential.port,
            username: credential.username,
            readyTimeout: 30000,
        };

        // Set authentication method
        if (credential.authType === 'password' && credential.encryptedPassword) {
            connectConfig.password = decrypt(credential.encryptedPassword);
        } else if (credential.authType === 'privatekey' && credential.encryptedPrivateKey) {
            connectConfig.privateKey = decrypt(credential.encryptedPrivateKey);
            if (credential.encryptedPassphrase) {
                connectConfig.passphrase = decrypt(credential.encryptedPassphrase);
            }
        }

        // Connect to SSH server
        sshClient.connect(connectConfig);

    } catch (error) {
        console.error('Connect error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Connection failed'
        }));
    }
}

async function handleDisconnect(sessionId: string) {
    const session = sessions.get(sessionId);
    if (session) {
        try {
            if (session.stream) {
                session.stream.end();
            }
            session.ssh.end();
        } catch (error) {
            console.error('Error closing SSH session:', error);
        }
        sessions.delete(sessionId);
    }
}

// Start the server
server.listen(SSH_GATEWAY_PORT, () => {
    console.log(`🚀 SSH Gateway server running on port ${SSH_GATEWAY_PORT}`);
    console.log(`   WebSocket: ws://localhost:${SSH_GATEWAY_PORT}`);
    console.log(`   Health: http://localhost:${SSH_GATEWAY_PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down SSH Gateway...');
    sessions.forEach((session, id) => {
        handleDisconnect(id);
    });
    server.close();
    process.exit(0);
});

export { server, wss };
