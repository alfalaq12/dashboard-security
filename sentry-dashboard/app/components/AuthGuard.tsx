'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/*
 * Tipe data user yang tersimpan di localStorage
 */
interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
}

/*
 * Props untuk komponen AuthGuard
 */
interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'operator' | 'viewer')[];
}

/*
 * Komponen AuthGuard
 * Melindungi halaman dari akses tanpa login
 * dan membatasi akses berdasarkan role
 */
export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        cekAuth();
    }, []);

    function cekAuth() {
        // ambil token dan user dari localStorage
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        // jika tidak ada token, redirect ke login
        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        try {
            const user: User = JSON.parse(userStr);

            // jika ada batasan role, cek apakah user punya akses
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                // tidak punya akses, redirect ke halaman utama
                router.push('/');
                return;
            }

            // user terautentikasi dan punya akses
            setAuthorized(true);
        } catch {
            // error parsing, hapus data dan redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}

/*
 * Hook untuk mendapatkan data user yang sedang login
 */
export function useAuth() {
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

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    return { user, logout };
}
