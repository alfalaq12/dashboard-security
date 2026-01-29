import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

async function getIPList(): Promise<IPRule[]> {
    if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
    }

    try {
        const data = await readFile(IPLIST_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // Start with empty IP list for production
        await writeFile(IPLIST_FILE, '[]');
        return [];
    }
}

async function saveIPList(iplist: IPRule[]): Promise<void> {
    await writeFile(IPLIST_FILE, JSON.stringify(iplist, null, 2));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type');
        const search = searchParams.get('search')?.toLowerCase();

        let iplist = await getIPList();

        // Filter by type
        if (typeFilter && typeFilter !== 'all') {
            iplist = iplist.filter(ip => ip.type === typeFilter);
        }

        // Search by IP
        if (search) {
            iplist = iplist.filter(ip =>
                ip.ip.toLowerCase().includes(search) ||
                ip.reason.toLowerCase().includes(search)
            );
        }

        // Sort by createdAt desc
        iplist.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const summary = {
            total: iplist.length,
            blocked: iplist.filter(ip => ip.type === 'blocked').length,
            whitelisted: iplist.filter(ip => ip.type === 'whitelisted').length
        };

        return NextResponse.json({
            iplist,
            summary
        });
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

        const iplist = await getIPList();

        // Check if IP already exists
        if (iplist.some(rule => rule.ip === ip)) {
            return NextResponse.json(
                { error: 'IP address already exists' },
                { status: 400 }
            );
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
        await saveIPList(iplist);

        return NextResponse.json({ success: true, rule: newRule });
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
        const iplist = await getIPList();

        const rule = iplist.find(r => r.id === id);
        if (!rule) {
            return NextResponse.json(
                { error: 'Rule not found' },
                { status: 404 }
            );
        }

        if (action === 'toggle') {
            rule.type = rule.type === 'blocked' ? 'whitelisted' : 'blocked';
        } else if (action === 'updateType' && type) {
            rule.type = type;
        }

        await saveIPList(iplist);

        return NextResponse.json({ success: true, rule });
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

        const iplist = await getIPList();
        const idx = iplist.findIndex(r => r.id === id);

        if (idx === -1) {
            return NextResponse.json(
                { error: 'Rule not found' },
                { status: 404 }
            );
        }

        iplist.splice(idx, 1);
        await saveIPList(iplist);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting IP rule:', error);
        return NextResponse.json(
            { error: 'Failed to delete IP rule' },
            { status: 500 }
        );
    }
}
