'use client';

import { useEffect, useState } from 'react';

interface ThreatData {
    file_path?: string;
    process_name?: string;
    process_id?: number;
    process_cmdline?: string;
    cpu_percent?: number;
    file_name?: string;
    file_size?: number;
    modified_at?: string;
    permissions?: string;
    category: string;
    threat_type: string;
    threat_level: string;
    matched_rules: string[];
    snippet?: string;
    network_conn?: string;
}

interface Threat {
    id: string;
    nodeName: string;
    timestamp: string;
    receivedAt: string;
    data: ThreatData;
}

interface Stats {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    backdoors: number;
    miners: number;
}

// Premium SVG Icons
const Icons = {
    shield: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    shieldAlert: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    ),
    alertTriangle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    alertCircle: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    terminal: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    ),
    cpu: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
    ),
    filter: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    file: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    server: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    ),
    clock: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    check: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    x: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    bug: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="6" width="8" height="14" rx="4" />
            <path d="M19 12h2" />
            <path d="M3 12h2" />
            <path d="M17 6l2-2" />
            <path d="M5 6L3 4" />
            <path d="M17 18l2 2" />
            <path d="M5 18L3 20" />
            <path d="M12 6V2" />
        </svg>
    ),
    zap: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
};

export default function HalamanThreats() {
    const [threats, setThreats] = useState<Threat[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, critical: 0, high: 0, medium: 0, low: 0, backdoors: 0, miners: 0 });
    const [nodes, setNodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterLevel, setFilterLevel] = useState<string>('');
    const [filterNode, setFilterNode] = useState<string>('');

    useEffect(() => {
        fetchThreats();
        const interval = setInterval(fetchThreats, 10000);
        return () => clearInterval(interval);
    }, [filterCategory, filterLevel, filterNode]);

    async function fetchThreats() {
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.set('category', filterCategory);
            if (filterLevel) params.set('level', filterLevel);
            if (filterNode) params.set('node', filterNode);

            const res = await fetch(`/api/threats?${params.toString()}`);
            const data = await res.json();
            setThreats(data.threats || []);
            setStats(data.stats || { total: 0, critical: 0, high: 0, medium: 0, low: 0, backdoors: 0, miners: 0 });
            setNodes(data.nodes || []);
        } catch (error) {
            console.error('Error fetching threats:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatWaktu(timestamp: string) {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getCategoryIcon(category: string) {
        if (category === 'cryptominer') {
            return (
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                }}>
                    {Icons.cpu}
                </div>
            );
        }
        return (
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
            }}>
                {Icons.terminal}
            </div>
        );
    }

    function getCategoryLabel(category: string) {
        return category === 'cryptominer' ? 'Crypto Miner' : 'Backdoor';
    }

    function getLevelStyle(level: string) {
        const styles: Record<string, { bg: string; border: string; color: string }> = {
            critical: { bg: 'rgba(255, 71, 87, 0.12)', border: 'rgba(255, 71, 87, 0.3)', color: '#ff4757' },
            high: { bg: 'rgba(255, 107, 53, 0.12)', border: 'rgba(255, 107, 53, 0.3)', color: '#ff6b35' },
            medium: { bg: 'rgba(255, 165, 2, 0.12)', border: 'rgba(255, 165, 2, 0.3)', color: '#ffa502' },
            low: { bg: 'rgba(46, 213, 115, 0.12)', border: 'rgba(46, 213, 115, 0.3)', color: '#2ed573' },
        };
        return styles[level] || styles.low;
    }

    if (loading) {
        return (
            <div className="premium-loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Scanning for threats...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="premium-dashboard">
                {/* Page Header */}
                <div className="dashboard-header">
                    <div className="header-left">
                        <h1>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.15))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '14px',
                                boxShadow: '0 4px 20px rgba(124, 92, 255, 0.2)',
                                color: '#a5b4fc',
                            }}>
                                {Icons.shieldAlert}
                            </div>
                            Threat Scanner
                        </h1>
                        <p className="header-subtitle">Real-time detection of backdoors, webshells, and crypto miners</p>
                    </div>
                    <div className="header-right">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                        }}>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="premium-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {/* Total Threats */}
                    <div className="stat-card-premium" style={{ borderLeft: '3px solid #4d9fff' }}>
                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(77, 159, 255, 0.2), rgba(56, 189, 248, 0.1))' }}>
                            <span style={{ color: '#4d9fff' }}>{Icons.shield}</span>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value" style={{ color: '#4d9fff' }}>{stats.total}</span>
                            <span className="stat-label">Total Threats</span>
                        </div>
                    </div>

                    {/* Critical */}
                    <div className="stat-card-premium" style={{ borderLeft: '3px solid #ff4757' }}>
                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 107, 107, 0.1))' }}>
                            <span style={{ color: '#ff4757' }}>{Icons.alertTriangle}</span>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value" style={{ color: '#ff4757' }}>{stats.critical}</span>
                            <span className="stat-label">Critical</span>
                        </div>
                    </div>

                    {/* High */}
                    <div className="stat-card-premium" style={{ borderLeft: '3px solid #ff6b35' }}>
                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 140, 0, 0.1))' }}>
                            <span style={{ color: '#ff6b35' }}>{Icons.alertCircle}</span>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value" style={{ color: '#ff6b35' }}>{stats.high}</span>
                            <span className="stat-label">High</span>
                        </div>
                    </div>

                    {/* Backdoors */}
                    <div className="stat-card-premium" style={{ borderLeft: '3px solid #a855f7' }}>
                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1))' }}>
                            <span style={{ color: '#a855f7' }}>{Icons.bug}</span>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value" style={{ color: '#a855f7' }}>{stats.backdoors}</span>
                            <span className="stat-label">Backdoors</span>
                        </div>
                    </div>

                    {/* Crypto Miners */}
                    <div className="stat-card-premium" style={{ borderLeft: '3px solid #f59e0b' }}>
                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))' }}>
                            <span style={{ color: '#f59e0b' }}>{Icons.zap}</span>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.miners}</span>
                            <span className="stat-label">Crypto Miners</span>
                        </div>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="premium-card" style={{ marginBottom: '24px' }}>
                    <div className="card-body" style={{ padding: '18px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#808090' }}>
                            {Icons.filter}
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Filters</span>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="premium-select">
                            <option value="">All Categories</option>
                            <option value="backdoor">Backdoor / Webshell</option>
                            <option value="cryptominer">Crypto Miner</option>
                        </select>

                        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="premium-select">
                            <option value="">All Levels</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <select value={filterNode} onChange={(e) => setFilterNode(e.target.value)} className="premium-select">
                            <option value="">All Servers</option>
                            {nodes.map(node => (
                                <option key={node} value={node}>{node}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Threats List */}
                <div className="premium-card">
                    <div className="card-header">
                        <div className="header-title">
                            {Icons.shieldAlert}
                            <h3>Detected Threats</h3>
                        </div>
                        <span className={`count-badge ${stats.total > 0 ? 'danger' : 'success'}`}>
                            {stats.total} detected
                        </span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {threats.length === 0 ? (
                            <div className="empty-state-premium" style={{ padding: '60px 20px' }}>
                                <div style={{
                                    color: '#2ed573',
                                    marginBottom: '16px',
                                    opacity: 0.7,
                                }}>
                                    {Icons.check}
                                </div>
                                <h4>No Threats Detected</h4>
                                <p>Your servers are secure. The scanner continuously monitors for backdoors and crypto miners.</p>
                            </div>
                        ) : (
                            <div className="threats-table-wrapper">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Type</th>
                                            <th>Level</th>
                                            <th>Location</th>
                                            <th>Server</th>
                                            <th>Time</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {threats.map((threat) => {
                                            const levelStyle = getLevelStyle(threat.data.threat_level);
                                            return (
                                                <tr key={threat.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {getCategoryIcon(threat.data.category)}
                                                            <span style={{ fontWeight: 500 }}>{getCategoryLabel(threat.data.category)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ textTransform: 'capitalize', color: '#a0a0b0' }}>
                                                            {threat.data.threat_type.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            padding: '5px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase',
                                                            background: levelStyle.bg,
                                                            border: `1px solid ${levelStyle.border}`,
                                                            color: levelStyle.color,
                                                        }}>
                                                            {threat.data.threat_level}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <code style={{
                                                            fontSize: '0.8rem',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            color: '#10b981',
                                                        }}>
                                                            {(threat.data.file_path || threat.data.process_name || threat.data.network_conn || '-').slice(-35)}
                                                        </code>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0b0' }}>
                                                            {Icons.server}
                                                            {threat.nodeName}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#707080' }}>
                                                            {Icons.clock}
                                                            {formatWaktu(threat.timestamp)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn-view-detail"
                                                            onClick={() => setSelectedThreat(threat)}
                                                        >
                                                            {Icons.eye}
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedThreat && (
                <div className="threat-modal-overlay" onClick={() => setSelectedThreat(null)}>
                    <div className="threat-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="threat-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {getCategoryIcon(selectedThreat.data.category)}
                                <div>
                                    <h3>{getCategoryLabel(selectedThreat.data.category)} Detected</h3>
                                    <span style={{ color: '#808090', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                        {selectedThreat.data.threat_type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            <button className="threat-modal-close" onClick={() => setSelectedThreat(null)}>
                                {Icons.x}
                            </button>
                        </div>

                        <div className="threat-modal-body">
                            <div className="detail-grid">
                                <div className="detail-card">
                                    <span className="detail-label">Threat Level</span>
                                    <span className="detail-value" style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        ...getLevelStyle(selectedThreat.data.threat_level),
                                        background: getLevelStyle(selectedThreat.data.threat_level).bg,
                                        border: `1px solid ${getLevelStyle(selectedThreat.data.threat_level).border}`,
                                    }}>
                                        {selectedThreat.data.threat_level}
                                    </span>
                                </div>

                                <div className="detail-card">
                                    <span className="detail-label">Server</span>
                                    <span className="detail-value">{selectedThreat.nodeName}</span>
                                </div>

                                <div className="detail-card">
                                    <span className="detail-label">Detected At</span>
                                    <span className="detail-value">{new Date(selectedThreat.timestamp).toLocaleString('id-ID')}</span>
                                </div>

                                {selectedThreat.data.file_path && (
                                    <div className="detail-card full-width">
                                        <span className="detail-label">File Path</span>
                                        <code className="code-block">{selectedThreat.data.file_path}</code>
                                    </div>
                                )}

                                {selectedThreat.data.process_name && (
                                    <>
                                        <div className="detail-card">
                                            <span className="detail-label">Process Name</span>
                                            <span className="detail-value">{selectedThreat.data.process_name}</span>
                                        </div>
                                        <div className="detail-card">
                                            <span className="detail-label">PID</span>
                                            <span className="detail-value">{selectedThreat.data.process_id}</span>
                                        </div>
                                        {selectedThreat.data.cpu_percent !== undefined && (
                                            <div className="detail-card">
                                                <span className="detail-label">CPU Usage</span>
                                                <span className="detail-value" style={{ color: selectedThreat.data.cpu_percent > 90 ? '#ff4757' : '#fff' }}>
                                                    {selectedThreat.data.cpu_percent.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedThreat.data.network_conn && (
                                    <div className="detail-card full-width">
                                        <span className="detail-label">Network Connection</span>
                                        <code className="code-block warning">{selectedThreat.data.network_conn}</code>
                                    </div>
                                )}

                                <div className="detail-card full-width">
                                    <span className="detail-label">Matched Rules</span>
                                    <div className="rules-list">
                                        {selectedThreat.data.matched_rules.map((rule, i) => (
                                            <div key={i} className="rule-chip">
                                                {Icons.alertTriangle}
                                                {rule}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedThreat.data.snippet && (
                                    <div className="detail-card full-width">
                                        <span className="detail-label">Suspicious Code</span>
                                        <pre className="code-snippet">{selectedThreat.data.snippet}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .premium-select {
                    padding: 10px 16px;
                    background: #14141e;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    color: #e4e4e7;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 150px;
                }
                .premium-select:hover {
                    border-color: rgba(255, 255, 255, 0.15);
                    background: #1a1a28;
                }
                .premium-select:focus {
                    outline: none;
                    border-color: #7c5cff;
                }
                .premium-select option {
                    background: #14141e;
                    color: #e4e4e7;
                    padding: 10px;
                }

                .count-badge {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .count-badge.danger {
                    background: rgba(255, 71, 87, 0.12);
                    color: #ff4757;
                    border: 1px solid rgba(255, 71, 87, 0.25);
                }
                .count-badge.success {
                    background: rgba(46, 213, 115, 0.12);
                    color: #2ed573;
                    border: 1px solid rgba(46, 213, 115, 0.25);
                }

                .threats-table-wrapper {
                    overflow-x: auto;
                }
                .premium-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .premium-table th {
                    text-align: left;
                    padding: 16px 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #707080;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .premium-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    color: #e4e4e7;
                }
                .premium-table tr:hover td {
                    background: rgba(124, 92, 255, 0.03);
                }

                .btn-view-detail {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(77, 159, 255, 0.1));
                    border: 1px solid rgba(124, 92, 255, 0.25);
                    border-radius: 8px;
                    color: #a5b4fc;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-view-detail:hover {
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.25), rgba(77, 159, 255, 0.2));
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(124, 92, 255, 0.2);
                }

                .threat-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .threat-modal {
                    background: linear-gradient(160deg, #1a1a28 0%, #12121a 100%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 640px;
                    max-height: 90vh;
                    overflow: auto;
                    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
                }
                .threat-modal-header {
                    padding: 24px 28px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .threat-modal-header h3 {
                    margin: 0 0 4px;
                    color: #fff;
                    font-size: 1.15rem;
                }
                .threat-modal-close {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    border-radius: 10px;
                    color: #707080;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .threat-modal-close:hover {
                    background: rgba(255, 90, 90, 0.15);
                    color: #ff6b6b;
                }
                .threat-modal-body {
                    padding: 28px;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 16px;
                }
                .detail-card {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .detail-card.full-width {
                    grid-column: 1 / -1;
                }
                .detail-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #707080;
                }
                .detail-value {
                    color: #fff;
                    font-weight: 500;
                }
                .code-block {
                    background: rgba(0, 0, 0, 0.4);
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.85rem;
                    color: #10b981;
                    word-break: break-all;
                }
                .code-block.warning {
                    color: #f59e0b;
                }
                .rules-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .rule-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: rgba(255, 71, 87, 0.08);
                    border: 1px solid rgba(255, 71, 87, 0.2);
                    border-radius: 8px;
                    color: #fca5a5;
                    font-size: 0.85rem;
                }
                .rule-chip svg {
                    width: 14px;
                    height: 14px;
                    color: #ff6b6b;
                }
                .code-snippet {
                    background: #0a0a10;
                    padding: 16px;
                    border-radius: 10px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.8rem;
                    color: #e4e4e7;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    word-break: break-all;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    margin: 0;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}
