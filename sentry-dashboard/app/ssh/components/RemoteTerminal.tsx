'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface RemoteTerminalProps {
    agentId: string;
    nodeName: string;
    onDisconnect?: () => void;
}

const AGENT_GATEWAY_WS_URL = process.env.NEXT_PUBLIC_AGENT_GATEWAY_WS_URL || 'ws://localhost:3004';

export default function RemoteTerminal({ agentId, nodeName, onDisconnect }: RemoteTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#0d0d1a',
                foreground: '#e0e0e0',
                cursor: '#7c5cff',
                cursorAccent: '#0d0d1a',
                selectionBackground: 'rgba(124, 92, 255, 0.3)',
                black: '#1a1a28',
                red: '#ff5a5a',
                green: '#2ed573',
                yellow: '#ffbe76',
                blue: '#4d9fff',
                magenta: '#7c5cff',
                cyan: '#54a0ff',
                white: '#e0e0e0',
            },
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            scrollback: 10000,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(terminalRef.current);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Fit terminal to container
        setTimeout(() => fitAddon.fit(), 0);

        // Connect to agent gateway
        const wsUrl = `${AGENT_GATEWAY_WS_URL}/terminal?agentId=${encodeURIComponent(agentId)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        term.write(`\x1b[1;35m🔗 Connecting to remote agent: ${nodeName}...\x1b[0m\r\n`);

        ws.onopen = () => {
            console.log('WebSocket connected to agent gateway');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'connected':
                        setStatus('connected');
                        term.write(`\x1b[1;32m✓ Connected to ${msg.nodeName}\x1b[0m\r\n\r\n`);
                        // Send resize on connect
                        ws.send(JSON.stringify({
                            type: 'resize',
                            cols: term.cols,
                            rows: term.rows,
                        }));
                        break;

                    case 'data':
                        term.write(msg.data);
                        break;

                    case 'close_shell':
                    case 'disconnected':
                        setStatus('disconnected');
                        term.write('\r\n\x1b[1;33m⚠ Connection closed by remote agent\x1b[0m\r\n');
                        onDisconnect?.();
                        break;

                    case 'error':
                        setStatus('error');
                        setErrorMessage(msg.error);
                        term.write(`\r\n\x1b[1;31m✗ Error: ${msg.error}\x1b[0m\r\n`);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('error');
            setErrorMessage('WebSocket connection failed');
            term.write('\r\n\x1b[1;31m✗ Connection failed. Is the agent gateway running?\x1b[0m\r\n');
        };

        ws.onclose = () => {
            if (status !== 'error') {
                setStatus('disconnected');
                term.write('\r\n\x1b[1;33m⚠ Connection closed\x1b[0m\r\n');
            }
        };

        // Handle terminal input
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'data', data }));
            }
        });

        // Handle terminal resize
        const handleResize = () => {
            if (fitAddon) {
                fitAddon.fit();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'resize',
                        cols: term.cols,
                        rows: term.rows,
                    }));
                }
            }
        };

        window.addEventListener('resize', handleResize);

        // ResizeObserver for container resize
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            ws.close();
            term.dispose();
        };
    }, [agentId, nodeName, onDisconnect]);

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return '#2ed573';
            case 'connecting': return '#ffbe76';
            case 'disconnected': return '#ff5a5a';
            case 'error': return '#ff5a5a';
            default: return '#606078';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.2)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: getStatusColor(),
                        boxShadow: status === 'connected' ? '0 0 10px rgba(46, 213, 115, 0.5)' : 'none',
                    }} />
                    <div>
                        <div style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '14px' }}>
                            🖥️ Remote Terminal: {nodeName}
                        </div>
                        <div style={{ color: '#606078', fontSize: '12px' }}>
                            Agent: {agentId.substring(0, 20)}...
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        padding: '4px 10px',
                        background: `${getStatusColor()}20`,
                        color: getStatusColor(),
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                    }}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Terminal */}
            <div
                ref={terminalRef}
                style={{
                    flex: 1,
                    padding: '8px',
                    background: '#0d0d1a',
                }}
            />
        </div>
    );
}
