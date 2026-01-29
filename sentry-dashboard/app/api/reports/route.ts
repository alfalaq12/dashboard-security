import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface StoredPayload {
    id: string;
    nodeName: string;
    type: string;
    timestamp: string;
    data: {
        event_type?: string;
        ip?: string;
        user?: string;
        [key: string]: unknown;
    };
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
        const days = parseInt(searchParams.get('days') || '7');

        const events = await getEvents();
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Filter events dalam range
        const filteredEvents = events.filter((e) => {
            const eventDate = new Date(e.timestamp);
            return eventDate >= startDate && eventDate <= now;
        });

        // SSH events only
        const sshEvents = filteredEvents.filter((e) => e.type === 'ssh_event');

        // Hitung summary
        const totalEvents = filteredEvents.length;
        const sshTotal = sshEvents.length;
        const sshFailed = sshEvents.filter((e) => e.data?.event_type === 'failed').length;
        const sshSuccess = sshEvents.filter((e) => e.data?.event_type === 'success').length;

        // Unique IPs
        const uniqueIPs = new Set(sshEvents.map((e) => e.data?.ip).filter(Boolean));
        const bruteForceIPs = new Map<string, number>();
        sshEvents.forEach((e) => {
            if (e.data?.event_type === 'failed' && e.data?.ip) {
                bruteForceIPs.set(e.data.ip, (bruteForceIPs.get(e.data.ip) || 0) + 1);
            }
        });

        // Top attackers
        const topAttackers = Array.from(bruteForceIPs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }));

        // Trends per hari
        const trends: Record<string, { date: string; failed: number; success: number; total: number }> = {};
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            trends[dateStr] = { date: dateStr, failed: 0, success: 0, total: 0 };
        }

        sshEvents.forEach((e) => {
            const dateStr = new Date(e.timestamp).toISOString().split('T')[0];
            if (trends[dateStr]) {
                trends[dateStr].total++;
                if (e.data?.event_type === 'failed') {
                    trends[dateStr].failed++;
                } else if (e.data?.event_type === 'success') {
                    trends[dateStr].success++;
                }
            }
        });

        // Event type distribution
        const eventTypes: Record<string, number> = {};
        filteredEvents.forEach((e) => {
            eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
        });

        // Unique nodes
        const nodes = new Set(filteredEvents.map((e) => e.nodeName));

        return NextResponse.json({
            period: { days, startDate: startDate.toISOString(), endDate: now.toISOString() },
            summary: {
                totalEvents,
                sshTotal,
                sshFailed,
                sshSuccess,
                successRate: sshTotal > 0 ? Math.round((sshSuccess / sshTotal) * 100) : 0,
                uniqueAttackerIPs: uniqueIPs.size,
                bruteForceIPs: Array.from(bruteForceIPs.values()).filter((c) => c >= 5).length,
                activeNodes: nodes.size,
            },
            trends: Object.values(trends),
            topAttackers,
            eventTypeDistribution: Object.entries(eventTypes).map(([type, count]) => ({ type, count })),
        });
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
