'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/*
 * Halaman Login (Redesigned)
 * Split Layout: Visual (Kiri) + Form (Kanan)
 */
export default function HalamanLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login gagal');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-split-container">
            {/* Bagian Kiri: Visual / Branding */}
            <div className="login-visual-side">
                <div className="login-visual-content">
                    <div className="visual-logo">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                        <h1>Sentry</h1>
                    </div>
                    <h2>Server Monitoring<br />Next Generation</h2>
                    <p>Monitor infrastruktur server Anda secara real-time dengan dashboard yang kuat dan intuitif.</p>
                </div>
                {/* Background Decoration */}
                <div className="visual-bg-circle c1"></div>
                <div className="visual-bg-circle c2"></div>
            </div>

            {/* Bagian Kanan: Form Login */}
            <div className="login-form-side">
                <div className="login-form-wrapper">
                    <div className="form-header">
                        <h2>Selamat Datang Kembali</h2>
                        <p>Silakan login untuk mengakses dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert-error fade-in">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@email.com"
                                    className={error ? 'input-error' : ''}
                                    required
                                />
                                <div className="input-icon-right">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={error ? 'input-error' : ''}
                                    required
                                />
                                <div className="input-icon-right">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-login-premium" disabled={loading}>
                            {loading ? <span className="spinner-small white"></span> : 'Masuk Dashboard'}
                        </button>
                    </form>

                    <div className="login-footer-info">
                        <p>Demo Credentials:</p>
                        <div className="demo-badge">admin@bapenda.go.id / admin123</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
