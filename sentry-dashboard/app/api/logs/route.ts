import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface StoredPayload {
    id: string;
    nodeName: string;
    type: string;
    timestamp: string;
    data: unknown;
    receivedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

async function getEvents(): Promise<StoredPayload[]> {
    if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
    }

    try {
        const data = await readFile(EVENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        await writeFile(EVENTS_FILE, '[]');
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.toLowerCase() || '';
        const type = searchParams.get('type') || '';
        const node = searchParams.get('node') || '';
        const limit = parseInt(searchParams.get('limit') || '100');

        let events = await getEvents();

        // Filter by type
        if (type && type !== 'all') {
            events = events.filter((e) => e.type === type);
        }

        // Filter by node
        if (node && node !== 'all') {
            events = events.filter((e) => e.nodeName === node);
        }

        // Search in all fields
        if (search) {
            events = events.filter((e) => {
                const searchStr = JSON.stringify(e).toLowerCase();
                return searchStr.includes(search);
            });
        }

        // Sort by timestamp descending (newest first)
        events.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Get unique nodes and types for filters
        const allEvents = await getEvents();
        const nodes = [...new Set(allEvents.map((e) => e.nodeName))];
        const types = [...new Set(allEvents.map((e) => e.type))];

        // Apply limit
        const limitedEvents = events.slice(0, limit);

        return NextResponse.json({
            totalLogs: events.length,
            logs: limitedEvents,
            filters: {
                nodes,
                types,
            },
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
