'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/*
 * Tipe data user
 */
interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
}

/*
 * Props untuk AuthProvider
 */
interface AuthProviderProps {
    children: React.ReactNode;
}

/*
 * Komponen AuthProvider
 * Membungkus aplikasi dan cek autentikasi otomatis
 */
export default function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        cekAuth();
    }, [pathname]);

    function cekAuth() {
        // halaman yang tidak perlu login
        const publicPages = ['/login'];
        const isPublicPage = publicPages.includes(pathname);

        // ambil token dari localStorage
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            // tidak ada token
            if (!isPublicPage) {
                // redirect ke login jika bukan halaman public
                router.push('/login');
                return;
            }
        } else {
            // ada token
            if (isPublicPage) {
                // sudah login tapi di halaman login, redirect ke dashboard
                router.push('/');
                return;
            }
            setAuthenticated(true);
        }

        setLoading(false);
    }

    // loading state
    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // halaman login tidak perlu cek auth
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // halaman lain perlu authenticated
    if (!authenticated) {
        return null;
    }

    return <>{children}</>;
}
