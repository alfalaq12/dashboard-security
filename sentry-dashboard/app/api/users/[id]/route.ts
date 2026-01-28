import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

/*
 * API User by ID
 * GET /api/users/[id] - Detail user
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Hapus user
 */

interface Params {
    params: Promise<{ id: string }>;
}

// GET - detail user
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const db = await getDatabase();
        const user = await db.findUserById(parseInt(id));

        if (!user) {
            return NextResponse.json(
                { error: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: { ...user, password: undefined },
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}

// PUT - update user
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, password, name, role, department } = body;

        // validasi role jika ada
        if (role && !['admin', 'operator', 'viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Role harus admin, operator, atau viewer' },
                { status: 400 }
            );
        }

        const db = await getDatabase();

        // cek apakah user ada
        const existingUser = await db.findUserById(parseInt(id));
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        // update user
        const user = await db.updateUser(parseInt(id), {
            email,
            password,
            name,
            role,
            department,
        });

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}

// DELETE - hapus user
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const db = await getDatabase();

        // cek apakah user ada
        const existingUser = await db.findUserById(parseInt(id));
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        // jangan hapus admin terakhir
        if (existingUser.role === 'admin') {
            const allUsers = await db.getAllUsers();
            const adminCount = allUsers.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                return NextResponse.json(
                    { error: 'Tidak bisa menghapus admin terakhir' },
                    { status: 400 }
                );
            }
        }

        const deleted = await db.deleteUser(parseInt(id));

        return NextResponse.json({
            success: deleted,
            message: deleted ? 'User berhasil dihapus' : 'Gagal menghapus user',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
