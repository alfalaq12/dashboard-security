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

const WARNA = {
    critical: '#ff4757',
    high: '#ff6b35',
    medium: '#ffa502',
    low: '#2ed573',
    backdoor: '#a855f7',
    miner: '#f59e0b',
    blue: '#4d9fff',
    gray: '#606078'
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
        return category === 'cryptominer' ? '⛏️' : '🐚';
    }

    function getCategoryLabel(category: string) {
        return category === 'cryptominer' ? 'Crypto Miner' : 'Backdoor';
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
            {/* Header */}
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                    Threat Scanner
                </h2>
                <p>Deteksi backdoor, webshell, dan crypto miner secara real-time</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(77, 159, 255, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.blue} strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Total Threats</div>
                        <div className="value info">{stats.total}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 71, 87, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.critical} strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Critical</div>
                        <div className="value danger">{stats.critical}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 107, 53, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.high} strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">High</div>
                        <div className="value warning">{stats.high}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.backdoor} strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Backdoors</div>
                        <div className="value" style={{ color: WARNA.backdoor }}>{stats.backdoors}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.miner} strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Crypto Miners</div>
                        <div className="value" style={{ color: WARNA.miner }}>{stats.miners}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5}>
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        <span style={{ color: '#a1a1aa', fontSize: 14 }}>Filter:</span>
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Semua Kategori</option>
                        <option value="backdoor">🐚 Backdoor</option>
                        <option value="cryptominer">⛏️ Crypto Miner</option>
                    </select>

                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Semua Level</option>
                        <option value="critical">🔴 Critical</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>

                    <select
                        value={filterNode}
                        onChange={(e) => setFilterNode(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Semua Server</option>
                        {nodes.map(node => (
                            <option key={node} value={node}>{node}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Threats List */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M12 8v4" />
                            <path d="M12 16h.01" />
                        </svg>
                        Daftar Ancaman
                    </h3>
                    <span className={`badge ${stats.total > 0 ? 'danger' : 'online'}`}>
                        {stats.total} Threat{stats.total !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="card-body">
                    {threats.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon-empty">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h4>Tidak ada ancaman terdeteksi</h4>
                            <p>Server Anda aman! Scanner terus memantau backdoor dan crypto miner.</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Kategori</th>
                                    <th>Tipe</th>
                                    <th>Level</th>
                                    <th>Lokasi</th>
                                    <th>Server</th>
                                    <th>Waktu</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {threats.map((threat) => (
                                    <tr key={threat.id}>
                                        <td>
                                            <span style={{ fontSize: 18, marginRight: 8 }}>{getCategoryIcon(threat.data.category)}</span>
                                            {getCategoryLabel(threat.data.category)}
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>
                                            {threat.data.threat_type.replace(/_/g, ' ')}
                                        </td>
                                        <td>
                                            <span className={`badge ${threat.data.threat_level === 'critical' ? 'danger' :
                                                threat.data.threat_level === 'high' ? 'warning' :
                                                    threat.data.threat_level === 'medium' ? 'info' : 'online'
                                                }`}>
                                                {threat.data.threat_level}
                                            </span>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: 12 }}>
                                                {(threat.data.file_path || threat.data.process_name || threat.data.network_conn || '-').slice(-40)}
                                            </code>
                                        </td>
                                        <td>{threat.nodeName}</td>
                                        <td>{formatWaktu(threat.timestamp)}</td>
                                        <td>
                                            <button
                                                className="btn-small"
                                                onClick={() => setSelectedThreat(threat)}
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedThreat && (
                <div className="modal-overlay" onClick={() => setSelectedThreat(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 32 }}>{getCategoryIcon(selectedThreat.data.category)}</span>
                                <div>
                                    <h3 style={{ margin: 0, marginBottom: 4 }}>{getCategoryLabel(selectedThreat.data.category)} Terdeteksi</h3>
                                    <span style={{ color: '#a1a1aa', fontSize: 14, textTransform: 'capitalize' }}>
                                        {selectedThreat.data.threat_type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedThreat(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Tingkat Ancaman</label>
                                    <span className={`badge ${selectedThreat.data.threat_level === 'critical' ? 'danger' :
                                        selectedThreat.data.threat_level === 'high' ? 'warning' :
                                            selectedThreat.data.threat_level === 'medium' ? 'info' : 'online'
                                        }`} style={{ textTransform: 'uppercase' }}>
                                        {selectedThreat.data.threat_level}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <label>Server</label>
                                    <span>{selectedThreat.nodeName}</span>
                                </div>

                                <div className="detail-item">
                                    <label>Terdeteksi Pada</label>
                                    <span>{new Date(selectedThreat.timestamp).toLocaleString('id-ID')}</span>
                                </div>

                                {selectedThreat.data.file_path && (
                                    <div className="detail-item full-width">
                                        <label>Path File</label>
                                        <code className="code-block">{selectedThreat.data.file_path}</code>
                                    </div>
                                )}

                                {selectedThreat.data.process_name && (
                                    <>
                                        <div className="detail-item">
                                            <label>Nama Proses</label>
                                            <span>{selectedThreat.data.process_name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>PID</label>
                                            <span>{selectedThreat.data.process_id}</span>
                                        </div>
                                        {selectedThreat.data.cpu_percent !== undefined && (
                                            <div className="detail-item">
                                                <label>CPU Usage</label>
                                                <span style={{ color: selectedThreat.data.cpu_percent > 90 ? WARNA.critical : 'inherit' }}>
                                                    {selectedThreat.data.cpu_percent.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selectedThreat.data.network_conn && (
                                    <div className="detail-item full-width">
                                        <label>Koneksi Network</label>
                                        <code className="code-block" style={{ color: WARNA.miner }}>{selectedThreat.data.network_conn}</code>
                                    </div>
                                )}

                                <div className="detail-item full-width">
                                    <label>Rules yang Terdeteksi</label>
                                    <div className="rules-list">
                                        {selectedThreat.data.matched_rules.map((rule, i) => (
                                            <div key={i} className="rule-item">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WARNA.critical} strokeWidth="2">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                </svg>
                                                {rule}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedThreat.data.snippet && (
                                    <div className="detail-item full-width">
                                        <label>Kode Mencurigakan</label>
                                        <pre className="code-snippet">{selectedThreat.data.snippet}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .filter-select {
                    padding: 8px 14px;
                    background: #1a1a24;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #e4e4e7;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .filter-select:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: #1f1f2e;
                }
                .filter-select:focus {
                    outline: none;
                    border-color: #4d9fff;
                    background: #1a1a24;
                }
                .filter-select option {
                    background: #1a1a24;
                    color: #e4e4e7;
                    padding: 8px;
                }
                .btn-small {
                    padding: 6px 12px;
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.2));
                    border: 1px solid rgba(124, 92, 255, 0.3);
                    border-radius: 6px;
                    color: #a5b4fc;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-small:hover {
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.3), rgba(77, 159, 255, 0.3));
                    transform: translateY(-1px);
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-content {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow: auto;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-close {
                    background: none;
                    border: none;
                    color: #a1a1aa;
                    font-size: 28px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                .modal-body {
                    padding: 24px;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .detail-item.full-width {
                    grid-column: 1 / -1;
                }
                .detail-item label {
                    font-size: 12px;
                    color: #a1a1aa;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .detail-item span {
                    color: #e4e4e7;
                }
                .code-block {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-family: 'Fira Code', monospace;
                    font-size: 13px;
                    color: #10b981;
                    word-break: break-all;
                }
                .rules-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .rule-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 71, 87, 0.1);
                    border: 1px solid rgba(255, 71, 87, 0.2);
                    padding: 10px 14px;
                    border-radius: 8px;
                    color: #fca5a5;
                    font-size: 13px;
                }
                .code-snippet {
                    background: #0d0d14;
                    padding: 16px;
                    border-radius: 8px;
                    font-family: 'Fira Code', monospace;
                    font-size: 12px;
                    color: #e4e4e7;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    word-break: break-all;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin: 0;
                }
            `}</style>
        </>
    );
}
