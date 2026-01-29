'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

/*
 * SessionManager Component
 * Mengelola session timeout dan idle detection
 * - Auto logout setelah 30 menit idle
 * - Warning di menit ke-20 (10 menit sebelum logout)
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 menit dalam milliseconds
const WARNING_TIME = 20 * 60 * 1000; // 20 menit dalam milliseconds

export default function SessionManager() {
    const router = useRouter();
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showedWarning, setShowedWarning] = useState(false);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset activity timer
    const resetActivity = () => {
        setLastActivity(Date.now());
        setShowedWarning(false);
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');

        Swal.fire({
            icon: 'info',
            title: 'Session Berakhir',
            html: `
                <div style="text-align: center;">
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 8px;">Sesi Anda telah berakhir karena tidak ada aktivitas.</p>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">Silakan login kembali untuk melanjutkan.</p>
                </div>
            `,
            confirmButtonText: 'Login Kembali',
            allowOutsideClick: false,
            customClass: {
                popup: 'swal-premium-popup',
            }
        }).then(() => {
            router.push('/login');
        });
    };

    // Check session status
    const checkSession = () => {
        const now = Date.now();
        const idleTime = now - lastActivity;

        // Jika sudah lebih dari 30 menit, auto logout
        if (idleTime >= SESSION_TIMEOUT) {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            logout();
            return;
        }

        // Jika sudah 20 menit dan belum pernah tampilkan warning
        if (idleTime >= WARNING_TIME && !showedWarning) {
            setShowedWarning(true);

            Swal.fire({
                icon: 'warning',
                title: 'Peringatan Session',
                html: `
                    <div style="text-align: center;">
                        <div style="width: 70px; height: 70px; margin: 0 auto 20px; background: rgba(255, 170, 51, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffaa33" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <p style="font-size: 1.1rem; margin-bottom: 12px; color: rgba(255,255,255,0.9);">
                            Session akan berakhir dalam <span style="color: #ffaa33; font-weight: 600;">10 menit</span>
                        </p>
                        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.5);">
                            Klik "Lanjutkan" untuk memperpanjang session
                        </p>
                    </div>
                `,
                confirmButtonText: '✓ Lanjutkan',
                cancelButtonText: 'Logout',
                showCancelButton: true,
                reverseButtons: true,
                allowOutsideClick: false,
                customClass: {
                    popup: 'swal-session-warning',
                }
            }).then((result: { isConfirmed?: boolean; isDismissed?: boolean }) => {
                if (result.isConfirmed) {
                    // User menekan "Lanjutkan" - reset activity
                    resetActivity();
                } else if (result.isDismissed) {
                    // User menekan "Logout Sekarang"
                    if (checkIntervalRef.current) {
                        clearInterval(checkIntervalRef.current);
                    }
                    logout();
                }
            });
        }
    };

    useEffect(() => {
        // Event listeners untuk mendeteksi aktivitas user
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            window.addEventListener(event, resetActivity);
        });

        // Check session setiap 30 detik
        checkIntervalRef.current = setInterval(checkSession, 30000);

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetActivity);
            });
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [lastActivity, showedWarning]);

    return null; // Component tidak render apa-apa
}
