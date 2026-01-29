'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface ReportData {
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    summary: {
        totalEvents: number;
        sshTotal: number;
        sshFailed: number;
        sshSuccess: number;
        successRate: number;
        uniqueAttackerIPs: number;
        bruteForceIPs: number;
        activeNodes: number;
    };
    trends: Array<{ date: string; failed: number; success: number; total: number }>;
    topAttackers: Array<{ ip: string; count: number }>;
    eventTypeDistribution: Array<{ type: string; count: number }>;
}

const WARNA = {
    primary: '#7c5cff',
    blue: '#4d9fff',
    green: '#3dd68c',
    red: '#ff5a5a',
    orange: '#ffaa33',
    purple: '#9b59b6',
    gray: '#606078'
};

const PIE_COLORS = [WARNA.red, WARNA.green, WARNA.blue, WARNA.orange, WARNA.purple];

const PERIOD_OPTIONS = [
    { label: '7 Hari', value: 7 },
    { label: '14 Hari', value: 14 },
    { label: '30 Hari', value: 30 },
    { label: '90 Hari', value: 90 },
];

function getTypeLabel(type: string) {
    switch (type) {
        case 'ssh_event': return 'SSH Events';
        case 'heartbeat': return 'Heartbeat';
        case 'metrics': return 'Metrics';
        default: return type;
    }
}

export default function HalamanReports() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(7);

    useEffect(() => {
        async function fetchReport() {
            setLoading(true);
            try {
                const res = await fetch(`/api/reports?days=${period}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Gagal fetch report:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [period]);

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short'
        });
    }

    function handleExport() {
        if (!data) return;

        const reportContent = {
            generatedAt: new Date().toISOString(),
            ...data
        };

        const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${period}days-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const trendsFormatted = data?.trends?.map(t => ({
        ...t,
        name: formatDate(t.date)
    })) || [];

    return (
        <>
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" />
                        <path d="M7 14L12 9L16 13L21 8" />
                    </svg>
                    Reports & Analytics
                </h2>
                <p>Analisis keamanan dan tren serangan</p>
            </div>

            {/* Controls */}
            <div className="report-controls">
                <div className="period-selector">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            className={`period-btn ${period === opt.value ? 'active' : ''}`}
                            onClick={() => setPeriod(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <button className="btn-export" onClick={handleExport}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export Report
                </button>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(77, 159, 255, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.blue} strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Total Events</div>
                        <div className="value info">{data?.summary?.totalEvents || 0}</div>
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
                        <div className="label">Success Rate</div>
                        <div className="value success">{data?.summary?.successRate || 0}%</div>
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
                        <div className="label">Brute Force IPs</div>
                        <div className="value danger">{data?.summary?.bruteForceIPs || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(124, 92, 255, 0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.primary} strokeWidth="2">
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="label">Active Servers</div>
                        <div className="value">{data?.summary?.activeNodes || 0}</div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-grid">
                {/* Trend Chart */}
                <div className="card chart-card">
                    <div className="card-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Trend SSH Events
                        </h3>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={trendsFormatted}>
                                <defs>
                                    <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={WARNA.red} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={WARNA.red} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={WARNA.green} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={WARNA.green} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke={WARNA.gray} fontSize={11} />
                                <YAxis stroke={WARNA.gray} fontSize={11} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1a1a24',
                                        border: '1px solid rgba(50,50,80,0.5)',
                                        borderRadius: 8
                                    }}
                                />
                                <Area type="monotone" dataKey="failed" stroke={WARNA.red} fillOpacity={1} fill="url(#gradFailed)" name="Gagal" />
                                <Area type="monotone" dataKey="success" stroke={WARNA.green} fillOpacity={1} fill="url(#gradSuccess)" name="Sukses" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Event Distribution Pie */}
                <div className="card chart-card-small">
                    <div className="card-header">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                <path d="M22 12A10 10 0 0 0 12 2v10z" />
                            </svg>
                            Distribusi Event
                        </h3>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={data?.eventTypeDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="type"
                                >
                                    {(data?.eventTypeDistribution || []).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: '#1a1a24',
                                        border: '1px solid rgba(50,50,80,0.5)',
                                        borderRadius: 8
                                    }}
                                    formatter={(value, name) => [value, getTypeLabel(String(name))]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-legend">
                            {data?.eventTypeDistribution?.map((item, idx) => (
                                <div key={item.type} className="legend-item">
                                    <span className="dot" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                                    {getTypeLabel(item.type)} ({item.count})
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Attackers */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                        Top 10 IP Penyerang
                    </h3>
                </div>
                <div className="card-body">
                    {data?.topAttackers && data.topAttackers.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.topAttackers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke={WARNA.gray} fontSize={11} />
                                <YAxis type="category" dataKey="ip" stroke={WARNA.gray} fontSize={11} width={120} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1a1a24',
                                        border: '1px solid rgba(50,50,80,0.5)',
                                        borderRadius: 8
                                    }}
                                />
                                <Bar dataKey="count" fill={WARNA.red} radius={[0, 4, 4, 0]} name="Percobaan Gagal" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="icon-empty">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h4>Tidak ada serangan</h4>
                            <p>Belum ada IP penyerang terdeteksi</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .report-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .period-selector {
                    display: flex;
                    gap: 8px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 10px;
                    padding: 4px;
                }

                .period-btn {
                    background: transparent;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    color: var(--text-gray);
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .period-btn.active {
                    background: var(--primary);
                    color: white;
                }

                .period-btn:hover:not(.active) {
                    background: var(--bg-hover);
                }

                .btn-export {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    padding: 10px 16px;
                    color: var(--text-main);
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .btn-export:hover {
                    background: var(--bg-hover);
                    border-color: var(--primary);
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                @media (max-width: 900px) {
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .chart-card, .chart-card-small {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 12px;
                }

                .pie-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                    padding: 16px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: var(--text-gray);
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
            `}</style>
        </>
    );
}
