'use client';

import { useEffect, useState } from 'react';

interface ServerHealth {
    id: string;
    name: string;
    hostname: string;
    os: string;
    isOnline: boolean;
    lastSeen: string;
    metrics: {
        cpu: number;
        memory: number;
        disk: number;
        uptime: number;
        uptimeFormatted: string;
    };
    status: 'healthy' | 'warning' | 'critical' | 'offline';
}

interface HealthData {
    servers: ServerHealth[];
    summary: {
        total: number;
        online: number;
        healthy: number;
        warning: number;
        critical: number;
        offline: number;
        avgCpu: number;
        avgMemory: number;
    };
    lastUpdated: string;
}

const WARNA = {
    primary: '#7c5cff',
    blue: '#4d9fff',
    green: '#3dd68c',
    red: '#ff5a5a',
    orange: '#ffaa33',
    yellow: '#ffd93d',
    gray: '#606078'
};

function getStatusColor(status: string) {
    switch (status) {
        case 'healthy': return WARNA.green;
        case 'warning': return WARNA.orange;
        case 'critical': return WARNA.red;
        default: return WARNA.gray;
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'healthy': return 'Sehat';
        case 'warning': return 'Peringatan';
        case 'critical': return 'Kritis';
        default: return 'Offline';
    }
}

function CircularGauge({ value, color, size = 80, strokeWidth = 8, label }: {
    value: number;
    color: string;
    size?: number;
    strokeWidth?: number;
    label: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="gauge-container">
            <svg width={size} height={size} className="gauge">
                <circle
                    className="gauge-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                />
                <circle
                    className="gauge-progress"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    stroke={color}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.6s ease',
                        filter: `drop-shadow(0 0 6px ${color}40)`
                    }}
                />
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize="16"
                    fontWeight="700"
                >
                    {value}%
                </text>
            </svg>
            <div className="gauge-label">{label}</div>
            <style jsx>{`
                .gauge-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .gauge-label {
                    font-size: 0.75rem;
                    color: var(--text-gray);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            `}</style>
        </div>
    );
}

