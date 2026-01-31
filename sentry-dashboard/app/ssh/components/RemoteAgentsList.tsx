'use client';

import { useState, useEffect, useCallback } from 'react';

interface RemoteAgent {
    id: string;
    nodeName: string;
    connectedAt: string;
    activeSessions: number;
    online: boolean;
}

interface RemoteAgentsListProps {
    onSelectAgent: (agentId: string, nodeName: string) => void;
    selectedAgentId: string | null;
}

// Cloud icon for remote agents
const CloudIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
);

// Refresh icon
const RefreshIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

export default function RemoteAgentsList({ onSelectAgent, selectedAgentId }: RemoteAgentsListProps) {
    const [agents, setAgents] = useState<RemoteAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadAgents = useCallback(async () => {
        try {
            const response = await fetch('/api/agents');
            const data = await response.json();
            if (Array.isArray(data)) {
                setAgents(data);
            }
        } catch (err) {
            console.error('Failed to load agents:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAgents();
        // Poll for updates every 10 seconds
        const interval = setInterval(loadAgents, 10000);
        return () => clearInterval(interval);
    }, [loadAgents]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadAgents();
    };

    const formatConnectedTime = (connectedAt: string) => {
        const date = new Date(connectedAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const onlineAgents = agents.filter(a => a.online);

    return (
        <div style={{
            background: 'rgba(13, 13, 26, 0.8)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '16px',
            maxHeight: '250px',
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CloudIcon />
                    <span style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '14px' }}>
                        Remote Agents
                    </span>
                    <span style={{
                        padding: '2px 8px',
                        background: onlineAgents.length > 0 ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: onlineAgents.length > 0 ? '#2ed573' : '#606078',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                    }}>
                        {onlineAgents.length} online
                    </span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#7c5cff',
                        cursor: 'pointer',
                        opacity: isRefreshing ? 0.5 : 1,
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    }}
                >
                    <RefreshIcon />
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#606078', fontSize: '13px' }}>
                        Loading agents...
                    </div>
                ) : agents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#606078', fontSize: '13px' }}>
                        <p style={{ margin: 0 }}>No remote agents connected</p>
                        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
                            Deploy agents with SENTRY_ENABLE_REMOTE_TERMINAL=true
                        </p>
                    </div>
                ) : (
                    agents.map(agent => (
                        <div
                            key={agent.id}
                            onClick={() => agent.online && onSelectAgent(agent.id, agent.nodeName)}
                            style={{
                                padding: '10px',
                                background: selectedAgentId === agent.id
                                    ? 'linear-gradient(135deg, rgba(46, 213, 115, 0.15), rgba(77, 159, 255, 0.15))'
                                    : 'transparent',
                                border: selectedAgentId === agent.id
                                    ? '1px solid rgba(46, 213, 115, 0.3)'
                                    : '1px solid transparent',
                                borderRadius: '8px',
                                marginBottom: '6px',
                                cursor: agent.online ? 'pointer' : 'not-allowed',
                                opacity: agent.online ? 1 : 0.5,
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: agent.online ? '#2ed573' : '#ff4757',
                                        boxShadow: agent.online ? '0 0 8px rgba(46, 213, 115, 0.5)' : 'none',
                                    }} />
                                    <div>
                                        <div style={{ color: '#e0e0e0', fontWeight: '500', fontSize: '13px' }}>
                                            {agent.nodeName}
                                        </div>
                                        <div style={{ color: '#606078', fontSize: '11px' }}>
                                            {formatConnectedTime(agent.connectedAt)}
                                            {agent.activeSessions > 0 && (
                                                <span style={{ color: '#7c5cff', marginLeft: '8px' }}>
                                                    {agent.activeSessions} session{agent.activeSessions > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
