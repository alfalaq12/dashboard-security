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
                    {Math.round(value)}%
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
                                                <div key={svc.name} className={`service-item-row ${svc.active ? 'running' : 'stopped'}`}>
                                                    <div className="service-col name">
                                                        <span className="service-dot"></span>
                                                        <span className="service-name">{svc.name}</span>
                                                    </div>
                                                    <div className="service-col metric">
                                                        {(svc.cpu || 0).toFixed(1)}%
                                                    </div>
                                                    <div className="service-col metric">
                                                        {(svc.memory || 0).toFixed(0)} MB
                                                    </div>
                                                    <div className="service-col status">
                                                        {svc.active ? 'Run' : 'Stop'}
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
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 250px);
                    min-height: 500px;
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
                    overflow-y: auto;
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
                    color: var(--text-gray);
                }
                
                .detail-header {
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid var(--border-main);
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                
                .detail-title h3 {
                    font-size: 1.5rem;
                    margin: 0 0 4px 0;
                }
                
                .hostname {
                    color: var(--text-gray);
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                
                .uptime-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 6px 12px;
                    border-radius: 8px;
                    color: var(--text-white);
                    font-size: 0.9rem;
                }

                .gauges-row {
                    display: flex;
                    justify-content: space-around;
                    padding: 30px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid var(--border-main);
                }

                .services-section {
                    padding: 24px;
                    flex: 1;
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                }

                .detail-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--border-main);
                    display: flex;
                    gap: 32px;
                    background: rgba(0, 0, 0, 0.2);
                }
                
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .info-label {
                    font-size: 0.75rem;
                    color: var(--text-gray);
                    text-transform: uppercase;
                }
                
                .info-value {
                    color: var(--text-white);
                    font-weight: 500;
                }

                .no-selection {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-gray);
                }
                
                .no-selection svg {
                    margin-bottom: 16px;
                }
                
                .empty-list {
                    text-align: center;
                    padding: 40px 0;
                    color: var(--text-muted);
                }

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
                    gap: 4px;
                    max-height: 600px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .full-list::-webkit-scrollbar {
                    width: 4px;
                }
                .full-list::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }

                .services-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .services-header h4 {
                    margin: 0;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .table-header-labels {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 0.8fr;
                    gap: 10px;
                    width: 50%;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-align: right;
                    padding-right: 12px;
                }
                .table-header-labels span:first-child { text-align: left; }

                .service-item-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 0.8fr;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: background 0.2s;
                }

                .service-item-row:hover {
                    background: rgba(255, 255, 255, 0.06);
                }

                .service-col.name {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-align: left;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }

                .service-col.metric {
                    text-align: right;
                    font-family: monospace;
                    color: var(--text-gray);
                    font-size: 0.85rem;
                }

                .service-col.status {
                    text-align: right;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .service-item-row.running .service-dot { background: ${WARNA.green}; box-shadow: 0 0 6px ${WARNA.green}; width: 8px; height: 8px; border-radius: 50%; }
                .service-item-row.stopped .service-dot { background: ${WARNA.red}; width: 8px; height: 8px; border-radius: 50%; }
                .service-item-row.running .status { color: ${WARNA.green}; }
                .service-item-row.stopped .status { color: ${WARNA.red}; }
            `}</style>
        </div>
    );
}
