import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

/*
 * API Users
 * GET /api/users - Daftar semua user
 * POST /api/users - Buat user baru
 */

// GET - ambil semua user
export async function GET() {
    try {
        const db = await getDatabase();
        const users = await db.getAllUsers();

        return NextResponse.json({
            success: true,
            users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}

// POST - buat user baru
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role, department } = body;

        // validasi input
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'Email, password, name, dan role wajib diisi' },
                { status: 400 }
            );
        }

        // validasi role
        if (!['admin', 'operator', 'viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Role harus admin, operator, atau viewer' },
                { status: 400 }
            );
        }

        const db = await getDatabase();

        // cek apakah email sudah ada
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email sudah terdaftar' },
                { status: 400 }
            );
        }

        // buat user
        const user = await db.createUser({
            email,
            password,
            name,
            role,
            department: department || '',
        });

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
