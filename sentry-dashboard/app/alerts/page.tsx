'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source?: string;
}

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'markRead' })
      });
      // Optimistic update
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' })
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'critical') return n.type === 'alert' || n.type === 'warning';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
      case 'critical':
        return (
          <div className="icon-wrapper red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="icon-wrapper orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="icon-wrapper green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="icon-wrapper blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="premium-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Notifications...</p>
        </div>
        <style jsx>{`
          .premium-dashboard {
            padding: 24px;
            min-height: 100vh;
            background: #0d0d12;
            color: #f5f5f8;
          }
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            color: #9090a8;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #7c5cff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="premium-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alerts & Notifications
          </h1>
          <p className="header-subtitle">Real-time notification system for server monitoring</p>
        </div>
        <div className="header-right">
          <div className="filter-tabs">
            <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`tab-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
            <button className={`tab-btn ${filter === 'critical' ? 'active' : ''}`} onClick={() => setFilter('critical')}>Critical</button>
          </div>
        </div>
      </div>

      <div className="alerts-container">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div key={notif.id} className={`alert-card premium-card ${notif.type} ${notif.read ? 'read' : 'unread'}`}>
              <div className="alert-content-wrapper">
                {getIcon(notif.type)}
                <div className="alert-details">
                  <div className="alert-header-row">
                    <h3 className="alert-title">{notif.title}</h3>
                    <span className="alert-time">
                      {new Date(notif.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="alert-message">{notif.message}</p>
                  {notif.source && <span className="alert-source">Source: {notif.source}</span>}
                </div>
              </div>
              <div className="alert-actions">
                {!notif.read && (
                  <button className="action-btn read-btn" onClick={() => markAsRead(notif.id)} title="Mark as read">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
                <button className="action-btn delete-btn" onClick={() => deleteNotification(notif.id)} title="Delete">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3>No notifications found</h3>
            <p>You're all caught up! No {filter !== 'all' ? filter : ''} alerts to display.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .premium-dashboard {
          padding: 24px;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .header-left h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-subtitle {
          color: var(--text-gray);
          font-size: 0.95rem;
        }

        .alerts-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 900px;
          margin: 0 auto;
        }

        .alert-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: rgba(22, 22, 32, 0.6);
          border: 1px solid var(--border-main);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .alert-card:hover {
          background: rgba(30, 30, 45, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }

        .alert-card.unread {
          border-left: 4px solid var(--accent-primary);
          background: rgba(26, 26, 40, 0.8);
        }

        .alert-card.alert.unread { border-left-color: var(--accent-red); }
        .alert-card.warning.unread { border-left-color: var(--accent-orange); }
        .alert-card.success.unread { border-left-color: var(--accent-green); }

        .alert-content-wrapper {
          display: flex;
          gap: 16px;
          flex: 1;
        }

        .icon-wrapper {
          min-width: 48px;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .icon-wrapper.red { color: var(--accent-red); background: rgba(255, 90, 90, 0.15); }
        .icon-wrapper.orange { color: var(--accent-orange); background: rgba(255, 170, 51, 0.15); }
        .icon-wrapper.green { color: var(--accent-green); background: rgba(61, 214, 140, 0.15); }
        .icon-wrapper.blue { color: var(--accent-primary); background: rgba(124, 92, 255, 0.15); }

        .alert-details {
          flex: 1;
        }

        .alert-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .alert-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-white);
          margin: 0;
        }

        .alert-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          margin-left: 12px;
        }

        .alert-message {
          color: var(--text-gray);
          font-size: 0.9rem;
          margin: 0 0 8px 0;
          line-height: 1.5;
        }

        .alert-source {
          display: inline-block;
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .alert-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-left: 16px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-gray);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-white);
        }

        .read-btn:hover { color: var(--accent-primary); background: rgba(124, 92, 255, 0.1); }
        .delete-btn:hover { color: var(--accent-red); background: rgba(255, 90, 90, 0.1); }

        .filter-tabs {
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.2);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--border-main);
        }

        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-gray);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: var(--accent-primary);
          color: white;
          font-weight: 500;
        }

        .tab-btn:hover:not(.active) {
          color: var(--text-white);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-gray);
        }

        .empty-icon {
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.1rem;
          color: var(--text-white);
          margin-bottom: 8px;
        }

        @media (max-width: 600px) {
          .alert-card {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .alert-actions {
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            margin-top: 12px;
            margin-left: 0;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
        }
      `}</style>
    </div>
  );
}
