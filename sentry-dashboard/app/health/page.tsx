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

interface ServiceInfo {
    name: string;
    status: string;
    active: boolean;
    cpu?: number;
    memory?: number;
}

interface NodeServices {
    nodeName: string;
    services: ServiceInfo[];
    summary: {
        total: number;
        running: number;
        stopped: number;
    };
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

function CircularGauge({ value, color, size = 80, strokeWidth = 8, label, showValue = true }: {
    value: number;
    color: string;
    size?: number;
    strokeWidth?: number;
    label: string;
    showValue?: boolean;
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
                {showValue && (
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={color}
                        fontSize={size > 40 ? "16" : "10"}
                        fontWeight="700"
                    >
                        {Math.round(value)}%
                    </text>
                )}
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
        </div >
    );
}

export default function HalamanHealth() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedServer, setSelectedServer] = useState<ServerHealth | null>(null);
    const [services, setServices] = useState<NodeServices | null>(null);

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

    // Fetch services untuk selected server
    useEffect(() => {
        async function fetchServices() {
            if (!selectedServer) return;
            try {
                const res = await fetch('/api/services');
                const json = await res.json();
                const nodeService = json.nodes?.find((n: NodeServices) => n.nodeName === selectedServer.name);
                setServices(nodeService || null);
            } catch (err) {
                console.error('Gagal fetch services:', err);
            }
        }

        fetchServices();
        const timer = setInterval(fetchServices, 30000);
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
            <div className="premium-loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Loading Health Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="premium-dashboard">
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    Server Health
                </h2>
                <p>Monitoring kesehatan server secara real-time • <span className="live-badge"><span className="live-dot"></span> Auto-refresh 10s</span></p>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(77, 159, 255, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.blue} strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Total Server</div>
                        <div className="value info">{data?.summary?.total || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(61, 214, 140, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.green} strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Sehat</div>
                        <div className="value success">{data?.summary?.healthy || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 170, 51, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.orange} strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Peringatan</div>
                        <div className="value warning">{data?.summary?.warning || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 90, 90, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.red} strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Kritis</div>
                        <div className="value danger">{data?.summary?.critical || 0}</div>
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
                                            <span className="qs-value" style={{ color: server.metrics.cpu > 70 ? WARNA.orange : WARNA.green }}>{Math.round(server.metrics.cpu)}%</span>
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
                            {/* Hero Section: Info & Gauges Side-by-Side */}
                            <div className="hero-section">
                                <div className="detail-header-content">
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

                                <div className="gauges-container-right">
                                    <div className="gauge-item-small">
                                        <CircularGauge
                                            value={selectedServer.metrics.cpu}
                                            color={selectedServer.metrics.cpu > 80 ? WARNA.red : selectedServer.metrics.cpu > 60 ? WARNA.orange : WARNA.green}
                                            label="CPU"
                                            size={70}
                                            strokeWidth={6}
                                        />
                                    </div>
                                    <div className="gauge-item-small">
                                        <CircularGauge
                                            value={selectedServer.metrics.memory}
                                            color={selectedServer.metrics.memory > 80 ? WARNA.red : selectedServer.metrics.memory > 60 ? WARNA.orange : WARNA.blue}
                                            label="MEM"
                                            size={70}
                                            strokeWidth={6}
                                        />
                                    </div>
                                    <div className="gauge-item-small">
                                        <CircularGauge
                                            value={selectedServer.metrics.disk}
                                            color={selectedServer.metrics.disk > 85 ? WARNA.red : selectedServer.metrics.disk > 70 ? WARNA.orange : WARNA.primary}
                                            label="DISK"
                                            size={70}
                                            strokeWidth={6}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Services Status */}
                            {services && services.services.length > 0 && (
                                <div className="services-section">
                                    <div className="services-header">
                                        <h4>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="3" />
                                                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                            </svg>
                                            Status Services ({services.summary.running}/{services.summary.total} Running)
                                        </h4>
                                        <div className="table-header-labels">
                                            <span>Service</span>
                                            <span>CPU</span>
                                            <span>Mem</span>
                                            <span>Status</span>
                                        </div>
                                    </div>
                                    <div className="services-grid full-list">
                                        {services.services
                                            .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
                                            .map((svc) => (
                                                <div key={svc.name} className={`cyber-service-row ${svc.active ? 'running' : 'stopped'}`}>
                                                    <div className="service-info-col">
                                                        <div className={`status-beacon ${svc.active ? 'active' : ''}`}></div>
                                                        <div className="service-name">{svc.name}</div>
                                                    </div>

                                                    <div className="metric-group">
                                                        <div className="mini-gauge-wrapper">
                                                            <CircularGauge
                                                                value={svc.cpu || 0}
                                                                color={(svc.cpu || 0) > 50 ? WARNA.red : (svc.cpu || 0) > 20 ? WARNA.orange : WARNA.green}
                                                                size={32}
                                                                strokeWidth={4}
                                                                label=""
                                                                showValue={false}
                                                            />
                                                        </div>
                                                        <div className="metric-text-wrapper">
                                                            <span className="metric-value">{(svc.cpu || 0).toFixed(1)}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="metric-group">
                                                        <div className="mini-gauge-wrapper">
                                                            <CircularGauge
                                                                value={(svc.memory || 0) / 4096 * 100}
                                                                color={(svc.memory || 0) > 1024 ? WARNA.orange : WARNA.blue}
                                                                size={32}
                                                                strokeWidth={4}
                                                                label=""
                                                                showValue={false}
                                                            />
                                                        </div>
                                                        <div className="metric-text-wrapper">
                                                            <span className="metric-value">{(svc.memory || 0).toFixed(0)} MB</span>
                                                        </div>
                                                    </div>

                                                    <div className="service-status-col">
                                                        <span className={`cyber-badge ${svc.active ? 'run' : 'stop'}`}>
                                                            {svc.active ? 'RUN' : 'STOP'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Detail Footer */}
                            <div className="detail-footer">
                                <div className="info-item">
                                    <span className="info-label">OS System</span>
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
                    font-size: 0.85rem;
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

                .health-layout {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 20px;
                    margin-top: 24px;
                }

                @media (max-width: 900px) {
                    .health-layout { grid-template-columns: 1fr; }
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }
                
                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                }

                .stat-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-info .label {
                    color: var(--text-gray);
                    font-size: 0.85rem;
                    margin-bottom: 4px;
                }

                .stat-info .value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-white);
                }
                
                .value.success { color: ${WARNA.green}; }
                .value.warning { color: ${WARNA.orange}; }
                .value.danger { color: ${WARNA.red}; }

                .server-list-card, .server-detail-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    overflow: visible; /* Changed from hidden to visible */
                    display: flex;
                    flex-direction: column;
                    min-height: 500px; /* Removed fixed height, keeping min-height */
                }

                .detail-footer {
                    padding: 20px 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
                    backdrop-filter: blur(10px);
                }
                .hero-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 30px;
                    border-bottom: 1px solid var(--border-main);
                    background: linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.1));
                }

                .detail-header-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .gauges-container-right {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding-left: 30px;
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .gauge-item-small {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    width: fit-content;
                }
                
                .detail-title h3 {
                    font-size: 1.6rem;
                    margin: 8px 0 4px 0;
                    letter-spacing: -0.5px;
                }
                
                .hostname {
                    color: var(--text-gray);
                    font-family: monospace;
                    font-size: 0.95rem;
                }
                
                .uptime-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 6px 14px;
                    border-radius: 8px;
                    color: var(--text-white);
                    font-size: 0.85rem;
                    width: fit-content;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }    
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .info-label {
                    font-size: 0.7rem;
                    color: var(--text-gray);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    font-weight: 600;
                }
                
                .info-value {
                    color: var(--text-white);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                .card-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-main);
                    flex-shrink: 0;
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
                    /* overflow-y removed to let it grow */
                    flex: 1;
                }

                .server-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                }

                /* ... (rest of server-item styles unrelated to this change) ... */
                
                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                /* Services Table Styles */
                .full-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px; /* Increased gap from 8px to 16px for spacing */
                    /* max-height removed */
                    padding-right: 4px;
                }
                
                .services-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .table-header-labels {
                    display: grid;
                    grid-template-columns: 2.5fr 1.2fr 1.2fr 0.8fr;
                    gap: 24px;
                    width: 100%;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-align: left;
                    padding: 0 20px;
                }
                .table-header-labels span:first-child { text-align: left; }

                /* Cyberpunk Service Row Styles */
                .cyber-service-row {
                    display: grid;
                    grid-template-columns: 2.5fr 1.2fr 1.2fr 0.8fr;
                    align-items: center;
                    gap: 24px;
                    padding: 16px 20px;
                    background: rgba(15, 20, 30, 0.4); /* Slightly improved transparency */
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    position: relative;
                    /* overflow hidden removed to fix gauge clipping if necessary, 
                       but keeping it for border-radius effects usually. 
                       Let's keep it but ensure height is sufficient. */
                    min-height: 64px;
                    backdrop-filter: blur(4px); /* Glass effect */
                }

                .cyber-service-row:hover {
                    background: rgba(30, 35, 55, 0.8);
                    border-color: rgba(124, 92, 255, 0.5);
                    box-shadow: 0 0 20px rgba(124, 92, 255, 0.2); /* Stronger glow */
                    transform: translateY(-2px) scale(1.005); /* Subtle scale */
                    z-index: 10;
                }
                
                .cyber-service-row::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 4px;
                    background: transparent;
                    transition: background 0.3s;
                    border-radius: 4px 0 0 4px;
                }

                .cyber-service-row.running::before {
                    background: ${WARNA.green};
                    box-shadow: 0 0 8px ${WARNA.green};
                }
                
                .cyber-service-row.stopped::before {
                    background: ${WARNA.gray};
                }

                .service-info-col {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .status-beacon {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #444;
                }

                .status-beacon.active {
                    background: ${WARNA.green};
                    box-shadow: 0 0 8px ${WARNA.green}, 0 0 12px ${WARNA.green};
                    animation: pulse-beacon 2s infinite;
                }

                @keyframes pulse-beacon {
                    0% { box-shadow: 0 0 8px ${WARNA.green}; }
                    50% { box-shadow: 0 0 16px ${WARNA.green}; }
                    100% { box-shadow: 0 0 8px ${WARNA.green}; }
                }

                .service-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: #fff;
                    letter-spacing: 0.5px;
                }

                .service-metrics-col {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                }

                .metric-group {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    justify-content: center; /* Center in grid cell */
                }

                .mini-gauge-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .metric-text-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .metric-value {
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #fff;
                    text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
                }

                .metric-label {
                    font-size: 0.65rem;
                    color: var(--text-gray);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .service-status-col {
                    display: flex;
                    justify-content: flex-end;
                }

                .cyber-badge {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    padding: 4px 12px;
                    border-radius: 4px;
                    letter-spacing: 1px;
                    font-weight: 700;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    text-transform: uppercase;
                }

                .cyber-badge.run {
                    color: ${WARNA.green};
                    background: rgba(61, 214, 140, 0.1);
                    border: 1px solid rgba(61, 214, 140, 0.3);
                    box-shadow: 0 0 5px rgba(61, 214, 140, 0.1);
                }

                .cyber-badge.run:hover {
                    background: rgba(61, 214, 140, 0.2);
                    box-shadow: 0 0 10px rgba(61, 214, 140, 0.4);
                    text-shadow: 0 0 5px ${WARNA.green};
                }

                .cyber-badge.stop {
                    color: ${WARNA.gray};
                    background: rgba(96, 96, 120, 0.1);
                    border: 1px solid rgba(96, 96, 120, 0.3);
                }

                .cyber-badge.stop:hover {
                    background: rgba(96, 96, 120, 0.2);
                    border-color: rgba(96, 96, 120, 0.5);
                    color: #fff;
                }
            `}</style>
        </div>
    );
}
