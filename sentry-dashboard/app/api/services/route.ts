import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface ServiceStatus {
    name: string;
    status: string;
    active: boolean;
}

interface ServicePayload {
    id: string;
    nodeName: string;
    type: string;
    timestamp: string;
    data: {
        services: ServiceStatus[];
    };
    receivedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

async function getEvents(): Promise<ServicePayload[]> {
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

        // Get latest service status for each node
        const nodeServices = new Map<string, ServicePayload>();

        events
            .filter((e) => e.type === 'service_status')
            .forEach((e) => {
                const existing = nodeServices.get(e.nodeName);
                if (!existing || new Date(e.timestamp) > new Date(existing.timestamp)) {
                    nodeServices.set(e.nodeName, e);
                }
            });

        // Build response with services per node
        const result = Array.from(nodeServices.entries()).map(([nodeName, payload]) => {
            const services = payload.data?.services || [];
            return {
                nodeName,
                lastUpdated: payload.timestamp,
                services: services.map((s) => ({
                    name: s.name,
                    status: s.status,
                    active: s.active
                })),
                summary: {
                    total: services.length,
                    running: services.filter((s) => s.active).length,
                    stopped: services.filter((s) => !s.active).length
                }
            };
        });

        return NextResponse.json({
            nodes: result,
            totalNodes: result.length
        });
    } catch (error) {
        console.error('Error fetching service status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch service status' },
            { status: 500 }
        );
    }
}
