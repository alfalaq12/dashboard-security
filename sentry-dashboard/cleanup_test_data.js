const fs = require('fs');
const path = require('path');

const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.json');
const NOTIF_FILE = path.join(process.cwd(), 'data', 'notifications.json');

try {
    // Clean events
    if (fs.existsSync(EVENTS_FILE)) {
        let events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
        const originalLength = events.length;
        events = events.filter(e => e.nodeName !== 'Test-Server-High-CPU');
        if (events.length < originalLength) {
            fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
            console.log("Removed test events.");
        }
    }

    // Clean notifications
    if (fs.existsSync(NOTIF_FILE)) {
        let notifs = JSON.parse(fs.readFileSync(NOTIF_FILE, 'utf-8'));
        const originalLength = notifs.length;
        notifs = notifs.filter(n => !n.title.includes('Test-Server-High-CPU'));
        if (notifs.length < originalLength) {
            fs.writeFileSync(NOTIF_FILE, JSON.stringify(notifs, null, 2));
            console.log("Removed test notifications.");
        }
    }
} catch (err) {
    console.error("Cleanup error:", err);
}
