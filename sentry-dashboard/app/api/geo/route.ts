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
        [key: string]: unknown;
    };
    receivedAt: string;
}

interface GeoCache {
    [ip: string]: {
        country: string;
        countryCode: string;
        city: string;
        lat: number;
        lon: number;
        cachedAt: string;
    };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const GEO_CACHE_FILE = path.join(DATA_DIR, 'geo-cache.json');

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

async function getGeoCache(): Promise<GeoCache> {
    try {
        const data = await readFile(GEO_CACHE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function saveGeoCache(cache: GeoCache): Promise<void> {
    await writeFile(GEO_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function lookupIP(ip: string, cache: GeoCache): Promise<GeoCache[string] | null> {
    // Check cache first
    if (cache[ip]) {
        return cache[ip];
    }

    // Skip private/local IPs
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.') || ip === 'localhost') {
        return null;
    }

    try {
        // Use free ip-api.com service
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`, {
            next: { revalidate: 86400 } // Cache for 24 hours
        });
        const data = await res.json();

        if (data.status === 'success') {
            const geoData = {
                country: data.country || 'Unknown',
                countryCode: data.countryCode || 'XX',
                city: data.city || 'Unknown',
                lat: data.lat || 0,
                lon: data.lon || 0,
                cachedAt: new Date().toISOString()
            };

            // Save to cache
            cache[ip] = geoData;
            await saveGeoCache(cache);

            return geoData;
        }
    } catch (error) {
        console.error('Geo lookup error for IP:', ip, error);
    }

    return null;
}

export async function GET() {
    try {
        const events = await getEvents();
        const cache = await getGeoCache();

        // Get unique attacker IPs from SSH events
        const attackerIPs = new Map<string, number>();

        events
            .filter((e) => e.type === 'ssh_event' && e.data?.event_type === 'failed')
            .forEach((e) => {
                const ip = e.data?.ip;
                if (ip && typeof ip === 'string') {
                    attackerIPs.set(ip, (attackerIPs.get(ip) || 0) + 1);
                }
            });

        // Lookup geo for each IP (limit to top 50 to avoid rate limiting)
        const sortedIPs = Array.from(attackerIPs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);

        const geoData: Array<{
            ip: string;
            attacks: number;
            country: string;
            countryCode: string;
            city: string;
            lat: number;
            lon: number;
        }> = [];
        const countryStats: Record<string, { count: number; attacks: number }> = {};

        for (const [ip, attacks] of sortedIPs) {
            const geo = await lookupIP(ip, cache);

            if (geo) {
                geoData.push({
                    ip,
                    attacks,
                    ...geo
                });

                // Aggregate by country
                if (!countryStats[geo.countryCode]) {
                    countryStats[geo.countryCode] = { count: 0, attacks: 0 };
                }
                countryStats[geo.countryCode].count++;
                countryStats[geo.countryCode].attacks += attacks;
            }
        }

        // Sort countries by attack count
        const topCountries = Object.entries(countryStats)
            .map(([code, stats]) => ({
                countryCode: code,
                country: geoData.find(g => g.countryCode === code)?.country || code,
                ...stats
            }))
            .sort((a, b) => b.attacks - a.attacks)
            .slice(0, 10);

        return NextResponse.json({
            totalAttackers: sortedIPs.length,
            markers: geoData,
            topCountries,
            summary: {
                totalAttacks: sortedIPs.reduce((sum, [, count]) => sum + count, 0),
                uniqueCountries: Object.keys(countryStats).length
            }
        });
    } catch (error) {
        console.error('Error fetching geo data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch geo data' },
            { status: 500 }
        );
    }
}
