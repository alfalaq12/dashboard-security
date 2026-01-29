import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface NodePayload {
    id: string;
    nodeName: string;
    type: string;
    timestamp: string;
    data: {
        os?: string;
        hostname?: string;
        cpu_percent?: number;
        memory_percent?: number;
        disk_percent?: number;
        uptime_seconds?: number;
        [key: string]: unknown;
    };
    receivedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

async function getEvents(): Promise<NodePayload[]> {
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

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function getHealthStatus(cpu: number, memory: number, disk: number): 'healthy' | 'warning' | 'critical' {
    if (cpu > 90 || memory > 90 || disk > 90) return 'critical';
    if (cpu > 70 || memory > 70 || disk > 80) return 'warning';
    return 'healthy';
}

export async function GET() {
    try {
        const events = await getEvents();

        // Get latest heartbeat for each node
        const nodeHeartbeats = new Map<string, NodePayload>();

        events
            .filter((e) => e.type === 'heartbeat')
            .forEach((e) => {
                const existing = nodeHeartbeats.get(e.nodeName);
                if (!existing || new Date(e.timestamp) > new Date(existing.timestamp)) {
                    nodeHeartbeats.set(e.nodeName, e);
                }
            });

        const now = new Date();
        const servers = Array.from(nodeHeartbeats.values()).map((node) => {
            const lastSeen = new Date(node.timestamp);
            const isOnline = (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000; // 5 menit

            const cpu = node.data?.cpu_percent ?? 0;
            const memory = node.data?.memory_percent ?? 0;
            const disk = node.data?.disk_percent ?? 0;
            const uptime = node.data?.uptime_seconds ?? 0;

            return {
                id: node.id,
                name: node.nodeName,
                hostname: node.data?.hostname || node.nodeName,
                os: node.data?.os || 'Unknown',
                isOnline,
                lastSeen: node.timestamp,
                metrics: {
                    cpu: Math.round(cpu),
                    memory: Math.round(memory),
                    disk: Math.round(disk),
                    uptime: uptime,
                    uptimeFormatted: formatUptime(uptime)
                },
                status: isOnline ? getHealthStatus(cpu, memory, disk) : 'offline'
            };
        });

        // Sort by status (critical first, then warning, then healthy)
        const statusOrder: { [key: string]: number } = { critical: 0, warning: 1, healthy: 2, offline: 3 };
        servers.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        // Summary stats
        const summary = {
            total: servers.length,
            online: servers.filter((s) => s.isOnline).length,
            healthy: servers.filter((s) => s.status === 'healthy').length,
            warning: servers.filter((s) => s.status === 'warning').length,
            critical: servers.filter((s) => s.status === 'critical').length,
            offline: servers.filter((s) => !s.isOnline).length,
            avgCpu: servers.length > 0
                ? Math.round(servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length)
                : 0,
            avgMemory: servers.length > 0
                ? Math.round(servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length)
                : 0,
        };

        return NextResponse.json({
            servers,
            summary,
            lastUpdated: now.toISOString()
        });
    } catch (error) {
        console.error('Error fetching health data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch health data' },
            { status: 500 }
        );
    }
}
