'use client';

import { useEffect, useState } from 'react';

interface DataNode {
    nodeName: string;
    hostname: string;
    os: string;
    numCPU: number;
    memoryAllocMB: number;
    memorySysMB: number;
    lastSeen: string;
    isOnline: boolean;
}

interface ResponseNodes {
    totalNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    nodes: DataNode[];
}

const WARNA = {
    primary: '#7c5cff',
    blue: '#4d9fff',
    green: '#00d9a5',
    red: '#ff6b6b',
    orange: '#ffaa33',
    gray: '#606078'
};

export default function HalamanNodes() {
    const [data, setData] = useState<ResponseNodes | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        async function ambilData() {
            try {
                const res = await fetch('/api/nodes');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Gagal fetch nodes:', err);
            } finally {
                setLoading(false);
            }
        }

        ambilData();
        const timer = setInterval(ambilData, 10000);
        return () => clearInterval(timer);
    }, []);

    function formatWaktu(timestamp: string) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString('id-ID');
    }

    // Calculate uptime percentage
    const totalNodes = data?.totalNodes || 0;
    const onlineNodes = data?.onlineNodes || 0;
    const uptimePercent = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0;

    if (loading) {
        return (
            <div className="premium-loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Loading Servers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="premium-dashboard">
            {/* Page Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                            <circle cx="6" cy="6" r="1" fill="currentColor" />
                            <circle cx="6" cy="18" r="1" fill="currentColor" />
                        </svg>
                        Server Management
                    </h1>
                    <p className="header-subtitle">Manage all connected servers</p>
                </div>
                <div className="header-right">
                    <div className="live-indicator">
                        <span className="pulse-dot"></span>
                        <span>Live</span>
                    </div>
                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="premium-stats-grid nodes-stats">
                {/* Uptime Card */}
                <div className="stat-card-premium uptime-card">
                    <div className="stat-header">
                        <span className="stat-label">Fleet Status</span>
                        <span className={`status-badge ${uptimePercent >= 90 ? 'healthy' : uptimePercent >= 70 ? 'warning' : 'critical'}`}>
                            {uptimePercent >= 90 ? 'All Healthy' : uptimePercent >= 70 ? 'Degraded' : 'Critical'}
                        </span>
                    </div>
                    <div className="uptime-display">
                        <div className="uptime-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none"
                                    stroke={uptimePercent >= 90 ? WARNA.green : uptimePercent >= 70 ? WARNA.orange : WARNA.red}
                                    strokeWidth="8"
                                    strokeDasharray={`${uptimePercent * 2.83} 283`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="uptime-value">
                                <span className="percentage">{uptimePercent}</span>
                                <span className="percent-sign">%</span>
                            </div>
                        </div>
                        <div className="uptime-details">
                            <div className="detail-item">
                                <span className="detail-value success">{data?.onlineNodes || 0}</span>
                                <span className="detail-label">Online</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-value danger">{data?.offlineNodes || 0}</span>
                                <span className="detail-label">Offline</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Servers */}
                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data?.totalNodes || 0}</span>
                        <span className="stat-label">Total Servers</span>
                    </div>
                    <div className="stat-trend neutral">
                        <span>Registered</span>
                    </div>
                </div>

                {/* Online */}
                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 217, 165, 0.15)', color: '#00d9a5' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value" style={{ color: '#00d9a5' }}>{data?.onlineNodes || 0}</span>
                        <span className="stat-label">Online</span>
                    </div>
                    <div className="stat-trend success">
                        <span>Active</span>
                    </div>
                </div>

                {/* Offline */}
                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper red">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value" style={{ color: '#ff6b6b' }}>{data?.offlineNodes || 0}</span>
                        <span className="stat-label">Offline</span>
                    </div>
                    <div className={`stat-trend ${(data?.offlineNodes || 0) > 0 ? 'danger' : 'success'}`}>
                        <span>{(data?.offlineNodes || 0) > 0 ? 'Needs Attention' : 'All Good'}</span>
                    </div>
                </div>
            </div>

            {/* Servers Card */}
            <div className="premium-card">
                <div className="card-header">
                    <div className="header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                        <h3>All Servers</h3>
                    </div>
                    <span className="count-badge">{data?.totalNodes || 0} registered</span>
                </div>
                <div className="card-body">
                    {data?.nodes && data.nodes.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="nodes-grid">
                                {data.nodes.map((node) => (
                                    <div key={node.nodeName} className={`node-card ${node.isOnline ? 'online' : 'offline'}`}>
                                        <div className="node-card-header">
                                            <div className="node-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="2" width="20" height="8" rx="2" />
                                                    <rect x="2" y="14" width="20" height="8" rx="2" />
                                                    <circle cx="6" cy="6" r="1" fill="currentColor" />
                                                    <circle cx="6" cy="18" r="1" fill="currentColor" />
                                                </svg>
                                            </div>
                                            <span className={`node-status-badge ${node.isOnline ? 'online' : 'offline'}`}>
                                                {node.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <h4 className="node-name">{node.nodeName}</h4>
                                        <p className="node-os">{node.os}</p>
                                        <div className="node-specs">
                                            <div className="spec-item">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                                    <rect x="9" y="9" width="6" height="6" />
                                                </svg>
                                                <span>{node.numCPU} vCPU</span>
                                            </div>
                                            <div className="spec-item">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="6" width="20" height="12" rx="2" />
                                                    <line x1="6" y1="10" x2="6" y2="14" />
                                                    <line x1="10" y1="10" x2="10" y2="14" />
                                                    <line x1="14" y1="10" x2="14" y2="14" />
                                                </svg>
                                                <span>{node.memoryAllocMB} MB</span>
                                            </div>
                                        </div>
                                        <div className="node-footer">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span>{formatWaktu(node.lastSeen)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="server-list">
                                {data.nodes.map((node) => (
                                    <div key={node.nodeName} className="server-item">
                                        <div className="server-status">
                                            <span className={`status-dot ${node.isOnline ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <div className="server-info">
                                            <h4>{node.nodeName}</h4>
                                            <p>{node.os} • {node.numCPU} vCPU</p>
                                        </div>
                                        <div className="server-metrics">
                                            <div className="metric">
                                                <span className="metric-value">{node.memoryAllocMB} MB</span>
                                                <span className="metric-label">Memory</span>
                                            </div>
                                        </div>
                                        <div className="server-time">
                                            <span>{formatWaktu(node.lastSeen)}</span>
                                        </div>
                                        <span className={`server-badge ${node.isOnline ? 'online' : 'offline'}`}>
                                            {node.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="empty-state-premium">
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                                <rect x="2" y="2" width="20" height="8" rx="2" />
                                <rect x="2" y="14" width="20" height="8" rx="2" />
                            </svg>
                            <h4>No Servers Connected</h4>
                            <p>Install Sentry Agent on your servers to start monitoring</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .nodes-stats {
                    grid-template-columns: 1.5fr repeat(3, 1fr);
                }
                
                .view-toggle {
                    display: flex;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    padding: 4px;
                }
                
                .toggle-btn {
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: var(--text-gray);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }
                
                .toggle-btn:hover {
                    color: var(--text-white);
                }
                
                .toggle-btn.active {
                    background: var(--accent-primary);
                    color: white;
                }
                
                .nodes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                
                .node-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 20px;
                    transition: all 0.3s ease;
                }
                
                .node-card:hover {
                    border-color: rgba(124, 92, 255, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }
                
                .node-card.online {
                    border-left: 3px solid #00d9a5;
                }
                
                .node-card.offline {
                    border-left: 3px solid #ff6b6b;
                    opacity: 0.7;
                }
                
                .node-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }
                
                .node-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.1));
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--accent-primary);
                }
                
                .node-status-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .node-status-badge.online {
                    background: rgba(0, 217, 165, 0.15);
                    color: #00d9a5;
                }
                
                .node-status-badge.offline {
                    background: rgba(255, 107, 107, 0.15);
                    color: #ff6b6b;
                }
                
                .node-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--text-white);
                }
                
                .node-os {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    margin-bottom: 16px;
                }
                
                .node-specs {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                
                .spec-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--text-gray);
                    padding: 6px 10px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 6px;
                }
                
                .node-footer {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .server-time {
                    font-size: 0.8rem;
                    color: var(--text-gray);
                    min-width: 80px;
                    text-align: right;
                }
                
                @media (max-width: 1200px) {
                    .nodes-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .uptime-card {
                        grid-column: span 2;
                    }
                }
                
                @media (max-width: 768px) {
                    .nodes-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    
                    .header-right {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
}
