'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

/*
 * tipe data node server
 */
interface DataNode {
  nodeName: string;
  hostname: string;
  os: string;
  numCPU: number;
  memoryAllocMB: number;
  memorySysMB: number;
  lastSeen: string;
  isOnline: boolean;
}

/*
 * ringkasan statistik ssh
 */
interface RingkasanSSH {
  totalFailed: number;
  totalSuccess: number;
  uniqueAttackerIPs: number;
  bruteForceIPs: number;
}

/*
 * response api nodes
 */
interface ResponseNodes {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  nodes: DataNode[];
}

/*
 * event ssh individual
 */
interface SSHEvent {
  id: string;
  nodeName: string;
  timestamp: string;
  event_type: string;
  user: string;
  ip: string;
}

/*
 * response api ssh events
 */
interface ResponseSSH {
  summary: RingkasanSSH;
  allEvents: SSHEvent[];
  recentEvents: SSHEvent[];
  attackers: Array<{
    ip: string;
    failedAttempts: number;
    isBruteForce: boolean;
  }>;
}

// warna untuk chart
const WARNA = {
  primary: '#7c5cff',
  blue: '#4d9fff',
  green: '#00d9a5',
  red: '#ff6b6b',
  orange: '#ffaa33',
  gray: '#606078',
  cyan: '#00d4ff'
};

// opsi filter waktu
const FILTER_WAKTU = [
  { label: '1m', value: 1 },
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '1h', value: 60 },
  { label: '6h', value: 360 },
  { label: '24h', value: 1440 },
];

/*
 * Dashboard Utama - Premium Design
 * Tampilan overview seluruh sistem monitoring
 */
