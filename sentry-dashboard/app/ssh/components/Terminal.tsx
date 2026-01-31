'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
    credentialId: number | null;
    onDisconnect?: () => void;
}

interface TerminalMessage {
    type: 'connected' | 'disconnected' | 'data' | 'error';
    data?: string;
    message?: string;
    sessionId?: string;
}

export default function Terminal({ credentialId, onDisconnect }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize xterm
    useEffect(() => {
        if (!terminalRef.current) return;

        const initTerminal = async () => {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            const { WebLinksAddon } = await import('@xterm/addon-web-links');

            const term = new Terminal({
                cursorBlink: true,
                cursorStyle: 'block',
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                theme: {
                    background: '#0d0d1a',
                    foreground: '#e0e0e0',
                    cursor: '#7c5cff',
                    cursorAccent: '#0d0d1a',
                    selectionBackground: 'rgba(124, 92, 255, 0.3)',
                    black: '#000000',
                    red: '#ff5a5a',
                    green: '#3dd68c',
                    yellow: '#ffd93d',
                    blue: '#4d9fff',
                    magenta: '#b794f4',
                    cyan: '#4fd1c5',
                    white: '#e0e0e0',
                    brightBlack: '#606078',
                    brightRed: '#ff7b7b',
                    brightGreen: '#5eeab0',
                    brightYellow: '#ffe066',
                    brightBlue: '#7cb3ff',
                    brightMagenta: '#d4b4ff',
                    brightCyan: '#7ee8db',
                    brightWhite: '#ffffff',
                },
                allowProposedApi: true,
            });

            const fitAddon = new FitAddon();
            const webLinksAddon = new WebLinksAddon();

            term.loadAddon(fitAddon);
            term.loadAddon(webLinksAddon);

            if (terminalRef.current) {
                term.open(terminalRef.current);
                fitAddon.fit();
            }

            xtermRef.current = term;
            fitAddonRef.current = fitAddon;

            // Welcome message
            term.writeln('\x1b[1;35m╔════════════════════════════════════════════╗\x1b[0m');
            term.writeln('\x1b[1;35m║\x1b[0m     \x1b[1;36mSentry SSH Console\x1b[0m                     \x1b[1;35m║\x1b[0m');
            term.writeln('\x1b[1;35m╚════════════════════════════════════════════╝\x1b[0m');
            term.writeln('');
            term.writeln('\x1b[90mSelect a credential and click Connect to start.\x1b[0m');
            term.writeln('');
        };

        initTerminal();

        // Handle resize
        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
                // Send resize to server
                if (wsRef.current?.readyState === WebSocket.OPEN && xtermRef.current) {
                    wsRef.current.send(JSON.stringify({
                        type: 'resize',
                        cols: xtermRef.current.cols,
                        rows: xtermRef.current.rows,
                    }));
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            xtermRef.current?.dispose();
        };
    }, []);

    // Connect to SSH
    const connect = useCallback(async () => {
        if (!credentialId || !xtermRef.current) return;

        setIsConnecting(true);
        setError(null);

        const term = xtermRef.current;
        term.clear();
        term.writeln(`\x1b[33mConnecting to server...\x1b[0m`);

        try {
            const wsUrl = `ws://localhost:${process.env.NEXT_PUBLIC_SSH_GATEWAY_PORT || 3001}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                // Send connect command
                ws.send(JSON.stringify({
                    type: 'connect',
                    credentialId,
                    cols: term.cols,
                    rows: term.rows,
                }));
            };

            ws.onmessage = (event) => {
                const msg: TerminalMessage = JSON.parse(event.data);

                switch (msg.type) {
                    case 'connected':
                        setIsConnected(true);
                        setIsConnecting(false);
                        term.clear();
                        // Attach input handler
                        term.onData((data: string) => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'data', data }));
                            }
                        });
                        break;

                    case 'data':
                        term.write(msg.data || '');
                        break;

                    case 'error':
                        term.writeln(`\x1b[31mError: ${msg.message}\x1b[0m`);
                        setError(msg.message || 'Unknown error');
                        setIsConnecting(false);
                        break;

                    case 'disconnected':
                        setIsConnected(false);
                        term.writeln('');
                        term.writeln('\x1b[33mConnection closed.\x1b[0m');
                        onDisconnect?.();
                        break;
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                term.writeln('\x1b[31mWebSocket connection error. Is the SSH Gateway running?\x1b[0m');
                setError('Connection failed');
                setIsConnecting(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                setIsConnecting(false);
            };

        } catch (err) {
            console.error('Connect error:', err);
            term.writeln(`\x1b[31mFailed to connect: ${err}\x1b[0m`);
            setError('Connection failed');
            setIsConnecting(false);
        }
    }, [credentialId, onDisconnect]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        if (xtermRef.current) {
            xtermRef.current.writeln('');
            xtermRef.current.writeln('\x1b[33mDisconnected.\x1b[0m');
        }
        onDisconnect?.();
    }, [onDisconnect]);

    // Auto-connect when credentialId changes
    useEffect(() => {
        if (credentialId && !isConnected && !isConnecting) {
            // Add a small delay to ensure terminal is ready
            const timer = setTimeout(() => connect(), 100);
            return () => clearTimeout(timer);
        }
    }, [credentialId, isConnected, isConnecting, connect]);

    return (
        <div className="terminal-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Terminal toolbar */}
            <div className="terminal-toolbar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1), rgba(77, 159, 255, 0.1))',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px 12px 0 0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isConnected ? '#3dd68c' : isConnecting ? '#ffd93d' : '#ff5a5a',
                        boxShadow: isConnected ? '0 0 10px #3dd68c' : 'none',
                    }} />
                    <span style={{ color: '#e0e0e0', fontSize: '14px' }}>
                        {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!isConnected && !isConnecting && credentialId && (
                        <button
                            onClick={connect}
                            style={{
                                padding: '6px 16px',
                                background: 'linear-gradient(135deg, #7c5cff, #4d9fff)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                            }}
                        >
                            Connect
                        </button>
                    )}
                    {isConnected && (
                        <button
                            onClick={disconnect}
                            style={{
                                padding: '6px 16px',
                                background: 'rgba(255, 90, 90, 0.2)',
                                border: '1px solid #ff5a5a',
                                borderRadius: '6px',
                                color: '#ff5a5a',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                            }}
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </div>

            {/* Terminal */}
            <div
                ref={terminalRef}
                style={{
                    flex: 1,
                    background: '#0d0d1a',
                    padding: '8px',
                    borderRadius: '0 0 12px 12px',
                    overflow: 'hidden',
                }}
            />

            {error && (
                <div style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 90, 90, 0.1)',
                    borderTop: '1px solid rgba(255, 90, 90, 0.3)',
                    color: '#ff5a5a',
                    fontSize: '13px',
                }}>
                    {error}
                </div>
            )}
        </div>
    );
}
