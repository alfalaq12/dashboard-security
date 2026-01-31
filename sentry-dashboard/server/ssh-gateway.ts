/**
 * Unified Gateway Server
 * WebSocket server for both SSH terminal streaming and Remote Agent connections
 * Runs on port 3004 (separate from Next.js on 3000)
 * 
 * Endpoints:
 * - / (default): SSH terminal via credentials
 * - /agent: Agent registration endpoint
 * - /terminal: User terminal to connected agent
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Client, ClientChannel } from 'ssh2';
import { createServer } from 'http';
import { decrypt } from '../lib/crypto';
import { getDatabase } from '../lib/db';

const GATEWAY_PORT = parseInt(process.env.SSH_GATEWAY_PORT || '3004');

// =====================================
// SSH Terminal Session Types
// =====================================
interface SSHSession {
    ws: WebSocket;
    ssh: Client;
    stream: ClientChannel | null;
    credentialId: number;
}

const sshSessions = new Map<string, SSHSession>();

// =====================================
// Remote Agent Types
// =====================================
const MsgType = {
    Register: 'register',
    Registered: 'registered',
    StartShell: 'start_shell',
    Data: 'data',
    Resize: 'resize',
    CloseShell: 'close_shell',
    Error: 'error',
    Ping: 'ping',
    Pong: 'pong',
} as const;

interface AgentConnection {
    ws: WebSocket;
    nodeName: string;
    connectedAt: Date;
    apiKey: string;
    activeSessions: Set<string>;
}

interface UserSession {
    ws: WebSocket;
    agentId: string;
    sessionId: string;
}

const agents = new Map<string, AgentConnection>();
const userSessions = new Map<string, UserSession>();

// =====================================
// HTTP Server
// =====================================
const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            sshSessions: sshSessions.size,
            connectedAgents: agents.size,
            agentSessions: userSessions.size
        }));
        return;
    }

    if (req.url === '/agents') {
        const agentList = Array.from(agents.entries()).map(([id, agent]) => ({
            id,
            nodeName: agent.nodeName,
            connectedAt: agent.connectedAt.toISOString(),
            activeSessions: agent.activeSessions.size,
            online: agent.ws.readyState === WebSocket.OPEN
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agentList));
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

// =====================================
// WebSocket Server with Path Routing
// =====================================
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === '/agent') {
        // Agent registration
        const nodeName = req.headers['x-node-name'] as string || '';
        const apiKey = req.headers['x-api-key'] as string || '';
        handleAgentConnection(ws, nodeName, apiKey);
    } else if (path === '/terminal') {
        // User terminal to agent
        const agentId = url.searchParams.get('agentId');
        if (!agentId) {
            ws.send(JSON.stringify({ type: MsgType.Error, error: 'Missing agentId' }));
            ws.close();
            return;
        }
        handleUserTerminalConnection(ws, agentId);
    } else {
        // Default: SSH terminal via credentials
        handleSSHConnection(ws);
    }
});

// =====================================
// SSH Terminal Handlers
// =====================================
function handleSSHConnection(ws: WebSocket) {
    const sessionId = crypto.randomUUID();
    console.log(`🔌 New SSH WebSocket connection: ${sessionId}`);

    ws.on('message', async (message: Buffer) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'connect':
                    await handleSSHConnect(ws, data, sessionId);
                    break;
                case 'data':
                    const session = sshSessions.get(sessionId);
                    if (session?.stream) {
                        session.stream.write(data.data);
                    }
                    break;
                case 'resize':
                    const resizeSession = sshSessions.get(sessionId);
                    if (resizeSession?.stream) {
                        resizeSession.stream.setWindow(data.rows, data.cols, data.height || 480, data.width || 640);
                    }
                    break;
                case 'disconnect':
                    handleSSHDisconnect(sessionId);
                    break;
            }
        } catch (error) {
            console.error('Error handling SSH message:', error);
            ws.send(JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' }));
        }
    });

    ws.on('close', () => {
        console.log(`🔌 SSH WebSocket closed: ${sessionId}`);
        handleSSHDisconnect(sessionId);
    });

    ws.on('error', (error) => {
        console.error(`SSH WebSocket error for session ${sessionId}:`, error);
        handleSSHDisconnect(sessionId);
    });
}

async function handleSSHConnect(ws: WebSocket, data: { credentialId: number; cols?: number; rows?: number }, sessionId: string) {
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

                sshSessions.set(sessionId, { ws, ssh: sshClient, stream, credentialId: data.credentialId });
                ws.send(JSON.stringify({ type: 'connected', sessionId }));

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
                    handleSSHDisconnect(sessionId);
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

        const connectConfig: any = {
            host: credential.host,
            port: credential.port,
            username: credential.username,
            readyTimeout: 30000,
        };

        if (credential.authType === 'password' && credential.encryptedPassword) {
            connectConfig.password = decrypt(credential.encryptedPassword);
        } else if (credential.authType === 'privatekey' && credential.encryptedPrivateKey) {
            connectConfig.privateKey = decrypt(credential.encryptedPrivateKey);
            if (credential.encryptedPassphrase) {
                connectConfig.passphrase = decrypt(credential.encryptedPassphrase);
            }
        }

        sshClient.connect(connectConfig);
    } catch (error) {
        console.error('SSH Connect error:', error);
        ws.send(JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Connection failed' }));
    }
}

function handleSSHDisconnect(sessionId: string) {
    const session = sshSessions.get(sessionId);
    if (session) {
        try {
            if (session.stream) session.stream.end();
            session.ssh.end();
        } catch (error) {
            console.error('Error closing SSH session:', error);
        }
        sshSessions.delete(sessionId);
    }
}

// =====================================
// Remote Agent Handlers
// =====================================
function handleAgentConnection(ws: WebSocket, nodeName: string, apiKey: string) {
    let agentId = '';
    console.log(`🔌 Agent connection attempt from: ${nodeName}`);

    ws.on('message', (message: Buffer) => {
        try {
            const msg = JSON.parse(message.toString());

            switch (msg.type) {
                case MsgType.Register:
                    agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    agents.set(agentId, {
                        ws,
                        nodeName: msg.nodeName || nodeName,
                        connectedAt: new Date(),
                        apiKey,
                        activeSessions: new Set()
                    });
                    console.log(`✅ Agent registered: ${msg.nodeName || nodeName} (${agentId})`);
                    ws.send(JSON.stringify({ type: MsgType.Registered, agentId }));
                    break;

                case MsgType.Data:
                case MsgType.CloseShell:
                case MsgType.Error:
                    const session = userSessions.get(msg.sessionId);
                    if (session && session.ws.readyState === WebSocket.OPEN) {
                        session.ws.send(JSON.stringify(msg));
                    }
                    if (msg.type === MsgType.CloseShell) {
                        userSessions.delete(msg.sessionId);
                        const agent = agents.get(session?.agentId || '');
                        if (agent) agent.activeSessions.delete(msg.sessionId);
                    }
                    break;

                case MsgType.Pong:
                    break;
            }
        } catch (error) {
            console.error('Error parsing agent message:', error);
        }
    });

    ws.on('close', () => {
        if (agentId) {
            console.log(`📴 Agent disconnected: ${agentId}`);
            const agent = agents.get(agentId);
            if (agent) {
                for (const sessionId of agent.activeSessions) {
                    const session = userSessions.get(sessionId);
                    if (session && session.ws.readyState === WebSocket.OPEN) {
                        session.ws.send(JSON.stringify({ type: MsgType.CloseShell, sessionId }));
                        session.ws.close();
                    }
                    userSessions.delete(sessionId);
                }
            }
            agents.delete(agentId);
        }
    });

    ws.on('error', (error) => {
        console.error(`Agent WebSocket error (${agentId}):`, error);
    });

    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: MsgType.Ping }));
        } else {
            clearInterval(pingInterval);
        }
    }, 30000);
}

function handleUserTerminalConnection(ws: WebSocket, agentId: string) {
    const agent = agents.get(agentId);

    if (!agent || agent.ws.readyState !== WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: MsgType.Error, error: 'Agent not connected' }));
        ws.close();
        return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🖥️ User terminal session started: ${sessionId} -> ${agent.nodeName}`);

    userSessions.set(sessionId, { ws, agentId, sessionId });
    agent.activeSessions.add(sessionId);

    ws.send(JSON.stringify({ type: 'connected', sessionId, nodeName: agent.nodeName }));
    agent.ws.send(JSON.stringify({ type: MsgType.StartShell, sessionId, cols: 80, rows: 24 }));

    ws.on('message', (message: Buffer) => {
        try {
            const msg = JSON.parse(message.toString());
            if (agent.ws.readyState === WebSocket.OPEN) {
                agent.ws.send(JSON.stringify({ ...msg, sessionId }));
            }
        } catch (error) {
            console.error('Error parsing user message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`📴 User terminal session closed: ${sessionId}`);
        if (agent.ws.readyState === WebSocket.OPEN) {
            agent.ws.send(JSON.stringify({ type: MsgType.CloseShell, sessionId }));
        }
        userSessions.delete(sessionId);
        agent.activeSessions.delete(sessionId);
    });

    ws.on('error', (error) => {
        console.error(`User terminal WebSocket error (${sessionId}):`, error);
    });
}

// =====================================
// Server Startup
// =====================================
server.listen(GATEWAY_PORT, () => {
    console.log(`🚀 Unified Gateway server running on port ${GATEWAY_PORT}`);
    console.log(`   SSH Terminal: ws://localhost:${GATEWAY_PORT}/`);
    console.log(`   Agent Registration: ws://localhost:${GATEWAY_PORT}/agent`);
    console.log(`   User Terminal: ws://localhost:${GATEWAY_PORT}/terminal?agentId=xxx`);
    console.log(`   Health: http://localhost:${GATEWAY_PORT}/health`);
    console.log(`   Agents List: http://localhost:${GATEWAY_PORT}/agents`);
});

process.on('SIGTERM', () => {
    console.log('Shutting down Gateway...');
    sshSessions.forEach((_, id) => handleSSHDisconnect(id));
    agents.forEach((agent) => agent.ws.close());
    userSessions.forEach((session) => session.ws.close());
    server.close();
    process.exit(0);
});

export { server, wss, agents };
