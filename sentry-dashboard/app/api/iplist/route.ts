import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { withFileLock } from '@/lib/file-lock';

interface IPRule {
    id: string;
    ip: string;
    type: 'blocked' | 'whitelisted';
    reason: string;
    createdAt: string;
    createdBy: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const IPLIST_FILE = path.join(DATA_DIR, 'iplist.json');
const LOCK_KEY = 'iplist.json';

async function ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
    }
}

async function getIPListUnsafe(): Promise<IPRule[]> {
    await ensureDataDir();
    try {
        const data = await readFile(IPLIST_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            console.error('⚠️ iplist.json corrupted, resetting...');
        }
        await writeFile(IPLIST_FILE, '[]');
        return [];
    }
}

async function saveIPListUnsafe(iplist: IPRule[]): Promise<void> {
    await writeFile(IPLIST_FILE, JSON.stringify(iplist, null, 2));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type');
        const search = searchParams.get('search')?.toLowerCase();

        const result = await withFileLock(LOCK_KEY, async () => {
            let iplist = await getIPListUnsafe();

            // Filter by type
            if (typeFilter && typeFilter !== 'all') {
                iplist = iplist.filter((ip: IPRule) => ip.type === typeFilter);
            }

            // Search by IP
            if (search) {
                iplist = iplist.filter((ip: IPRule) =>
                    ip.ip.toLowerCase().includes(search) ||
                    ip.reason.toLowerCase().includes(search)
                );
            }

            // Sort by createdAt desc
            iplist.sort((a: IPRule, b: IPRule) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const summary = {
                total: iplist.length,
                blocked: iplist.filter((ip: IPRule) => ip.type === 'blocked').length,
                whitelisted: iplist.filter((ip: IPRule) => ip.type === 'whitelisted').length
            };

            return { iplist, summary };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching IP list:', error);
        return NextResponse.json(
            { error: 'Failed to fetch IP list' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { ip, type, reason, createdBy } = await request.json();

        if (!ip) {
            return NextResponse.json(
                { error: 'IP address is required' },
                { status: 400 }
            );
        }

        // Validate IP format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        if (!ipRegex.test(ip)) {
            return NextResponse.json(
                { error: 'Invalid IP address format' },
                { status: 400 }
            );
        }

        const result = await withFileLock(LOCK_KEY, async () => {
            const iplist = await getIPListUnsafe();

            // Check if IP already exists
            if (iplist.some((rule: IPRule) => rule.ip === ip)) {
                return { error: 'IP address already exists' };
            }

            const newRule: IPRule = {
                id: Date.now().toString(),
                ip,
                type: type || 'blocked',
                reason: reason || 'No reason provided',
                createdAt: new Date().toISOString(),
                createdBy: createdBy || 'admin'
            };

            iplist.push(newRule);
            await saveIPListUnsafe(iplist);

            return { success: true, rule: newRule };
        });

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error adding IP rule:', error);
        return NextResponse.json(
            { error: 'Failed to add IP rule' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { id, action, type } = await request.json();

        const result = await withFileLock(LOCK_KEY, async () => {
            const iplist = await getIPListUnsafe();

            const rule = iplist.find((r: IPRule) => r.id === id);
            if (!rule) {
                return { error: 'Rule not found', status: 404 };
            }

            if (action === 'toggle') {
                rule.type = rule.type === 'blocked' ? 'whitelisted' : 'blocked';
            } else if (action === 'updateType' && type) {
                rule.type = type;
            }

            await saveIPListUnsafe(iplist);
            return { success: true, rule };
        });

        if ('error' in result) {
            return NextResponse.json(
                { error: result.error },
                { status: result.status || 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating IP rule:', error);
        return NextResponse.json(
            { error: 'Failed to update IP rule' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Rule ID is required' },
                { status: 400 }
            );
        }

        const result = await withFileLock(LOCK_KEY, async () => {
            const iplist = await getIPListUnsafe();
            const idx = iplist.findIndex((r: IPRule) => r.id === id);

            if (idx === -1) {
                return { error: 'Rule not found', status: 404 };
            }

            iplist.splice(idx, 1);
            await saveIPListUnsafe(iplist);

            return { success: true };
        });

        if ('error' in result) {
            return NextResponse.json(
                { error: result.error },
                { status: result.status || 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error deleting IP rule:', error);
        return NextResponse.json(
            { error: 'Failed to delete IP rule' },
            { status: 500 }
        );
    }
}
