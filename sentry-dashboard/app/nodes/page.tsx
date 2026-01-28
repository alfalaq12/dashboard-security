'use client';

import { useEffect, useState } from 'react';

/*
 * tipe data node/server
 */
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

/*
 * Halaman Daftar Server
 * Menampilkan semua VM yang terhubung
 */
export default function HalamanNodes() {
    const [data, setData] = useState<ResponseNodes | null>(null);
    const [loading, setLoading] = useState(true);

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

        if (diff < 60) return `${diff} detik lalu`;
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        return date.toLocaleDateString('id-ID');
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
                        <rect x="2" y="2" width="20" height="8" rx="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" />
                    </svg>
                    Daftar Server
                </h2>
                <p>Kelola semua server yang terhubung ke Sentry</p>
            </div>

            {/* stat cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(77, 159, 255, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4d9fff" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Total Server</div>
                        <div className="value info">{data?.totalNodes || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(61, 214, 140, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3dd68c" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Online</div>
                        <div className="value success">{data?.onlineNodes || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 90, 90, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff5a5a" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Offline</div>
                        <div className="value danger">{data?.offlineNodes || 0}</div>
                    </div>
                </div>
            </div>

            {/* daftar server */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                        Semua Server
                    </h3>
                    <span className="badge info">{data?.totalNodes || 0} terdaftar</span>
                </div>
                <div className="card-body">
                    {data?.nodes && data.nodes.length > 0 ? (
                        <div className="server-grid">
                            {data.nodes.map((node) => (
                                <div key={node.nodeName} className="server-card">
                                    <div className="server-header">
                                        <div className="server-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <rect x="2" y="2" width="20" height="8" rx="2" />
                                                <rect x="2" y="14" width="20" height="8" rx="2" />
                                            </svg>
                                        </div>
                                        <span className={`status-dot ${node.isOnline ? 'online' : 'offline'}`}></span>
                                    </div>
                                    <div className="server-name">{node.nodeName}</div>
                                    <div className="server-os">{node.os}</div>
                                    <div className="server-specs">
                                        <div className="spec">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="4" y="4" width="16" height="16" rx="2" />
                                                <rect x="9" y="9" width="6" height="6" />
                                            </svg>
                                            {node.numCPU} CPU
                                        </div>
                                        <div className="spec">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                            </svg>
                                            {node.memoryAllocMB} MB
                                        </div>
                                    </div>
                                    <div className="server-last-seen">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {formatWaktu(node.lastSeen)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="icon-empty">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                                    <rect x="2" y="2" width="20" height="8" rx="2" />
                                    <rect x="2" y="14" width="20" height="8" rx="2" />
                                </svg>
                            </div>
                            <h4>Belum ada server</h4>
                            <p>Install Sentry Agent untuk menghubungkan server</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
