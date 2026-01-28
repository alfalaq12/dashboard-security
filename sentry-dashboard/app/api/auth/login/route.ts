import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { getDatabase } from '@/lib/db';

/*
 * API Login
 * POST /api/auth/login
 * Autentikasi user dengan email dan password
 */

// secret untuk JWT (production: pindahkan ke env variable)
const JWT_SECRET = process.env.JWT_SECRET || 'sentry-secret-key-change-in-production';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // validasi input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email dan password wajib diisi' },
                { status: 400 }
            );
        }

        // ambil database adapter
        const db = await getDatabase();

        // cari user berdasarkan email
        const user = await db.findUserByEmail(email);

        if (!user) {
            return NextResponse.json(
                { error: 'Email atau password salah' },
                { status: 401 }
            );
        }

        // verifikasi password
        const isValid = await db.verifyPassword(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Email atau password salah' },
                { status: 401 }
            );
        }

        // buat JWT token
        const token = sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                department: user.department,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // response tanpa password
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
        };

        return NextResponse.json({
            success: true,
            token,
            user: userResponse,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
