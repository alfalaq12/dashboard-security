import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

interface ThreatFinding {
    id: string;
    nodeName: string;
    timestamp: string;
    receivedAt: string;
    data: {
        file_path?: string;
        process_name?: string;
        process_id?: number;
        process_cmdline?: string;
        cpu_percent?: number;
        file_name?: string;
        file_size?: number;
        modified_at?: string;
        permissions?: string;
        category: string;
        threat_type: string;
        threat_level: string;
        matched_rules: string[];
        snippet?: string;
        network_conn?: string;
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category'); // backdoor, cryptominer
        const level = searchParams.get('level'); // critical, high, medium, low
        const node = searchParams.get('node');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Read events file
        if (!existsSync(EVENTS_FILE)) {
            return NextResponse.json({
                threats: [],
                stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0, backdoors: 0, miners: 0 }
            });
        }

        const data = await readFile(EVENTS_FILE, 'utf-8');
        const events = JSON.parse(data);

        // Filter for threat_scan events only
        let threats: ThreatFinding[] = events.filter((e: any) => e.type === 'threat_scan');

        // Apply filters
        if (category) {
            threats = threats.filter(t => t.data.category === category);
        }
        if (level) {
            threats = threats.filter(t => t.data.threat_level === level);
        }
        if (node) {
            threats = threats.filter(t => t.nodeName === node);
        }

        // Sort by timestamp desc (newest first)
        threats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Calculate stats before limiting
        const allThreats = events.filter((e: any) => e.type === 'threat_scan');
        const stats = {
            total: allThreats.length,
            critical: allThreats.filter((t: any) => t.data.threat_level === 'critical').length,
            high: allThreats.filter((t: any) => t.data.threat_level === 'high').length,
            medium: allThreats.filter((t: any) => t.data.threat_level === 'medium').length,
            low: allThreats.filter((t: any) => t.data.threat_level === 'low').length,
            backdoors: allThreats.filter((t: any) => t.data.category === 'backdoor').length,
            miners: allThreats.filter((t: any) => t.data.category === 'cryptominer').length,
        };

        // Get unique nodes
        const nodes = [...new Set(allThreats.map((t: any) => t.nodeName))];

        // Apply limit
        threats = threats.slice(0, limit);

        return NextResponse.json({
            threats,
            stats,
            nodes
        });
    } catch (error) {
        console.error('Error fetching threats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch threats' },
            { status: 500 }
        );
    }
}
