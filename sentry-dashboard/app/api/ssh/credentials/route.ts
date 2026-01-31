/**
 * SSH Credentials API
 * CRUD operations for SSH credentials
 */

// Force Node.js runtime for consistency
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET - List all credentials (masked)
export async function GET() {
    try {
        const db = await getDatabase();
        const credentials = await db.getAllSSHCredentials();

        return NextResponse.json({
            success: true,
            credentials: credentials.map(c => ({
                id: c.id,
                nodeId: c.nodeId,
                name: c.name,
                host: c.host,
                port: c.port,
                username: c.username,
                authType: c.authType,
                hasPassword: !!c.encryptedPassword,
                hasPrivateKey: !!c.encryptedPrivateKey,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            }))
        });
    } catch (error) {
        console.error('Error fetching SSH credentials:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch credentials' },
            { status: 500 }
        );
    }
}

// POST - Create new credential
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const required = ['nodeId', 'name', 'host', 'username', 'authType'];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json(
                    { success: false, error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate authType
        if (!['password', 'privatekey'].includes(body.authType)) {
            return NextResponse.json(
                { success: false, error: 'authType must be "password" or "privatekey"' },
                { status: 400 }
            );
        }

        // Validate that password or privateKey is provided based on authType
        if (body.authType === 'password' && !body.password) {
            return NextResponse.json(
                { success: false, error: 'Password is required for password authentication' },
                { status: 400 }
            );
        }

        if (body.authType === 'privatekey' && !body.privateKey) {
            return NextResponse.json(
                { success: false, error: 'Private key is required for key authentication' },
                { status: 400 }
            );
        }

        const db = await getDatabase();
        const credential = await db.createSSHCredential({
            nodeId: body.nodeId,
            name: body.name,
            host: body.host,
            port: body.port || 22,
            username: body.username,
            authType: body.authType,
            password: body.password,
            privateKey: body.privateKey,
            passphrase: body.passphrase,
        });

        return NextResponse.json({
            success: true,
            credential: {
                id: credential.id,
                nodeId: credential.nodeId,
                name: credential.name,
                host: credential.host,
                port: credential.port,
                username: credential.username,
                authType: credential.authType,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating SSH credential:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create credential' },
            { status: 500 }
        );
    }
}

// PUT - Update credential
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json(
                { success: false, error: 'Missing credential ID' },
                { status: 400 }
            );
        }

        const db = await getDatabase();
        const credential = await db.updateSSHCredential(body.id, {
            name: body.name,
            host: body.host,
            port: body.port,
            username: body.username,
            authType: body.authType,
            password: body.password,
            privateKey: body.privateKey,
            passphrase: body.passphrase,
        });

        if (!credential) {
            return NextResponse.json(
                { success: false, error: 'Credential not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            credential: {
                id: credential.id,
                nodeId: credential.nodeId,
                name: credential.name,
                host: credential.host,
                port: credential.port,
                username: credential.username,
                authType: credential.authType,
            }
        });
    } catch (error) {
        console.error('Error updating SSH credential:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update credential' },
            { status: 500 }
        );
    }
}

// DELETE - Delete credential
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing credential ID' },
                { status: 400 }
            );
        }

        const db = await getDatabase();
        const deleted = await db.deleteSSHCredential(parseInt(id));

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Credential not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting SSH credential:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete credential' },
            { status: 500 }
        );
    }
}
