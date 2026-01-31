/**
 * Agent Gateway Server
 * WebSocket server for agent remote terminal connections
 * Runs on port 3004 (separate from SSH Gateway on 3001)
 * 
 * Agents connect here to register and receive terminal commands
 * Users connect via /agent-terminal to access agent terminals
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const AGENT_GATEWAY_PORT = parseInt(process.env.AGENT_GATEWAY_PORT || '3004');

// Message types (must match agent-side)
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

// Connected agents (agentId -> AgentConnection)
const agents = new Map<string, AgentConnection>();

// Active user terminal sessions (sessionId -> UserSession)
const userSessions = new Map<string, UserSession>();

// Create HTTP server
const server = createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            connectedAgents: agents.size,
            activeSessions: userSessions.size
        }));
        return;
    }

    // List connected agents
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

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;

    // Extract headers
    const nodeName = req.headers['x-node-name'] as string || '';
    const apiKey = req.headers['x-api-key'] as string || '';

    if (path === '/agent') {
        handleAgentConnection(ws, nodeName, apiKey);
    } else if (path === '/terminal') {
        // User requesting terminal to an agent
        const agentId = url.searchParams.get('agentId');
        if (!agentId) {
            ws.send(JSON.stringify({ type: MsgType.Error, error: 'Missing agentId parameter' }));
            ws.close();
            return;
        }
        handleUserTerminalConnection(ws, agentId);
    } else {
        ws.send(JSON.stringify({ type: MsgType.Error, error: 'Unknown endpoint' }));
        ws.close();
    }
});

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
                    // Forward to user session
                    const session = userSessions.get(msg.sessionId);
                    if (session && session.ws.readyState === WebSocket.OPEN) {
                        session.ws.send(JSON.stringify(msg));
                    }
                    if (msg.type === MsgType.CloseShell) {
                        userSessions.delete(msg.sessionId);
                        const agent = agents.get(session?.agentId || '');
                        if (agent) {
                            agent.activeSessions.delete(msg.sessionId);
                        }
                    }
                    break;

                case MsgType.Pong:
                    // Agent responded to ping
                    break;
            }
        } catch (error) {
            console.error('Error parsing agent message:', error);
        }
    });

    ws.on('close', () => {
        if (agentId) {
            console.log(`📴 Agent disconnected: ${agentId}`);
            // Close all user sessions for this agent
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

    // Start ping interval
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
        ws.send(JSON.stringify({ type: MsgType.Error, error: 'Agent not connected or offline' }));
        ws.close();
        return;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🖥️ User terminal session started: ${sessionId} -> ${agent.nodeName}`);

    userSessions.set(sessionId, { ws, agentId, sessionId });
    agent.activeSessions.add(sessionId);

    // Send confirmation to user
    ws.send(JSON.stringify({ type: 'connected', sessionId, nodeName: agent.nodeName }));

    // Request shell start from agent (default size, will be updated on resize)
    agent.ws.send(JSON.stringify({
        type: MsgType.StartShell,
        sessionId,
        cols: 80,
        rows: 24
    }));

    ws.on('message', (message: Buffer) => {
        try {
            const msg = JSON.parse(message.toString());

            // Forward to agent with sessionId
            if (agent.ws.readyState === WebSocket.OPEN) {
                agent.ws.send(JSON.stringify({
                    ...msg,
                    sessionId
                }));
            }
        } catch (error) {
            console.error('Error parsing user message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`📴 User terminal session closed: ${sessionId}`);
        // Tell agent to close shell
        if (agent.ws.readyState === WebSocket.OPEN) {
            agent.ws.send(JSON.stringify({
                type: MsgType.CloseShell,
                sessionId
            }));
        }
        userSessions.delete(sessionId);
        agent.activeSessions.delete(sessionId);
    });

    ws.on('error', (error) => {
        console.error(`User terminal WebSocket error (${sessionId}):`, error);
    });
}

// Start the server
server.listen(AGENT_GATEWAY_PORT, () => {
    console.log(`🚀 Agent Gateway server running on port ${AGENT_GATEWAY_PORT}`);
    console.log(`   Agent endpoint: ws://localhost:${AGENT_GATEWAY_PORT}/agent`);
    console.log(`   Terminal endpoint: ws://localhost:${AGENT_GATEWAY_PORT}/terminal?agentId=xxx`);
    console.log(`   Health: http://localhost:${AGENT_GATEWAY_PORT}/health`);
    console.log(`   Agents list: http://localhost:${AGENT_GATEWAY_PORT}/agents`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down Agent Gateway...');
    agents.forEach((agent, id) => {
        agent.ws.close();
    });
    userSessions.forEach((session, id) => {
        session.ws.close();
    });
    server.close();
    process.exit(0);
});

export { server, wss, agents };
