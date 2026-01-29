'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

/*
 * Halaman Login (Premium Redesign)
 * Split Layout dengan animasi dan efek premium
 */
export default function HalamanLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Particle effect initialization
    useEffect(() => {
        const createParticles = () => {
            const container = document.querySelector('.login-particles');
            if (!container) return;

            container.innerHTML = '';
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.animationDelay = `${Math.random() * 20}s`;
                particle.style.animationDuration = `${15 + Math.random() * 15}s`;
                container.appendChild(particle);
            }
        };
        createParticles();
    }, []);

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
            localStorage.setItem('loginTime', Date.now().toString());

            // Premium Toast Success
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `Selamat datang kembali!`,
                html: `<span style="color: #a0aec0; font-size: 0.9rem;">${data.user.name}</span>`,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: '#fff',
                iconColor: '#00d9a5',
                showClass: {
                    popup: 'animate__animated animate__slideInRight animate__faster'
                },
                hideClass: {
                    popup: 'animate__animated animate__slideOutRight animate__faster'
                },
                customClass: {
                    popup: 'swal-premium-toast',
                    title: 'swal-premium-title',
                    timerProgressBar: 'swal-premium-progress'
                }
            });

            router.push('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
                // Error Toast
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Login Gagal',
                    text: err.message,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true,
                    background: 'linear-gradient(135deg, #2d1f1f 0%, #1a1a2e 100%)',
                    color: '#fff',
                    iconColor: '#ff6b6b',
                    customClass: {
                        popup: 'swal-premium-toast',
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-split-container">
            {/* Left Panel - Visual/Branding */}
            <div className="login-visual-panel">
                <div className="login-particles"></div>
                <div className="visual-content">
                    <div className="visual-logo">
                        <div className="logo-glow"></div>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="visual-title">Sentry Dashboard</h1>
                    <p className="visual-subtitle">Enterprise Server Monitoring Platform</p>

                    <div className="visual-features">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <div className="feature-text">
                                <span className="feature-title">Real-time Monitoring</span>
                                <span className="feature-desc">24/7 server health tracking</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div className="feature-text">
                                <span className="feature-title">Secure Access</span>
                                <span className="feature-desc">Enterprise-grade security</span>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </div>
                            <div className="feature-text">
                                <span className="feature-title">Smart Alerts</span>
                                <span className="feature-desc">Instant notifications</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="visual-footer">
                    <p>Trusted by IT professionals worldwide</p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-form-panel">
                <div className="form-container">
                    {/* Welcome Header */}
                    <div className="form-header">
                        <div className="mobile-logo">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                        </div>
                        <h2>Selamat Datang! 👋</h2>
                        <p>Masuk ke akun Anda untuk melanjutkan</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="premium-login-form">
                        {error && (
                            <div className="form-alert error">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-field">
                            <label htmlFor="email">Email</label>
                            <div className="input-container">
                                <span className="input-prefix">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@perusahaan.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="password">Password</label>
                            <div className="input-container">
                                <span className="input-prefix">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="input-suffix"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>Masuk</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="form-footer">
                        <p>Protected by <strong>Sentry Security</strong></p>
                        <p className="copyright">© 2026 All rights reserved</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
