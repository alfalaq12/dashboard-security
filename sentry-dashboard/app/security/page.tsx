'use client';

import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/*
 * tipe data event ssh
 */
interface EventSSH {
    id: string;
    nodeName: string;
    timestamp: string;
    event_type: string;
    user: string;
    ip: string;
    port: string;
}

/*
 * data attacker
 */
interface Attacker {
    ip: string;
    failedAttempts: number;
    targetedUsers: string[];
    targetedNodes: string[];
    isBruteForce: boolean;
}

/*
 * response dari api
 */
interface ResponseSSH {
    totalEvents: number;
    recentEvents: EventSSH[];
    attackers: Attacker[];
    summary: {
        totalFailed: number;
        totalSuccess: number;
        uniqueAttackerIPs: number;
        bruteForceIPs: number;
    };
}

const WARNA = {
    red: '#ff5a5a',
    green: '#3dd68c',
    blue: '#4d9fff',
    orange: '#ffaa33',
    gray: '#606078'
};

/*
 * Halaman Keamanan SSH
 * Monitoring semua event login ssh
 */
export default function HalamanSecurity() {
    const [data, setData] = useState<ResponseSSH | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<Array<{ name: string; jumlah: number }>>([]);

    useEffect(() => {
        async function ambilData() {
            try {
                const res = await fetch('/api/events/ssh');
                const json = await res.json();
                setData(json);

                // generate chart data dari attackers
                if (json?.attackers) {
                    const top5 = json.attackers.slice(0, 5).map((a: Attacker) => ({
                        name: a.ip, // Full IP
                        jumlah: a.failedAttempts
                    }));
                    setChartData(top5);
                }
            } catch (err) {
                console.error('Gagal fetch:', err);
            } finally {
                setLoading(false);
            }
        }

        ambilData();
        const timer = setInterval(ambilData, 5000);
        return () => clearInterval(timer);
    }, []);

    function formatWaktu(timestamp: string) {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Keamanan SSH
                </h2>
                <p>Pantau percobaan login di semua server</p>
            </div>

            {/* stat cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(77, 159, 255, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.blue} strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Total Event</div>
                        <div className="value info">{data?.totalEvents || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(61, 214, 140, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.green} strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Login Sukses</div>
                        <div className="value success">{data?.summary?.totalSuccess || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 170, 51, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.orange} strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Login Gagal</div>
                        <div className="value warning">{data?.summary?.totalFailed || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(255, 90, 90, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.red} strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Brute Force</div>
                        <div className="value danger">{data?.summary?.bruteForceIPs || 0}</div>
                    </div>
                </div>
            </div>

            {/* chart top attacker */}
            {chartData.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                            Top 5 IP Penyerang
                        </h3>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke={WARNA.gray} fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke={WARNA.gray} fontSize={12} width={110} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1a1a24',
                                        border: '1px solid rgba(50,50,80,0.5)',
                                        borderRadius: 8
                                    }}
                                />
                                <Bar dataKey="jumlah" fill={WARNA.red} radius={[0, 4, 4, 0]} name="Percobaan Gagal" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* tabel attacker */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                        Daftar Attacker
                    </h3>
                    <span className="badge danger">{data?.attackers?.length || 0} IP</span>
                </div>
                <div className="card-body">
                    {data?.attackers && data.attackers.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Alamat IP</th>
                                    <th>Gagal</th>
                                    <th>User Target</th>
                                    <th>Server Target</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.attackers.map((attacker) => (
                                    <tr key={attacker.ip}>
                                        <td><code>{attacker.ip}</code></td>
                                        <td>{attacker.failedAttempts}</td>
                                        <td>
                                            {attacker.targetedUsers.slice(0, 3).join(', ')}
                                            {attacker.targetedUsers.length > 3 && ` +${attacker.targetedUsers.length - 3}`}
                                        </td>
                                        <td>{attacker.targetedNodes.join(', ')}</td>
                                        <td>
                                            <span className={`badge ${attacker.isBruteForce ? 'danger' : 'warning'}`}>
                                                {attacker.isBruteForce ? 'Brute Force' : 'Mencurigakan'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="icon-empty">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h4>Tidak ada attacker</h4>
                            <p>Semua server aman</p>
                        </div>
                    )}
                </div>
            </div>

            {/* event terbaru */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Event Terbaru
                    </h3>
                    <span className="badge info">50 terakhir</span>
                </div>
                <div className="card-body">
                    {data?.recentEvents && data.recentEvents.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Server</th>
                                    <th>Status</th>
                                    <th>User</th>
                                    <th>IP Sumber</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentEvents.map((event) => (
                                    <tr key={event.id}>
                                        <td>{formatWaktu(event.timestamp)}</td>
                                        <td>{event.nodeName}</td>
                                        <td>
                                            <span className={`badge ${event.event_type === 'success' ? 'online' : 'danger'}`}>
                                                {event.event_type === 'success' ? 'Sukses' : 'Gagal'}
                                            </span>
                                        </td>
                                        <td><code>{event.user}</code></td>
                                        <td><code>{event.ip}</code></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="icon-empty">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <h4>Belum ada event</h4>
                            <p>Event akan muncul saat agent aktif</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
