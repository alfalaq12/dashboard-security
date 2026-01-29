import { NextResponse } from 'next/server';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

async function getNotifications(): Promise<Notification[]> {
    if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
    }

    try {
        const data = await readFile(NOTIFICATIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // Start with empty notifications for production
        await writeFile(NOTIFICATIONS_FILE, '[]');
        return [];
    }
}

async function saveNotifications(notifications: Notification[]): Promise<void> {
    await writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
}

export async function GET() {
    try {
        const notifications = await getNotifications();

        // Sort by timestamp desc
        notifications.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const unreadCount = notifications.filter(n => !n.read).length;

        return NextResponse.json({
            notifications,
            unreadCount,
            total: notifications.length
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { id, action } = await request.json();
        const notifications = await getNotifications();

        if (action === 'markRead') {
            const notif = notifications.find(n => n.id === id);
            if (notif) notif.read = true;
        } else if (action === 'markAllRead') {
            notifications.forEach(n => n.read = true);
        } else if (action === 'delete') {
            const idx = notifications.findIndex(n => n.id === id);
            if (idx >= 0) notifications.splice(idx, 1);
        } else if (action === 'deleteAll') {
            notifications.length = 0;
        }

        await saveNotifications(notifications);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { type, title, message, source } = await request.json();
        const notifications = await getNotifications();

        const newNotification: Notification = {
            id: Date.now().toString(),
            type: type || 'info',
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            source
        };

        notifications.unshift(newNotification);

        // Keep only last 100 notifications
        if (notifications.length > 100) {
            notifications.splice(100);
        }

        await saveNotifications(notifications);

        return NextResponse.json({ success: true, notification: newNotification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}
