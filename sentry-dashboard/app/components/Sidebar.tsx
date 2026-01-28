'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/*
 * tipe data user
 */
interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
}

/*
 * Sidebar Navigasi
 * Menampilkan menu dengan active state berdasarkan halaman saat ini
 */
export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch {
                setUser(null);
            }
        }
    }, []);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    // cek apakah link aktif
    function isActive(href: string) {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    }

    // label role dalam bahasa Indonesia
    function getRoleLabel(role: string) {
        const labels: Record<string, string> = {
            admin: 'Administrator',
            operator: 'Operator',
            viewer: 'Viewer',
        };
        return labels[role] || role;
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2">
                        <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7c5cff" />
                                <stop offset="100%" stopColor="#4d9fff" />
                            </linearGradient>
                        </defs>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                </div>
                <h1>Sentry</h1>
            </div>

            <nav>
                {/* menu utama */}
                <div className="nav-section">
                    <div className="nav-section-title">Menu</div>
                    <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/nodes" className={`nav-link ${isActive('/nodes') ? 'active' : ''}`}>
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                            <circle cx="6" cy="6" r="1" fill="currentColor" />
                            <circle cx="6" cy="18" r="1" fill="currentColor" />
                        </svg>
                        <span>Servers</span>
                    </Link>
                </div>

                {/* menu keamanan */}
                <div className="nav-section">
                    <div className="nav-section-title">Keamanan</div>
                    <Link href="/security" className={`nav-link ${isActive('/security') ? 'active' : ''}`}>
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>SSH Events</span>
                    </Link>
                    <Link href="/alerts" className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}>
                        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Alerts</span>
                    </Link>
                </div>

                {/* pengaturan - hanya untuk admin dan operator */}
                {user && (user.role === 'admin' || user.role === 'operator') && (
                    <div className="nav-section">
                        <div className="nav-section-title">Pengaturan</div>
                        <Link href="/setup" className={`nav-link ${isActive('/setup') ? 'active' : ''}`}>
                            <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>Setup Agent</span>
                        </Link>

                        {/* kelola user - hanya untuk admin */}
                        {user.role === 'admin' && (
                            <Link href="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
                                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>Kelola User</span>
                            </Link>
                        )}
                    </div>
                )}
            </nav>

            {/* user info di bawah */}
            {user && (
                <div className="sidebar-user">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">{getRoleLabel(user.role)}</div>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={handleLogout} title="Logout">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            )}
        </aside>
    );
}
