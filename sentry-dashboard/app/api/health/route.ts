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

// Notification Interface (Duplicated from notifications route for now)
interface Notification {
    id: string;
    type: 'alert' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    source?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

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

async function getNotifications(): Promise<Notification[]> {
    if (!existsSync(NOTIFICATIONS_FILE)) {
        return [];
    }
    try {
        const data = await readFile(NOTIFICATIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveNotifications(notifications: Notification[]): Promise<void> {
    await writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
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

// Helper to add notification if it doesn't exist
async function checkAndNotify(server: NodePayload, cpu: number, memory: number, disk: number) {
    // Only notify for critical levels
    if (cpu <= 90 && memory <= 90 && disk <= 90) return;

    let issue = '';
    if (cpu > 90) issue = `High CPU Usage (${Math.round(cpu)}%)`;
    else if (memory > 90) issue = `High Memory Usage (${Math.round(memory)}%)`;
    else if (disk > 90) issue = `High Disk Usage (${Math.round(disk)}%)`;

    const title = `Critical: ${server.nodeName}`;
    const message = `Server ${server.nodeName} is experiencing ${issue}. Please investigate immediately.`;

    try {
        const notifications = await getNotifications();

        // Spam prevention: Check if unread notification exists for this server today
        const hasUnread = notifications.some(n =>
            !n.read &&
            n.title === title &&
            n.message.includes(issue) &&
            new Date(n.timestamp).toDateString() === new Date().toDateString()
        );

        if (!hasUnread) {
            const newNotification: Notification = {
                id: Date.now().toString(),
                type: 'alert',
                title,
                message,
                timestamp: new Date().toISOString(),
                read: false,
                source: 'System Health'
            };

            notifications.unshift(newNotification);

            // Keep limit
            if (notifications.length > 100) notifications.splice(100);

            await saveNotifications(notifications);
        }
    } catch (error) {
        console.error('Failed to process notifications:', error);
    }
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
        const servers = await Promise.all(Array.from(nodeHeartbeats.values()).map(async (node) => {
            const lastSeen = new Date(node.timestamp);
            const isOnline = (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000; // 5 menit

            const cpu = node.data?.cpu_percent ?? 0;
            const memory = node.data?.memory_percent ?? 0;
            const disk = node.data?.disk_percent ?? 0;
            const uptime = node.data?.uptime_seconds ?? 0;

            // Check and trigger notification if online and critical
            if (isOnline) {
                await checkAndNotify(node, cpu, memory, disk);
            }

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
        }));

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
