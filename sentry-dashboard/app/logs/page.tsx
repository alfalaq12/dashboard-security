'use client';

import { useEffect, useState, useCallback } from 'react';

interface LogEntry {
    id: string;
    nodeName: string;
    type: string;
    timestamp: string;
    data: Record<string, unknown>;
    receivedAt: string;
}

interface LogsResponse {
    totalLogs: number;
    logs: LogEntry[];
    filters: {
        nodes: string[];
        types: string[];
    };
}

const WARNA = {
    blue: '#4d9fff',
    green: '#3dd68c',
    red: '#ff5a5a',
    orange: '#ffaa33',
    purple: '#7c5cff',
    gray: '#606078'
};

function getTypeColor(type: string) {
    switch (type) {
        case 'ssh_event': return WARNA.red;
        case 'heartbeat': return WARNA.green;
        case 'metrics': return WARNA.blue;
        default: return WARNA.purple;
    }
}

function getTypeLabel(type: string) {
    switch (type) {
        case 'ssh_event': return 'SSH';
        case 'heartbeat': return 'Heartbeat';
        case 'metrics': return 'Metrics';
        default: return type;
    }
}

export default function HalamanLogs() {
    const [data, setData] = useState<LogsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterNode, setFilterNode] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filterType !== 'all') params.set('type', filterType);
            if (filterNode !== 'all') params.set('node', filterNode);

            const res = await fetch(`/api/logs?${params.toString()}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Gagal fetch logs:', err);
        } finally {
            setLoading(false);
        }
    }, [search, filterType, filterNode]);

    useEffect(() => {
        fetchLogs();
        let timer: NodeJS.Timeout;
        if (autoRefresh) {
            timer = setInterval(fetchLogs, 5000);
        }
        return () => clearInterval(timer);
    }, [fetchLogs, autoRefresh]);

    function formatWaktu(timestamp: string) {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    function handleExport(format: 'json' | 'csv') {
        if (!data?.logs) return;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const headers = ['ID', 'Timestamp', 'Node', 'Type', 'Data'];
            const rows = data.logs.map(log => [
                log.id,
                log.timestamp,
                log.nodeName,
                log.type,
                JSON.stringify(log.data)
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Logs Viewer
                </h2>
                <p>Lihat semua log dari server secara real-time</p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari log..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">Semua Tipe</option>
                    {data?.filters?.types?.map((t) => (
                        <option key={t} value={t}>{getTypeLabel(t)}</option>
                    ))}
                </select>

                <select value={filterNode} onChange={(e) => setFilterNode(e.target.value)}>
                    <option value="all">Semua Server</option>
                    {data?.filters?.nodes?.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>

                <label className="toggle-refresh">
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <span>Auto Refresh</span>
                </label>

                <div className="export-buttons">
                    <button className="btn-export" onClick={() => handleExport('json')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        JSON
                    </button>
                    <button className="btn-export" onClick={() => handleExport('csv')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        CSV
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="logs-stats">
                <span className="stat-item">
                    <strong>{data?.totalLogs || 0}</strong> logs ditemukan
                </span>
                {autoRefresh && (
                    <span className="refresh-indicator">
                        <span className="pulse-dot"></span>
                        Live
                    </span>
                )}
            </div>

            {/* Logs Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {data?.logs && data.logs.length > 0 ? (
                        <div className="logs-list">
                            {data.logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`log-item ${expandedLog === log.id ? 'expanded' : ''}`}
                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                >
                                    <div className="log-header">
                                        <span className="log-time">{formatWaktu(log.timestamp)}</span>
                                        <span
                                            className="log-type"
                                            style={{ background: `${getTypeColor(log.type)}20`, color: getTypeColor(log.type) }}
                                        >
                                            {getTypeLabel(log.type)}
                                        </span>
                                        <span className="log-node">{log.nodeName}</span>
                                        <svg
                                            className={`expand-icon ${expandedLog === log.id ? 'rotated' : ''}`}
                                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                    {expandedLog === log.id && (
                                        <div className="log-details">
                                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="icon-empty">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <h4>Tidak ada log</h4>
                            <p>Belum ada log yang tercatat</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .filter-bar {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    padding: 8px 14px;
                    flex: 1;
                    min-width: 200px;
                }

                .search-box input {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--text-main);
                    font-size: 0.9rem;
                    width: 100%;
                }

                .search-box svg {
                    color: var(--text-gray);
                    flex-shrink: 0;
                }

                select {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: var(--text-main);
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                select:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .toggle-refresh {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    color: var(--text-gray);
                    font-size: 0.9rem;
                }

                .toggle-refresh input {
                    accent-color: var(--primary);
                }

                .export-buttons {
                    display: flex;
                    gap: 8px;
                }

                .btn-export {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    padding: 8px 14px;
                    color: var(--text-main);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-export:hover {
                    background: var(--bg-hover);
                    border-color: var(--primary);
                }

                .logs-stats {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                    font-size: 0.9rem;
                    color: var(--text-gray);
                }

                .stat-item strong {
                    color: var(--text-main);
                }

                .refresh-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: ${WARNA.green};
                }

                .pulse-dot {
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

                .logs-list {
                    max-height: 600px;
                    overflow-y: auto;
                }

                .log-item {
                    border-bottom: 1px solid var(--border-main);
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .log-item:hover {
                    background: var(--bg-hover);
                }

                .log-item:last-child {
                    border-bottom: none;
                }

                .log-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                }

                .log-time {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    font-family: monospace;
                    min-width: 180px;
                }

                .log-type {
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .log-node {
                    color: var(--text-main);
                    font-size: 0.9rem;
                    flex: 1;
                }

                .expand-icon {
                    color: var(--text-gray);
                    transition: transform 0.2s;
                }

                .expand-icon.rotated {
                    transform: rotate(180deg);
                }

                .log-details {
                    background: var(--bg-main);
                    padding: 16px;
                    border-top: 1px solid var(--border-main);
                }

                .log-details pre {
                    margin: 0;
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    white-space: pre-wrap;
                    word-break: break-all;
                }
            `}</style>
        </>
    );
}