export default function Dashboard() {
  const [dataNodes, setDataNodes] = useState<ResponseNodes | null>(null);
  const [dataSSH, setDataSSH] = useState<ResponseSSH | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ name: string; gagal: number; sukses: number }>>([]);
  const [filterWaktu, setFilterWaktu] = useState(60);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // generate chart data berdasarkan filter menggunakan data real
  function generateChartData(filter: number, ssh: ResponseSSH | null) {
    const now = new Date();
    const filterMs = filter * 60 * 1000;
    const startTime = now.getTime() - filterMs;

    let intervalMinutes: number;
    let count: number;

    if (filter <= 1) {
      intervalMinutes = 0.25;
      count = 4;
    } else if (filter <= 5) {
      intervalMinutes = 1;
      count = filter;
    } else if (filter <= 60) {
      intervalMinutes = 5;
      count = Math.floor(filter / 5);
    } else if (filter <= 360) {
      intervalMinutes = 30;
      count = Math.floor(filter / 30);
    } else {
      intervalMinutes = 60;
      count = Math.floor(filter / 60);
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    const eventsInRange = (ssh?.allEvents || []).filter((e) => {
      const eventTime = new Date(e.timestamp).getTime();
      return eventTime >= startTime && eventTime <= now.getTime();
    });

    const points = [];
    for (let i = count; i >= 0; i--) {
      const bucketEnd = now.getTime() - i * intervalMs;
      const bucketStart = bucketEnd - intervalMs;
      const bucketTime = new Date(bucketEnd);

      let gagal = 0;
      let sukses = 0;

      for (const event of eventsInRange) {
        const eventTime = new Date(event.timestamp).getTime();
        if (eventTime > bucketStart && eventTime <= bucketEnd) {
          if (event.event_type === 'failed') {
            gagal++;
          } else if (event.event_type === 'success') {
            sukses++;
          }
        }
      }

      const label = bucketTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      points.push({ name: label, gagal, sukses });
    }

    return points;
  }

  // fetch data dari api
  useEffect(() => {
    async function ambilData() {
      try {
        const [resNodes, resSSH] = await Promise.all([
          fetch('/api/nodes'),
          fetch('/api/events/ssh'),
        ]);

        const nodes = await resNodes.json();
        const ssh = await resSSH.json();

        setDataNodes(nodes);
        setDataSSH(ssh);
        setChartData(generateChartData(filterWaktu, ssh));
      } catch (err) {
        console.error('Gagal fetch data:', err);
      } finally {
        setLoading(false);
      }
    }

    ambilData();
    const timer = setInterval(ambilData, 15000);
    return () => clearInterval(timer);
  }, [filterWaktu]);

  useEffect(() => {
    setChartData(generateChartData(filterWaktu, dataSSH));
  }, [filterWaktu, dataSSH]);

  // data untuk pie chart
  const dataPie = [
    { name: 'Online', value: dataNodes?.onlineNodes || 0, color: WARNA.green },
    { name: 'Offline', value: dataNodes?.offlineNodes || 0, color: WARNA.red },
  ];

  // Calculate uptime percentage
  const totalNodes = dataNodes?.totalNodes || 0;
  const onlineNodes = dataNodes?.onlineNodes || 0;
  const uptimePercent = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0;

  if (loading) {
    return (
      <div className="premium-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Sentry Dashboard
          </h1>
          <p className="header-subtitle">Server Monitoring & Security Platform</p>
        </div>
        <div className="header-right">
          <div className="header-time">
            <div className="time-display">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            <div className="date-display">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="premium-stats-grid">
        {/* Uptime Card - Large */}
        <div className="stat-card-premium uptime-card">
          <div className="stat-header">
            <span className="stat-label">System Uptime</span>
            <span className={`status-badge ${uptimePercent >= 90 ? 'healthy' : uptimePercent >= 70 ? 'warning' : 'critical'}`}>
              {uptimePercent >= 90 ? 'Healthy' : uptimePercent >= 70 ? 'Degraded' : 'Critical'}
            </span>
          </div>
          <div className="uptime-display">
            <div className="uptime-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={uptimePercent >= 90 ? WARNA.green : uptimePercent >= 70 ? WARNA.orange : WARNA.red}
                  strokeWidth="8"
                  strokeDasharray={`${uptimePercent * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="uptime-value">
                <span className="percentage">{uptimePercent}</span>
                <span className="percent-sign">%</span>
              </div>
            </div>
            <div className="uptime-details">
              <div className="detail-item">
                <span className="detail-value success">{dataNodes?.onlineNodes || 0}</span>
                <span className="detail-label">Online</span>
              </div>
              <div className="detail-item">
                <span className="detail-value danger">{dataNodes?.offlineNodes || 0}</span>
                <span className="detail-label">Offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Servers */}
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="18" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{dataNodes?.totalNodes || 0}</span>
            <span className="stat-label">Total Servers</span>
          </div>
          <div className="stat-trend neutral">
            <span>Monitored</span>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{dataSSH?.summary?.totalFailed || 0}</span>
            <span className="stat-label">Failed Logins</span>
          </div>
          <div className="stat-trend warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 6l-9.5 9.5-5-5L1 18" />
              <path d="M17 6h6v6" />
            </svg>
            <span>Today</span>
          </div>
        </div>

        {/* Brute Force Attacks */}
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{dataSSH?.summary?.bruteForceIPs || 0}</span>
            <span className="stat-label">Brute Force IPs</span>
          </div>
          <div className={`stat-trend ${(dataSSH?.summary?.bruteForceIPs || 0) > 0 ? 'danger' : 'success'}`}>
            <span>{(dataSSH?.summary?.bruteForceIPs || 0) > 0 ? 'Active Threats' : 'No Threats'}</span>
          </div>
        </div>

        {/* Unique Attackers */}
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{dataSSH?.summary?.uniqueAttackerIPs || 0}</span>
            <span className="stat-label">Unique IPs</span>
          </div>
          <div className="stat-trend neutral">
            <span>Detected</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* SSH Activity Chart */}
        <div className="chart-card-premium main-chart">
          <div className="chart-header">
            <div className="chart-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <h3>SSH Activity Monitor</h3>
            </div>
            <div className="time-filter">
              {FILTER_WAKTU.map((f) => (
                <button
                  key={f.value}
                  className={`filter-pill ${filterWaktu === f.value ? 'active' : ''}`}
                  onClick={() => setFilterWaktu(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={WARNA.red} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={WARNA.red} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={WARNA.green} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={WARNA.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={WARNA.gray} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={WARNA.gray} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 15, 25, 0.95)',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    borderRadius: 12,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: '#f5f5f8' }}
                  labelStyle={{ color: '#9090a8', marginBottom: 8, fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="gagal" stroke={WARNA.red} strokeWidth={2} fillOpacity={1} fill="url(#gradFailed)" name="Failed" />
                <Area type="monotone" dataKey="sukses" stroke={WARNA.green} strokeWidth={2} fillOpacity={1} fill="url(#gradSuccess)" name="Success" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: WARNA.green }}></span>
              <span>Successful ({dataSSH?.summary?.totalSuccess || 0})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: WARNA.red }}></span>
              <span>Failed ({dataSSH?.summary?.totalFailed || 0})</span>
            </div>
          </div>
        </div>

        {/* Server Status Pie - Modern */}
        <div className="chart-card-premium">
          <div className="chart-header">
            <div className="chart-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
              </svg>
              <h3>Server Status</h3>
            </div>
          </div>
          <div className="chart-body pie-container-modern">
            <div className="pie-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <defs>
                    <linearGradient id="gradOnline" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#00f5c4" />
                      <stop offset="100%" stopColor="#00d9a5" />
                    </linearGradient>
                    <linearGradient id="gradOffline" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ff8a8a" />
                      <stop offset="100%" stopColor="#ff5a5a" />
                    </linearGradient>
                    <filter id="glowOnline" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glowOffline" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                    cornerRadius={8}
                    stroke="none"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === 'Online' ? 'url(#gradOnline)' : 'url(#gradOffline)'}
                        filter={entry.name === 'Online' ? 'url(#glowOnline)' : 'url(#glowOffline)'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 15, 25, 0.95)',
                      border: '1px solid rgba(124, 92, 255, 0.3)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }}
                    formatter={(value, name) => [
                      <span key="value" style={{ color: '#fff', fontWeight: 600 }}>{value} servers</span>,
                      <span key="name" style={{ color: '#c4c9d4' }}>{name}</span>
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center-label">
                <span className="total-value">{totalNodes}</span>
                <span className="total-label">Total</span>
              </div>
            </div>

            <div className="pie-stats-modern">
              {dataPie.map((item) => (
                <div key={item.name} className="stat-row">
                  <div className={`stat-indicator ${item.name.toLowerCase()}`}></div>
                  <div className="stat-name">{item.name}</div>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${totalNodes > 0 ? (item.value / totalNodes) * 100 : 0}%`,
                        background: item.name === 'Online' ? WARNA.green : WARNA.red
                      }}
                    ></div>
                  </div>
                  <div className="stat-value">{item.value}</div>
                </div>
              ))}
            </div>

            <style jsx>{`
              .pie-container-modern {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 10px;
              }
              .pie-wrapper {
                position: relative;
                width: 100%;
                height: 200px;
              }
              .pie-center-label {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                pointer-events: none;
              }
              .total-value {
                font-size: 24px;
                font-weight: 700;
                color: #fff;
                line-height: 1;
                filter: drop-shadow(0 0 4px rgba(255,255,255,0.2));
              }
              .total-label {
                font-size: 12px;
                color: #9090a8;
                margin-top: 4px;
              }
              .pie-stats-modern {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 0 10px;
              }
              .stat-row {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.85rem;
                color: #9090a8;
              }
              .stat-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
              }
              .stat-indicator.online { background: #00d9a5; box-shadow: 0 0 8px #00d9a5; }
              .stat-indicator.offline { background: #ff6b6b; box-shadow: 0 0 8px #ff6b6b; }
              
              .stat-name {
                flex-shrink: 0;
                min-width: 50px;
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
                transition: width 1s ease-out;
              }
              .stat-value {
                font-family: monospace;
                color: #fff;
                font-weight: 600;
                margin-left: 4px;
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Server List */}
        <div className="premium-card servers-card">
          <div className="card-header">
            <div className="header-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
              </svg>
              <h3>Connected Servers</h3>
            </div>
            <span className="count-badge">{dataNodes?.totalNodes || 0}</span>
          </div>
          <div className="card-body">
            {dataNodes?.nodes && dataNodes.nodes.length > 0 ? (
              <div className="server-list">
                {dataNodes.nodes.map((node) => (
                  <div key={node.nodeName} className="server-item">
                    <div className="server-status">
                      <span className={`status-dot ${node.isOnline ? 'online' : 'offline'}`}></span>
                    </div>
                    <div className="server-info">
                      <h4>{node.nodeName}</h4>
                      <p>{node.os} • {node.numCPU} vCPU</p>
                    </div>
                    <div className="server-metrics">
                      <div className="metric">
                        <span className="metric-value">{node.memoryAllocMB} MB</span>
                        <span className="metric-label">Memory</span>
                      </div>
                    </div>
                    <span className={`server-badge ${node.isOnline ? 'online' : 'offline'}`}>
                      {node.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-premium">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" />
                </svg>
                <h4>No servers connected</h4>
                <p>Install Sentry Agent to start monitoring</p>
              </div>
            )}
          </div>
        </div>

        {/* Suspicious IPs */}
        <div className="premium-card threats-card">
          <div className="card-header">
            <div className="header-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3>Threat Detection</h3>
            </div>
            <span className={`threat-badge ${(dataSSH?.attackers?.length || 0) > 0 ? 'active' : 'clear'}`}>
              {(dataSSH?.attackers?.length || 0) > 0 ? `${dataSSH?.attackers?.length} threats` : 'All Clear'}
            </span>
          </div>
          <div className="card-body">
            {dataSSH?.attackers && dataSSH.attackers.length > 0 ? (
              <div className="threats-table">
                <div className="table-header">
                  <span>IP Address</span>
                  <span>Attempts</span>
                  <span>Status</span>
                </div>
                {dataSSH.attackers.slice(0, 6).map((item) => (
                  <div key={item.ip} className="threat-row">
                    <code className="ip-address">{item.ip}</code>
                    <span className="attempt-count">{item.failedAttempts}</span>
                    <span className={`threat-status ${item.isBruteForce ? 'brute-force' : 'suspicious'}`}>
                      {item.isBruteForce ? 'Brute Force' : 'Suspicious'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-premium success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={WARNA.green} strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h4>All Systems Secure</h4>
                <p>No threats detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