export default function HalamanHealth() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedServer, setSelectedServer] = useState<ServerHealth | null>(null);

    useEffect(() => {
        async function fetchHealth() {
            try {
                const res = await fetch('/api/health');
                const json = await res.json();
                setData(json);
                if (json.servers?.length > 0 && !selectedServer) {
                    setSelectedServer(json.servers[0]);
                }
            } catch (err) {
                console.error('Gagal fetch health:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchHealth();
        const timer = setInterval(fetchHealth, 10000);
        return () => clearInterval(timer);
    }, [selectedServer]);

    function formatTime(timestamp: string) {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    Server Health
                </h2>
                <p>Monitoring kesehatan server secara real-time • <span className="live-badge"><span className="live-dot"></span> Auto-refresh 10s</span></p>
            </div>

            {/* Summary Hero */}
            <div className="summary-hero">
                <div className="hero-card total">
                    <div className="hero-glow"></div>
                    <div className="hero-content">
                        <div className="hero-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="20" height="8" rx="2" />
                                <rect x="2" y="14" width="20" height="8" rx="2" />
                            </svg>
                        </div>
                        <div className="hero-info">
                            <div className="hero-value">{data?.summary?.total || 0}</div>
                            <div className="hero-label">Total Server</div>
                        </div>
                    </div>
                </div>

                <div className="hero-card healthy">
                    <div className="hero-glow"></div>
                    <div className="hero-content">
                        <div className="hero-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="hero-info">
                            <div className="hero-value">{data?.summary?.healthy || 0}</div>
                            <div className="hero-label">Sehat</div>
                        </div>
                    </div>
                </div>

                <div className="hero-card warning">
                    <div className="hero-glow"></div>
                    <div className="hero-content">
                        <div className="hero-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="hero-info">
                            <div className="hero-value">{data?.summary?.warning || 0}</div>
                            <div className="hero-label">Peringatan</div>
                        </div>
                    </div>
                </div>

                <div className="hero-card critical">
                    <div className="hero-glow"></div>
                    <div className="hero-content">
                        <div className="hero-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div className="hero-info">
                            <div className="hero-value">{data?.summary?.critical || 0}</div>
                            <div className="hero-label">Kritis</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="health-layout">
                {/* Server List */}
                <div className="server-list-card">
                    <div className="card-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="20" height="8" rx="2" />
                                <rect x="2" y="14" width="20" height="8" rx="2" />
                            </svg>
                            Daftar Server
                        </h3>
                    </div>
                    <div className="card-body server-list">
                        {data?.servers && data.servers.length > 0 ? (
                            data.servers.map((server) => (
                                <div
                                    key={server.id}
                                    className={`server-item ${selectedServer?.id === server.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedServer(server)}
                                >
                                    <div className="server-status-dot" style={{ background: getStatusColor(server.status) }}></div>
                                    <div className="server-info">
                                        <div className="server-name">{server.name}</div>
                                        <div className="server-meta">
                                            {server.os} • {server.isOnline ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                    <div className="server-quick-stats">
                                        <div className="quick-stat">
                                            <span className="qs-value" style={{ color: server.metrics.cpu > 70 ? WARNA.orange : WARNA.green }}>{server.metrics.cpu}%</span>
                                            <span className="qs-label">CPU</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-list">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                    <rect x="2" y="2" width="20" height="8" rx="2" />
                                    <rect x="2" y="14" width="20" height="8" rx="2" />
                                </svg>
                                <p>Belum ada server terhubung</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Server Detail */}
                <div className="server-detail-card">
                    {selectedServer ? (
                        <>
                            <div className="detail-header">
                                <div className="detail-title">
                                    <div className="status-badge" style={{ background: `${getStatusColor(selectedServer.status)}20`, color: getStatusColor(selectedServer.status) }}>
                                        {getStatusLabel(selectedServer.status)}
                                    </div>
                                    <h3>{selectedServer.name}</h3>
                                    <span className="hostname">{selectedServer.hostname}</span>
                                </div>
                                <div className="uptime-badge">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Uptime: {selectedServer.metrics.uptimeFormatted}
                                </div>
                            </div>

                            {/* Gauges */}
                            <div className="gauges-row">
                                <CircularGauge
                                    value={selectedServer.metrics.cpu}
                                    color={selectedServer.metrics.cpu > 80 ? WARNA.red : selectedServer.metrics.cpu > 60 ? WARNA.orange : WARNA.green}
                                    label="CPU"
                                    size={100}
                                    strokeWidth={10}
                                />
                                <CircularGauge
                                    value={selectedServer.metrics.memory}
                                    color={selectedServer.metrics.memory > 80 ? WARNA.red : selectedServer.metrics.memory > 60 ? WARNA.orange : WARNA.blue}
                                    label="Memory"
                                    size={100}
                                    strokeWidth={10}
                                />
                                <CircularGauge
                                    value={selectedServer.metrics.disk}
                                    color={selectedServer.metrics.disk > 85 ? WARNA.red : selectedServer.metrics.disk > 70 ? WARNA.orange : WARNA.primary}
                                    label="Disk"
                                    size={100}
                                    strokeWidth={10}
                                />
                            </div>

                            {/* Metric Bars */}
                            <div className="metric-bars">
                                <div className="metric-bar-item">
                                    <div className="bar-header">
                                        <span className="bar-label">CPU Usage</span>
                                        <span className="bar-value">{selectedServer.metrics.cpu}%</span>
                                    </div>
                                    <div className="bar-track">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${selectedServer.metrics.cpu}%`,
                                                background: `linear-gradient(90deg, ${WARNA.green}, ${selectedServer.metrics.cpu > 70 ? WARNA.orange : WARNA.green})`
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="metric-bar-item">
                                    <div className="bar-header">
                                        <span className="bar-label">Memory Usage</span>
                                        <span className="bar-value">{selectedServer.metrics.memory}%</span>
                                    </div>
                                    <div className="bar-track">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${selectedServer.metrics.memory}%`,
                                                background: `linear-gradient(90deg, ${WARNA.blue}, ${selectedServer.metrics.memory > 70 ? WARNA.orange : WARNA.blue})`
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="metric-bar-item">
                                    <div className="bar-header">
                                        <span className="bar-label">Disk Usage</span>
                                        <span className="bar-value">{selectedServer.metrics.disk}%</span>
                                    </div>
                                    <div className="bar-track">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${selectedServer.metrics.disk}%`,
                                                background: `linear-gradient(90deg, ${WARNA.primary}, ${selectedServer.metrics.disk > 80 ? WARNA.orange : WARNA.primary})`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="detail-footer">
                                <div className="info-item">
                                    <span className="info-label">OS</span>
                                    <span className="info-value">{selectedServer.os}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Last Seen</span>
                                    <span className="info-value">{formatTime(selectedServer.lastSeen)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                <rect x="2" y="2" width="20" height="8" rx="2" />
                                <rect x="2" y="14" width="20" height="8" rx="2" />
                            </svg>
                            <p>Pilih server untuk melihat detail</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .live-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: ${WARNA.green};
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: ${WARNA.green};
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                .summary-hero {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                @media (max-width: 900px) {
                    .summary-hero { grid-template-columns: repeat(2, 1fr); }
                }

                .hero-card {
                    position: relative;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    padding: 20px;
                    overflow: hidden;
                }

                .hero-glow {
                    position: absolute;
                    top: -40%;
                    right: -40%;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    opacity: 0.15;
                }

                .hero-card.total .hero-glow { background: radial-gradient(circle, ${WARNA.primary} 0%, transparent 70%); }
                .hero-card.total .hero-icon { color: ${WARNA.primary}; background: rgba(124, 92, 255, 0.15); }
                .hero-card.total .hero-value { color: ${WARNA.primary}; }

                .hero-card.healthy .hero-glow { background: radial-gradient(circle, ${WARNA.green} 0%, transparent 70%); }
                .hero-card.healthy .hero-icon { color: ${WARNA.green}; background: rgba(61, 214, 140, 0.15); }
                .hero-card.healthy .hero-value { color: ${WARNA.green}; }

                .hero-card.warning .hero-glow { background: radial-gradient(circle, ${WARNA.orange} 0%, transparent 70%); }
                .hero-card.warning .hero-icon { color: ${WARNA.orange}; background: rgba(255, 170, 51, 0.15); }
                .hero-card.warning .hero-value { color: ${WARNA.orange}; }

                .hero-card.critical .hero-glow { background: radial-gradient(circle, ${WARNA.red} 0%, transparent 70%); }
                .hero-card.critical .hero-icon { color: ${WARNA.red}; background: rgba(255, 90, 90, 0.15); }
                .hero-card.critical .hero-value { color: ${WARNA.red}; }

                .hero-content {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .hero-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hero-value {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .hero-label {
                    font-size: 0.9rem;
                    color: var(--text-gray);
                    margin-top: 4px;
                }

                .health-layout {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 20px;
                }

                @media (max-width: 900px) {
                    .health-layout { grid-template-columns: 1fr; }
                }

                .server-list-card, .server-detail-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    overflow: hidden;
                }

                .card-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-main);
                }

                .card-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1rem;
                    margin: 0;
                }

                .server-list {
                    padding: 8px;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .server-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .server-item:hover {
                    background: var(--bg-hover);
                }

                .server-item.selected {
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.15) 0%, rgba(77, 159, 255, 0.1) 100%);
                    border: 1px solid rgba(124, 92, 255, 0.3);
                }

                .server-status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 8px currentColor;
                }

                .server-info {
                    flex: 1;
                    min-width: 0;
                }

                .server-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .server-meta {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 2px;
                }

                .server-quick-stats {
                    text-align: right;
                }

                .quick-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                .qs-value {
                    font-size: 1rem;
                    font-weight: 600;
                }

                .qs-label {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }

                .server-detail-card {
                    padding: 24px;
                }

                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }

                .detail-title h3 {
                    font-size: 1.5rem;
                    margin: 8px 0 4px;
                }

                .hostname {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .uptime-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--bg-hover);
                    padding: 8px 14px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: var(--text-gray);
                }

                .gauges-row {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    padding: 30px 0;
                    background: linear-gradient(180deg, transparent 0%, rgba(124, 92, 255, 0.05) 50%, transparent 100%);
                    border-radius: 16px;
                    margin-bottom: 24px;
                }

                .metric-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .metric-bar-item {
                    background: var(--bg-hover);
                    padding: 14px 18px;
                    border-radius: 12px;
                }

                .bar-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .bar-label {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                }

                .bar-value {
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .bar-track {
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.6s ease;
                }

                .detail-footer {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-main);
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .info-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }

                .info-value {
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .empty-list, .no-selection {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    color: var(--text-muted);
                    text-align: center;
                }

                .empty-list p, .no-selection p {
                    margin: 12px 0 0;
                    font-size: 0.9rem;
                }
            `}</style>
        </>
    );
}
