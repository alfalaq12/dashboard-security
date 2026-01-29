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
    gray: '#606078',
    cyan: '#00d2d3',
    pink: '#ff9ff3'
};

const PIE_COLORS = [WARNA.blue, WARNA.green, WARNA.orange, WARNA.red, WARNA.purple, WARNA.cyan, WARNA.pink];

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
        case 'service_status': return 'Service Status';
        case 'system_stats': return 'System Stats';
        case 'metrics': return 'Metrics';
        default: return type.replace(/_/g, ' ');
    }
}

export default function HalamanReports() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(7);
    const [activeIndex, setActiveIndex] = useState(-1);

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

    const totalDistribution = data?.eventTypeDistribution?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    return (
        <div className="premium-dashboard">
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
                        <ResponsiveContainer width="100%" height={280}>
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
                                <XAxis dataKey="name" stroke={WARNA.gray} fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke={WARNA.gray} fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(20, 20, 30, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ padding: 0 }}
                                />
                                <Area type="monotone" dataKey="failed" stroke={WARNA.red} strokeWidth={2} fillOpacity={1} fill="url(#gradFailed)" name="Gagal" />
                                <Area type="monotone" dataKey="success" stroke={WARNA.green} strokeWidth={2} fillOpacity={1} fill="url(#gradSuccess)" name="Sukses" />
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
                    <div className="card-body pie-container">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <defs>
                                    {data?.eventTypeDistribution?.map((entry, index) => (
                                        <linearGradient key={`gradPieReport-${index}`} id={`gradPieReport-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={PIE_COLORS[index % PIE_COLORS.length]} stopOpacity={1} />
                                            <stop offset="100%" stopColor={PIE_COLORS[index % PIE_COLORS.length]} stopOpacity={0.6} />
                                        </linearGradient>
                                    ))}
                                    <filter id="glowPieReport" height="130%">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blurred" />
                                        <feFlood floodColor="white" floodOpacity="0.1" result="glowColor" />
                                        <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow" />
                                        <feMerge>
                                            <feMergeNode in="softGlow" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <Pie
                                    data={data?.eventTypeDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="type"
                                    stroke="none"
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(-1)}
                                >
                                    {(data?.eventTypeDistribution || []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#gradPieReport-${index})`}
                                            style={{
                                                filter: activeIndex === index ? 'url(#glowPieReport)' : 'none',
                                                transition: 'all 0.3s ease',
                                                opacity: activeIndex === -1 || activeIndex === index ? 1 : 0.4
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(20, 20, 30, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value, name) => [value, getTypeLabel(String(name))]}
                                />
                                {/* Center Label */}
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#fff" style={{ fontSize: '24px', fontWeight: 'bold', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}>
                                    {totalDistribution}
                                </text>
                                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-gray)" style={{ fontSize: '12px' }}>
                                    Events
                                </text>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="pie-stats-column">
                            {data?.eventTypeDistribution?.map((item, idx) => (
                                <div key={item.type} className="stat-row">
                                    <div className="stat-indicator" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                                    <div className="stat-name">{getTypeLabel(item.type)}</div>
                                    <div className="stat-bar-container">
                                        <div
                                            className="stat-bar-fill"
                                            style={{
                                                width: `${(item.count / totalDistribution) * 100}%`,
                                                background: PIE_COLORS[idx % PIE_COLORS.length]
                                            }}
                                        ></div>
                                    </div>
                                    <div className="stat-value">{item.count}</div>
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
                            <BarChart data={data.topAttackers} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke={WARNA.gray} fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="ip" stroke={WARNA.gray} fontSize={11} width={100} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        background: 'rgba(20, 20, 30, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                                <Bar dataKey="count" fill={WARNA.red} radius={[0, 4, 4, 0]} barSize={20}>
                                    <Cell fill="url(#gradFailed)" />
                                </Bar>
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
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .period-selector {
                    display: flex;
                    gap: 6px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 12px;
                    padding: 4px;
                }

                .period-btn {
                    background: transparent;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    color: var(--text-gray);
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .period-btn.active {
                    background: linear-gradient(135deg, rgba(124, 92, 255, 0.2) 0%, rgba(77, 159, 255, 0.2) 100%);
                    color: var(--primary);
                    border: 1px solid rgba(124, 92, 255, 0.3);
                }

                .period-btn:hover:not(.active) {
                    background: var(--bg-hover);
                    color: var(--text-main);
                }

                .btn-export {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 12px;
                    padding: 10px 20px;
                    color: var(--text-main);
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    font-weight: 500;
                }

                .btn-export:hover {
                    background: var(--bg-hover);
                    border-color: var(--primary);
                    color: var(--primary);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }

                @media (max-width: 1024px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                }

                .stat-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-info .label {
                    color: var(--text-gray);
                    font-size: 0.85rem;
                    margin-bottom: 4px;
                }

                .stat-info .value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-white);
                }
                
                .value.success { color: ${WARNA.green}; }
                .value.warning { color: ${WARNA.orange}; }
                .value.danger { color: ${WARNA.red}; }

                .charts-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                @media (max-width: 900px) {
                    .charts-grid { grid-template-columns: 1fr; }
                }

                .card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .card-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-main);
                }

                .card-header h3 {
                    font-size: 1rem;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    color: var(--text-main);
                }

                .card-body {
                    padding: 24px;
                    flex: 1;
                }

                .pie-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .pie-stats-column {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .stat-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.85rem;
                    color: var(--text-gray);
                }

                .stat-indicator {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                
                .stat-name {
                    flex-shrink: 0;
                    min-width: 90px;
                }

                .stat-bar-container {
                    flex: 1;
                    height: 6px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .stat-bar-fill {
                    height: 100%;
                    border-radius: 3px;
                }

                .stat-value {
                    font-family: monospace;
                    color: var(--text-white);
                    font-weight: 600;
                    margin-left: 4px;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--text-muted);
                    text-align: center;
                }
                
                .icon-empty {
                    margin-bottom: 16px;
                    padding: 16px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
}
