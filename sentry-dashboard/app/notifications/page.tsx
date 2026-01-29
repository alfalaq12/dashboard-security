'use client';

import { useEffect, useState, useCallback } from 'react';

interface Notification {
    id: string;
    type: 'alert' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    source?: string;
}

interface NotificationData {
    notifications: Notification[];
    unreadCount: number;
    total: number;
}

const WARNA = {
    primary: '#7c5cff',
    blue: '#4d9fff',
    green: '#3dd68c',
    red: '#ff5a5a',
    orange: '#ffaa33',
    gray: '#606078'
};

function getTypeColor(type: string) {
    switch (type) {
        case 'alert': return WARNA.red;
        case 'warning': return WARNA.orange;
        case 'success': return WARNA.green;
        default: return WARNA.blue;
    }
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'alert':
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            );
        case 'warning':
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            );
        case 'success':
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            );
        default:
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            );
    }
}

export default function HalamanNotifications() {
    const [data, setData] = useState<NotificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Gagal fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const timer = setInterval(fetchNotifications, 30000);
        return () => clearInterval(timer);
    }, [fetchNotifications]);

    async function handleAction(id: string, action: string) {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            fetchNotifications();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    async function handleBulkAction(action: string) {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            fetchNotifications();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    function formatTime(timestamp: string) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now.getTime() - date.getTime();

        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;

        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} hari lalu`;

        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }

    const filteredNotifications = data?.notifications?.filter(n =>
        filter === 'all' ? true : !n.read
    ) || [];

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
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Notification Center
                </h2>
                <p>Pusat notifikasi dan alerts sistem</p>
            </div>

            {/* Stats */}
            <div className="notif-stats">
                <div className="stat-card unread">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                        <div className="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{data?.unreadCount || 0}</div>
                            <div className="stat-label">Belum Dibaca</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card total">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                        <div className="stat-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{data?.total || 0}</div>
                            <div className="stat-label">Total Notifikasi</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="actions-bar">
                <div className="filter-tabs">
                    <button
                        className={`tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Semua
                    </button>
                    <button
                        className={`tab ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Belum Dibaca
                        {(data?.unreadCount || 0) > 0 && (
                            <span className="badge">{data?.unreadCount}</span>
                        )}
                    </button>
                </div>

                <div className="bulk-actions">
                    <button className="action-btn" onClick={() => handleBulkAction('markAllRead')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        Tandai Semua Dibaca
                    </button>
                    <button className="action-btn danger" onClick={() => handleBulkAction('deleteAll')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Hapus Semua
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className="notif-list">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`notif-item ${!notif.read ? 'unread' : ''}`}
                        >
                            <div
                                className="notif-icon"
                                style={{
                                    background: `${getTypeColor(notif.type)}20`,
                                    color: getTypeColor(notif.type)
                                }}
                            >
                                {getTypeIcon(notif.type)}
                            </div>

                            <div className="notif-content">
                                <div className="notif-header">
                                    <h4>{notif.title}</h4>
                                    <span className="notif-time">{formatTime(notif.timestamp)}</span>
                                </div>
                                <p className="notif-message">{notif.message}</p>
                                {notif.source && (
                                    <span className="notif-source">{notif.source}</span>
                                )}
                            </div>

                            <div className="notif-actions">
                                {!notif.read && (
                                    <button
                                        className="icon-btn"
                                        title="Tandai Dibaca"
                                        onClick={() => handleAction(notif.id, 'markRead')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    className="icon-btn delete"
                                    title="Hapus"
                                    onClick={() => handleAction(notif.id, 'delete')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {!notif.read && <div className="unread-indicator"></div>}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <h4>Tidak ada notifikasi</h4>
                        <p>{filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .notif-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                    max-width: 500px;
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

                .stat-card.unread .stat-glow { background: radial-gradient(circle, ${WARNA.red} 0%, transparent 70%); }
                .stat-card.unread .stat-icon { color: ${WARNA.red}; background: rgba(255, 90, 90, 0.15); }
                .stat-card.unread .stat-value { color: ${WARNA.red}; }

                .stat-card.total .stat-glow { background: radial-gradient(circle, ${WARNA.primary} 0%, transparent 70%); }
                .stat-card.total .stat-icon { color: ${WARNA.primary}; background: rgba(124, 92, 255, 0.15); }
                .stat-card.total .stat-value { color: ${WARNA.primary}; }

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

                .actions-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
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
                    gap: 8px;
                    background: transparent;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 6px;
                    color: var(--text-gray);
                    font-size: 0.9rem;
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

                .badge {
                    background: ${WARNA.red};
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .tab.active .badge {
                    background: white;
                    color: var(--primary);
                }

                .bulk-actions {
                    display: flex;
                    gap: 8px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: var(--text-main);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: var(--bg-hover);
                    border-color: var(--primary);
                }

                .action-btn.danger:hover {
                    border-color: ${WARNA.red};
                    color: ${WARNA.red};
                }

                .notif-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .notif-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 14px;
                    padding: 18px 20px;
                    transition: all 0.2s;
                }

                .notif-item:hover {
                    border-color: rgba(124, 92, 255, 0.3);
                    transform: translateX(4px);
                }

                .notif-item.unread {
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.08) 0%, transparent 100%);
                    border-color: rgba(124, 92, 255, 0.2);
                }

                .unread-indicator {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 40%;
                    background: var(--primary);
                    border-radius: 0 4px 4px 0;
                }

                .notif-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .notif-content {
                    flex: 1;
                    min-width: 0;
                }

                .notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 6px;
                }

                .notif-header h4 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .notif-time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                }

                .notif-message {
                    margin: 0 0 8px;
                    font-size: 0.9rem;
                    color: var(--text-gray);
                    line-height: 1.5;
                }

                .notif-source {
                    display: inline-block;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    background: var(--bg-hover);
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                .notif-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .icon-btn {
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    color: var(--text-gray);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-main);
                    color: ${WARNA.green};
                }

                .icon-btn.delete:hover {
                    color: ${WARNA.red};
                    border-color: rgba(255, 90, 90, 0.3);
                    background: rgba(255, 90, 90, 0.1);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                }

                .empty-icon {
                    margin-bottom: 16px;
                }

                .empty-state h4 {
                    margin: 0 0 8px;
                    font-size: 1.1rem;
                }

                .empty-state p {
                    margin: 0;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
            `}</style>
        </>
    );
}
