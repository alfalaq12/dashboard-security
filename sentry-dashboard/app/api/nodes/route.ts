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

interface SystemStatsData {
    hostname: string;
    os: string;
    num_cpu: number;
    go_routines: number;
    memory_alloc_bytes: number;
    memory_total_bytes: number;
    memory_sys_bytes: number;
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

export async function GET() {
    try {
        const events = await getEvents();

        // Filter only system stats events
        const statsEvents = events
            .filter((e) => e.type === 'system_stats')
            .map((e) => ({
                id: e.id,
                nodeName: e.nodeName,
                timestamp: e.timestamp,
                receivedAt: e.receivedAt,
                ...(e.data as SystemStatsData),
            }));

        // Group by node and get latest stats per node
        const nodeStats: Record<string, typeof statsEvents[0]> = {};

        for (const stat of statsEvents) {
            const existing = nodeStats[stat.nodeName];
            if (!existing || new Date(stat.receivedAt) > new Date(existing.receivedAt)) {
                nodeStats[stat.nodeName] = stat;
            }
        }

        // Get list of unique nodes with their latest status
        const nodes = Object.values(nodeStats).map((stat) => ({
            nodeName: stat.nodeName,
            hostname: stat.hostname,
            os: stat.os,
            numCPU: stat.num_cpu,
            memoryAllocMB: Math.round(stat.memory_alloc_bytes / 1024 / 1024),
            memorySysMB: Math.round(stat.memory_sys_bytes / 1024 / 1024),
            lastSeen: stat.receivedAt,
            isOnline: (Date.now() - new Date(stat.receivedAt).getTime()) < 60000, // Online if seen in last 60s
        }));

        return NextResponse.json({
            totalNodes: nodes.length,
            onlineNodes: nodes.filter((n) => n.isOnline).length,
            offlineNodes: nodes.filter((n) => !n.isOnline).length,
            nodes,
            recentStats: statsEvents.slice(-100).reverse(),
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch system stats' },
            { status: 500 }
        );
    }
}
