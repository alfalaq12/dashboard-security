import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// In-memory storage for MVP (replace with database in production)
interface StoredPayload {
  id: string;
  nodeName: string;
  type: string;
  timestamp: string;
  data: unknown;
  receivedAt: string;
}

// Simple file-based storage for MVP
const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function appendEvent(payload: StoredPayload) {
  await ensureDataDir();

  let events: StoredPayload[] = [];
  try {
    const { readFile } = await import('fs/promises');
    const data = await readFile(EVENTS_FILE, 'utf-8');
    events = JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, start with empty array
      events = [];
    } else {
      // Real error (e.g. EBUSY), rethrow to avoid overwriting data
      console.error('Failed to read events file:', error);
      throw error;
    }
  }

  // Check for Brute Force (5 failed attempts from same IP in last minute)
  if (payload.type === 'ssh_event' && (payload.data as any).event_type === 'failed') {
    const ip = (payload.data as any).ip;
    const oneMinuteAgo = new Date(Date.now() - 60000);

    // Find failed events from same IP in last minute
    const recentFailures = events.filter(e =>
      e.type === 'ssh_event' &&
      (e.data as any).event_type === 'failed' &&
      (e.data as any).ip === ip &&
      new Date(e.timestamp) > oneMinuteAgo
    );

    // If this is the 5th attempt (4 previous + current one), trigger alert
    if (recentFailures.length === 4) {
      // Import notification logic dynamically to avoid circular deps if any
      const { readFile: readNotif, writeFile: writeNotif } = await import('fs/promises');
      const NOTIF_FILE = path.join(DATA_DIR, 'notifications.json');

      let notifications = [];
      try {
        if (existsSync(NOTIF_FILE)) {
          notifications = JSON.parse(await readNotif(NOTIF_FILE, 'utf-8'));
        }
      } catch { }

      const newAlert = {
        id: crypto.randomUUID(),
        type: 'alert',
        title: 'Brute Force Detected',
        message: `High number of failed SSH login attempts detected from ${ip} on ${payload.nodeName}`,
        timestamp: new Date().toISOString(),
        read: false,
        source: 'Security Monitor'
      };

      notifications.unshift(newAlert);
      await writeNotif(NOTIF_FILE, JSON.stringify(notifications, null, 2));
      console.log(`🚨 ALERT CREATED: Brute force from ${ip}`);
    }
  }

  // Check for Threat Scan events (backdoor/cryptominer detection)
  if (payload.type === 'threat_scan') {
    const threatData = payload.data as {
      category?: string;
      threat_type?: string;
      threat_level?: string;
      matched_rules?: string[];
      file_path?: string;
      process_name?: string;
    };

    // Create notification for threats
    const { readFile: readNotif, writeFile: writeNotif } = await import('fs/promises');
    const NOTIF_FILE = path.join(DATA_DIR, 'notifications.json');

    let notifications = [];
    try {
      if (existsSync(NOTIF_FILE)) {
        notifications = JSON.parse(await readNotif(NOTIF_FILE, 'utf-8'));
      }
    } catch { }

    // Map threat level to notification type
    const notifType = threatData.threat_level === 'critical' ? 'alert' :
      threatData.threat_level === 'high' ? 'warning' : 'info';

    // Create descriptive title based on category
    const icon = threatData.category === 'cryptominer' ? '⛏️' : '🐚';
    const categoryLabel = threatData.category === 'cryptominer' ? 'Crypto Miner' : 'Backdoor';

    // Create location info
    const location = threatData.file_path || threatData.process_name || 'Unknown';

    const newAlert = {
      id: crypto.randomUUID(),
      type: notifType,
      title: `${icon} ${categoryLabel} Detected`,
      message: `${threatData.threat_type}: ${threatData.matched_rules?.join(', ') || 'Unknown threat'} found at ${location} on ${payload.nodeName}`,
      timestamp: new Date().toISOString(),
      read: false,
      source: 'Threat Scanner'
    };

    notifications.unshift(newAlert);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications = notifications.slice(0, 100);
    }

    await writeNotif(NOTIF_FILE, JSON.stringify(notifications, null, 2));
    console.log(`🚨 THREAT ALERT: ${categoryLabel} - ${threatData.threat_type} on ${payload.nodeName}`);
  }

  events.push(payload);

  // Keep only events from last 7 days (time-based retention)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  events = events.filter(e => {
    const eventTime = new Date(e.receivedAt || e.timestamp);
    return eventTime >= sevenDaysAgo;
  });

  await writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    // Validate API Key
    const apiKey = request.headers.get('X-API-Key');

    // For MVP, accept any non-empty API key or allow empty for testing
    // In production, validate against database
    if (!apiKey) {
      console.log('⚠️  Request without API key - allowing for development');
    }

    const body = await request.json();

    // Validate payload structure
    if (!body.node_name || !body.type || !body.data) {
      return NextResponse.json(
        { error: 'Invalid payload: missing node_name, type, or data' },
        { status: 400 }
      );
    }

    const storedPayload: StoredPayload = {
      id: crypto.randomUUID(),
      nodeName: body.node_name,
      type: body.type,
      timestamp: body.timestamp || new Date().toISOString(),
      data: body.data,
      receivedAt: new Date().toISOString(),
    };

    // Store the event
    await appendEvent(storedPayload);

    // Log for monitoring
    if (body.type === 'ssh_event') {
      const sshData = body.data as { event_type?: string; user?: string; ip?: string };
      console.log(`🔐 [${body.node_name}] SSH ${sshData.event_type}: user=${sshData.user}, ip=${sshData.ip}`);
    } else if (body.type === 'system_stats') {
      console.log(`📊 [${body.node_name}] System stats received`);
    } else if (body.type === 'threat_scan') {
      const threatData = body.data as { category?: string; threat_type?: string; threat_level?: string };
      const icon = threatData.category === 'cryptominer' ? '⛏️' : '🐚';
      console.log(`${icon} [${body.node_name}] Threat detected: ${threatData.threat_type} (${threatData.threat_level})`);
    }

    return NextResponse.json({
      success: true,
      id: storedPayload.id
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing ingest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Sentry Dashboard Ingest API',
    usage: 'POST /api/ingest with payload { node_name, type, data }'
  });
}
