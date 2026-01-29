'use client';

import { useEffect, useState, useCallback } from 'react';

interface IPRule {
    id: string;
    ip: string;
    type: 'blocked' | 'whitelisted';
    reason: string;
    createdAt: string;
    createdBy: string;
}

interface IPListData {
    iplist: IPRule[];
    summary: {
        total: number;
        blocked: number;
        whitelisted: number;
    };
}

const WARNA = {
    primary: '#7c5cff',
    blue: '#4d9fff',
    green: '#3dd68c',
    red: '#ff5a5a',
    orange: '#ffaa33',
    gray: '#606078'
};

export default function HalamanIPList() {
    const [data, setData] = useState<IPListData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'blocked' | 'whitelisted'>('all');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newIP, setNewIP] = useState({ ip: '', type: 'blocked' as 'blocked' | 'whitelisted', reason: '' });
    const [error, setError] = useState('');

    const fetchIPList = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('type', filter);
            if (search) params.append('search', search);

            const res = await fetch(`/api/iplist?${params}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Gagal fetch IP list:', err);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => {
        fetchIPList();
    }, [fetchIPList]);

    async function handleAddIP() {
        setError('');
        if (!newIP.ip) {
            setError('IP address wajib diisi');
            return;
        }

        try {
            const res = await fetch('/api/iplist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newIP)
            });

            const json = await res.json();
            if (!res.ok) {
                setError(json.error || 'Gagal menambahkan IP');
                return;
            }

            setShowAddModal(false);
            setNewIP({ ip: '', type: 'blocked', reason: '' });
            fetchIPList();
        } catch (err) {
            console.error('Error:', err);
            setError('Terjadi kesalahan');
        }
    }

    async function handleToggle(id: string) {
        try {
            await fetch('/api/iplist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'toggle' })
            });
            fetchIPList();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Yakin ingin menghapus IP ini?')) return;

        try {
            await fetch(`/api/iplist?id=${id}`, { method: 'DELETE' });
            fetchIPList();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
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
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    IP Blocklist / Whitelist
                </h2>
                <p>Manajemen IP yang di-block atau di-whitelist</p>
            </div>

            {/* Stats */}
            <div className="ip-stats">
                <div className="stat-card total">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                        <div className="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{data?.summary?.total || 0}</div>
                            <div className="stat-label">Total Rules</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card blocked">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                        <div className="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{data?.summary?.blocked || 0}</div>
                            <div className="stat-label">Blocked</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card whitelisted">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                        <div className="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{data?.summary?.whitelisted || 0}</div>
                            <div className="stat-label">Whitelisted</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari IP atau alasan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-tabs">
                    <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        Semua
                    </button>
                    <button className={`tab ${filter === 'blocked' ? 'active' : ''}`} onClick={() => setFilter('blocked')}>
                        <span className="dot blocked"></span>
                        Blocked
                    </button>
                    <button className={`tab ${filter === 'whitelisted' ? 'active' : ''}`} onClick={() => setFilter('whitelisted')}>
                        <span className="dot whitelisted"></span>
                        Whitelisted
                    </button>
                </div>

                <button className="add-btn" onClick={() => setShowAddModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah IP
                </button>
            </div>

            {/* Table */}
            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>IP Address</th>
                            <th>Status</th>
                            <th>Alasan</th>
                            <th>Ditambahkan</th>
                            <th>Oleh</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.iplist && data.iplist.length > 0 ? (
                            data.iplist.map((rule) => (
                                <tr key={rule.id}>
                                    <td>
                                        <code className="ip-code">{rule.ip}</code>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${rule.type}`}>
                                            {rule.type === 'blocked' ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                </svg>
                                            ) : (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                            {rule.type === 'blocked' ? 'Blocked' : 'Whitelisted'}
                                        </span>
                                    </td>
                                    <td className="reason-cell">{rule.reason}</td>
                                    <td>{formatDate(rule.createdAt)}</td>
                                    <td><span className="creator">{rule.createdBy}</span></td>
                                    <td>
                                        <div className="action-btns">
                                            <button
                                                className="icon-btn toggle"
                                                title={rule.type === 'blocked' ? 'Whitelist IP' : 'Block IP'}
                                                onClick={() => handleToggle(rule.id)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="17 1 21 5 17 9" />
                                                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                                    <polyline points="7 23 3 19 7 15" />
                                                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                                </svg>
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                title="Hapus"
                                                onClick={() => handleDelete(rule.id)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="empty-row">
                                    <div className="empty-state">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        <p>Tidak ada IP ditemukan</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tambah IP Baru</h3>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            {error && <div className="error-msg">{error}</div>}

                            <div className="form-group">
                                <label>IP Address</label>
                                <input
                                    type="text"
                                    placeholder="192.168.1.100 atau 10.0.0.0/24"
                                    value={newIP.ip}
                                    onChange={(e) => setNewIP({ ...newIP, ip: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipe</label>
                                <div className="type-selector">
                                    <button
                                        type="button"
                                        className={`type-btn blocked ${newIP.type === 'blocked' ? 'active' : ''}`}
                                        onClick={() => setNewIP({ ...newIP, type: 'blocked' })}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                        </svg>
                                        Block
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-btn whitelisted ${newIP.type === 'whitelisted' ? 'active' : ''}`}
                                        onClick={() => setNewIP({ ...newIP, type: 'whitelisted' })}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Whitelist
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Alasan</label>
                                <textarea
                                    placeholder="Alasan block/whitelist IP ini..."
                                    value={newIP.reason}
                                    onChange={(e) => setNewIP({ ...newIP, reason: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Batal
                            </button>
                            <button className="btn-primary" onClick={handleAddIP}>
                                Tambah IP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .ip-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                @media (max-width: 700px) {
                    .ip-stats { grid-template-columns: 1fr; }
                }

                .stat-card {
                    position: relative;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    padding: 20px;
                    overflow: hidden;
                }

                .stat-glow {
                    position: absolute;
                    top: -40%;
                    right: -40%;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    opacity: 0.15;
                }

                .stat-card.total .stat-glow { background: radial-gradient(circle, ${WARNA.primary} 0%, transparent 70%); }
                .stat-card.total .stat-icon { color: ${WARNA.primary}; background: rgba(124, 92, 255, 0.15); }
                .stat-card.total .stat-value { color: ${WARNA.primary}; }

                .stat-card.blocked .stat-glow { background: radial-gradient(circle, ${WARNA.red} 0%, transparent 70%); }
                .stat-card.blocked .stat-icon { color: ${WARNA.red}; background: rgba(255, 90, 90, 0.15); }
                .stat-card.blocked .stat-value { color: ${WARNA.red}; }

                .stat-card.whitelisted .stat-glow { background: radial-gradient(circle, ${WARNA.green} 0%, transparent 70%); }
                .stat-card.whitelisted .stat-icon { color: ${WARNA.green}; background: rgba(61, 214, 140, 0.15); }
                .stat-card.whitelisted .stat-value { color: ${WARNA.green}; }

                .stat-content {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    margin-top: 2px;
                }

                .toolbar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 10px;
                    padding: 0 14px;
                    flex: 1;
                    min-width: 200px;
                    max-width: 320px;
                }

                .search-box svg {
                    color: var(--text-muted);
                }

                .search-box input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 12px 0;
                    color: var(--text-main);
                    font-size: 0.9rem;
                    outline: none;
                }

                .search-box input::placeholder {
                    color: var(--text-muted);
                }
                
                .search-box:focus-within {
                    border-color: #7c5cff;
                }

                .filter-tabs {
                    display: flex;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 10px;
                    padding: 4px;
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: transparent;
                    border: none;
                    padding: 10px 14px;
                    border-radius: 6px;
                    color: var(--text-gray);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab.active {
                    background: var(--primary);
                    color: white;
                }

                .tab:hover:not(.active) {
                    background: var(--bg-hover);
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .dot.blocked { background: ${WARNA.red}; }
                .dot.whitelisted { background: ${WARNA.green}; }

                .add-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--primary);
                    border: none;
                    border-radius: 10px;
                    padding: 12px 18px;
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-left: auto;
                }

                .add-btn:hover {
                    background: var(--primary-hover);
                    transform: translateY(-1px);
                }

                .table-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    overflow: hidden;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    text-align: left;
                    padding: 14px 18px;
                }

                th {
                    background: var(--bg-hover);
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-gray);
                }

                td {
                    border-top: 1px solid var(--border-main);
                    font-size: 0.9rem;
                }

                tr:hover td {
                    background: rgba(124, 92, 255, 0.03);
                }

                .ip-code {
                    background: var(--bg-hover);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-family: monospace;
                    font-size: 0.85rem;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .status-badge.blocked {
                    background: rgba(255, 90, 90, 0.15);
                    color: ${WARNA.red};
                }

                .status-badge.whitelisted {
                    background: rgba(61, 214, 140, 0.15);
                    color: ${WARNA.green};
                }

                .reason-cell {
                    max-width: 250px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: var(--text-gray);
                }

                .creator {
                    background: var(--bg-hover);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }

                .action-btns {
                    display: flex;
                    gap: 6px;
                }

                .icon-btn {
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    color: var(--text-gray);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .icon-btn.toggle:hover {
                    background: rgba(77, 159, 255, 0.15);
                    border-color: ${WARNA.blue};
                    color: ${WARNA.blue};
                }

                .icon-btn.delete:hover {
                    background: rgba(255, 90, 90, 0.15);
                    border-color: ${WARNA.red};
                    color: ${WARNA.red};
                }

                .empty-row { padding: 0; }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px;
                    color: var(--text-muted);
                }

                .empty-state p {
                    margin: 12px 0 0;
                    font-size: 0.9rem;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 450px;
                    margin: 20px;
                    animation: slideUp 0.2s ease;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-main);
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-gray);
                    cursor: pointer;
                    padding: 4px;
                }

                .close-btn:hover {
                    color: var(--text-main);
                }

                .modal-body {
                    padding: 24px;
                }

                .error-msg {
                    background: rgba(255, 90, 90, 0.15);
                    color: ${WARNA.red};
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 0.9rem;
                }

                .form-group {
                    margin-bottom: 18px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: var(--text-gray);
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    background: var(--bg-hover);
                    border: 1px solid var(--border-main);
                    border-radius: 10px;
                    padding: 12px 14px;
                    color: var(--text-main);
                    font-size: 0.9rem;
                    transition: border-color 0.2s;
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .form-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }

                .type-selector {
                    display: flex;
                    gap: 12px;
                }

                .type-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 14px;
                    background: var(--bg-hover);
                    border: 2px solid var(--border-main);
                    border-radius: 10px;
                    color: var(--text-gray);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .type-btn.blocked.active {
                    background: rgba(255, 90, 90, 0.15);
                    border-color: ${WARNA.red};
                    color: ${WARNA.red};
                }

                .type-btn.whitelisted.active {
                    background: rgba(61, 214, 140, 0.15);
                    border-color: ${WARNA.green};
                    color: ${WARNA.green};
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 24px;
                    border-top: 1px solid var(--border-main);
                }

                .btn-secondary,
                .btn-primary {
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: transparent;
                    border: 1px solid var(--border-main);
                    color: var(--text-gray);
                }

                .btn-secondary:hover {
                    background: var(--bg-hover);
                }

                .btn-primary {
                    background: var(--primary);
                    border: none;
                    color: white;
                }

                .btn-primary:hover {
                    background: var(--primary-hover);
                }
            `}</style>
        </>
    );
}
