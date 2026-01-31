/**
 * API Route: /api/agents
 * Returns list of connected agents from the Agent Gateway
 */

import { NextResponse } from 'next/server';

const AGENT_GATEWAY_URL = process.env.AGENT_GATEWAY_URL || 'http://localhost:3004';

export async function GET() {
    try {
        const response = await fetch(`${AGENT_GATEWAY_URL}/agents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Agent gateway returned ${response.status}`);
        }

        const agents = await response.json();
        return NextResponse.json(agents);
    } catch (error) {
        console.error('Error fetching agents:', error);

        // Return empty array if agent gateway is not available
        return NextResponse.json([]);
    }
}
