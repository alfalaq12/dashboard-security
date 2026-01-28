'use client';

import { useEffect, useState } from 'react';

/*
 * Data event SSH dari log server
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
 * Data attacker yang terdeteksi
 */
interface Attacker {
    ip: string;
    failedAttempts: number;
    targetedUsers: string[];
    targetedNodes: string[];
    isBruteForce: boolean;
}

/*
 * Response lengkap dari API SSH
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

/*
 * Halaman Keamanan SSH
 * Menampilkan semua event login dan daftar attacker
 */
export default function HalamanSecurity() {
    const [data, setData] = useState<ResponseSSH | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function ambilData() {
            try {
                const res = await fetch('/api/events/ssh');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Gagal fetch data SSH:', err);
            } finally {
                setLoading(false);
            }
        }

        ambilData();

        // auto refresh tiap 5 detik
        const timer = setInterval(ambilData, 5000);
        return () => clearInterval(timer);
    }, []);

    // format waktu ke format Indonesia
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
                <h2>🔐 Keamanan SSH</h2>
                <p>Pantau percobaan login di semua server</p>
            </div>

            {/* statistik */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="label">Total Event</div>
                    <div className="value info">{data?.totalEvents || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Login Sukses</div>
                    <div className="value success">{data?.summary?.totalSuccess || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Login Gagal</div>
                    <div className="value warning">{data?.summary?.totalFailed || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Brute Force</div>
                    <div className="value danger">{data?.summary?.bruteForceIPs || 0}</div>
                </div>
            </div>

            {/* tabel attacker */}
            <div className="card">
                <div className="card-header">
                    <h3>🚨 Daftar Attacker</h3>
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
                                                {attacker.isBruteForce ? '🚨 Brute Force' : '⚠️ Mencurigakan'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="icon">✅</div>
                            <h4>Tidak ada attacker</h4>
                            <p>Semua server aman</p>
                        </div>
                    )}
                </div>
            </div>

            {/* event terbaru */}
            <div className="card">
                <div className="card-header">
                    <h3>📋 Event Terbaru</h3>
                    <span className="badge info">50 event terakhir</span>
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
                                                {event.event_type === 'success' ? '✅ Sukses' : '❌ Gagal'}
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
                            <div className="icon">📋</div>
                            <h4>Belum ada event</h4>
                            <p>Event akan muncul saat agent mulai mengirim data</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
