'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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
 * response api ssh events
 */
interface ResponseSSH {
  summary: RingkasanSSH;
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
  green: '#3dd68c',
  red: '#ff5a5a',
  orange: '#ffaa33',
  gray: '#606078'
};

// opsi filter waktu
const FILTER_WAKTU = [
  { label: '1 Menit', value: 1 },
  { label: '5 Menit', value: 5 },
  { label: '15 Menit', value: 15 },
  { label: '1 Jam', value: 60 },
  { label: '6 Jam', value: 360 },
  { label: '24 Jam', value: 1440 },
];

/*
 * Dashboard Utama
 * Tampilan overview seluruh sistem monitoring
 */
export default function Dashboard() {
  const [dataNodes, setDataNodes] = useState<ResponseNodes | null>(null);
  const [dataSSH, setDataSSH] = useState<ResponseSSH | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ name: string; gagal: number; sukses: number }>>([]);
  const [filterWaktu, setFilterWaktu] = useState(60); // default 1 jam

  // generate chart data berdasarkan filter
  function generateChartData(filter: number, ssh: ResponseSSH | null) {
    const points = [];
    const now = new Date();

    // tentukan interval berdasarkan filter
    let interval: number;
    let count: number;

    if (filter <= 5) {
      interval = 1; // per menit
      count = filter;
    } else if (filter <= 60) {
      interval = 5; // per 5 menit
      count = Math.floor(filter / 5);
    } else {
      interval = 30; // per 30 menit
      count = Math.floor(filter / 30);
    }

    for (let i = count; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval * 60000);
      const label = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      // generate data random untuk demo (nanti diganti dengan data real dari API)
      points.push({
        name: label,
        gagal: Math.floor(Math.random() * (ssh?.summary?.totalFailed || 10) / count),
        sukses: Math.floor(Math.random() * (ssh?.summary?.totalSuccess || 5) / count),
      });
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

  // update chart saat filter berubah
  useEffect(() => {
    setChartData(generateChartData(filterWaktu, dataSSH));
  }, [filterWaktu, dataSSH]);

  // data untuk pie chart server status
  const dataPie = [
    { name: 'Online', value: dataNodes?.onlineNodes || 0, color: WARNA.green },
    { name: 'Offline', value: dataNodes?.offlineNodes || 0, color: WARNA.red },
  ];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* header */}
      <div className="page-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </h2>
        <p>Pantau semua server secara realtime</p>
      </div>

      {/* stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(77, 159, 255, 0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={WARNA.blue} strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="label">Total Server</div>
            <div className="value info">{dataNodes?.totalNodes || 0}</div>
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
            <div className="label">Online</div>
            <div className="value success">{dataNodes?.onlineNodes || 0}</div>
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
            <div className="value warning">{dataSSH?.summary?.totalFailed || 0}</div>
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
            <div className="value danger">{dataSSH?.summary?.bruteForceIPs || 0}</div>
          </div>
        </div>
      </div>

      {/* charts row */}
      <div className="charts-grid">
        {/* area chart - ssh events */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Aktivitas SSH
            </h3>
            {/* filter waktu */}
            <div className="filter-group">
              {FILTER_WAKTU.map((f) => (
                <button
                  key={f.value}
                  className={`filter-btn ${filterWaktu === f.value ? 'active' : ''}`}
                  onClick={() => setFilterWaktu(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradGagal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={WARNA.red} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={WARNA.red} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSukses" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="gagal" stroke={WARNA.red} fillOpacity={1} fill="url(#gradGagal)" name="Gagal" />
                  <Area type="monotone" dataKey="sukses" stroke={WARNA.green} fillOpacity={1} fill="url(#gradSukses)" name="Sukses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* pie chart - server status */}
        <div className="card chart-card-small">
          <div className="card-header">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
              </svg>
              Status Server
            </h3>
          </div>
          <div className="card-body">
            <div className="chart-container-small">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a24',
                      border: '1px solid rgba(50,50,80,0.5)',
                      borderRadius: 8
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                <div className="legend-item">
                  <span className="dot" style={{ background: WARNA.green }}></span>
                  Online ({dataNodes?.onlineNodes || 0})
                </div>
                <div className="legend-item">
                  <span className="dot" style={{ background: WARNA.red }}></span>
                  Offline ({dataNodes?.offlineNodes || 0})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* daftar server */}
      <div className="card">
        <div className="card-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
            </svg>
            Server Terhubung
          </h3>
          <span className="badge info">{dataNodes?.totalNodes || 0} server</span>
        </div>
        <div className="card-body">
          {dataNodes?.nodes && dataNodes.nodes.length > 0 ? (
            <div className="node-list">
              {dataNodes.nodes.map((node) => (
                <div key={node.nodeName} className="node-item">
                  <div className="node-info">
                    <div className="node-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" />
                      </svg>
                    </div>
                    <div className="node-details">
                      <h4>{node.nodeName}</h4>
                      <p>{node.os} • {node.numCPU} CPU</p>
                    </div>
                  </div>
                  <div className="node-stats">
                    <div className="node-stat">
                      <div className="label">Memory</div>
                      <div className="value">{node.memoryAllocMB} MB</div>
                    </div>
                    <span className={`badge ${node.isOnline ? 'online' : 'offline'}`}>
                      {node.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" />
                </svg>
              </div>
              <h4>Belum ada server</h4>
              <p>Install Sentry Agent di server untuk mulai monitoring</p>
            </div>
          )}
        </div>
      </div>

      {/* tabel ip mencurigakan */}
      <div className="card">
        <div className="card-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            IP Mencurigakan
          </h3>
        </div>
        <div className="card-body">
          {dataSSH?.attackers && dataSSH.attackers.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Alamat IP</th>
                  <th>Percobaan Gagal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dataSSH.attackers.slice(0, 10).map((item) => (
                  <tr key={item.ip}>
                    <td><code>{item.ip}</code></td>
                    <td>{item.failedAttempts}</td>
                    <td>
                      <span className={`badge ${item.isBruteForce ? 'danger' : 'warning'}`}>
                        {item.isBruteForce ? 'Brute Force' : 'Mencurigakan'}
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
              <h4>Aman</h4>
              <p>Tidak ada serangan terdeteksi</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
