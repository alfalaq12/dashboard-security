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

interface SSHEventData {
    event_type: string;
    user: string;
    ip: string;
    port: string;
    raw_log: string;
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
        // Return empty array if file doesn't exist
        await writeFile(EVENTS_FILE, '[]');
        return [];
    }
}

export async function GET() {
    try {
        const events = await getEvents();

        // Filter only SSH events
        const sshEvents = events
            .filter((e) => e.type === 'ssh_event')
            .map((e) => ({
                id: e.id,
                nodeName: e.nodeName,
                timestamp: e.timestamp,
                receivedAt: e.receivedAt,
                ...(e.data as SSHEventData),
            }));

        // Get failed login counts by IP
        const failedByIP: Record<string, { count: number; users: Set<string>; nodes: Set<string> }> = {};

        for (const event of sshEvents) {
            if (event.event_type === 'failed') {
                if (!failedByIP[event.ip]) {
                    failedByIP[event.ip] = { count: 0, users: new Set(), nodes: new Set() };
                }
                failedByIP[event.ip].count++;
                failedByIP[event.ip].users.add(event.user);
                failedByIP[event.ip].nodes.add(event.nodeName);
            }
        }

        // Convert to array and sort by count
        const attackers = Object.entries(failedByIP)
            .map(([ip, data]) => ({
                ip,
                failedAttempts: data.count,
                targetedUsers: Array.from(data.users),
                targetedNodes: Array.from(data.nodes),
                isBruteForce: data.count >= 5, // Flag as brute force if 5+ attempts
            }))
            .sort((a, b) => b.failedAttempts - a.failedAttempts);

        return NextResponse.json({
            totalEvents: sshEvents.length,
            allEvents: sshEvents, // semua events untuk chart
            recentEvents: sshEvents.slice(-50).reverse(), // Last 50, newest first
            attackers,
            summary: {
                totalFailed: sshEvents.filter((e) => e.event_type === 'failed').length,
                totalSuccess: sshEvents.filter((e) => e.event_type === 'success').length,
                uniqueAttackerIPs: attackers.length,
                bruteForceIPs: attackers.filter((a) => a.isBruteForce).length,
            },
        });
    } catch (error) {
        console.error('Error fetching SSH events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch SSH events' },
            { status: 500 }
        );
    }
}
