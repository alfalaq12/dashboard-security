'use client';

import { useEffect, useState } from 'react';

/*
 * Tipe data untuk node/server yang terhubung
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
 * Ringkasan data SSH untuk ditampilkan di stat card
 */
interface RingkasanSSH {
  totalFailed: number;
  totalSuccess: number;
  uniqueAttackerIPs: number;
  bruteForceIPs: number;
}

/*
 * Response dari API /api/nodes
 */
interface ResponseNodes {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  nodes: DataNode[];
}

/*
 * Response dari API /api/events/ssh
 */
interface ResponseSSH {
  summary: RingkasanSSH;
  attackers: Array<{
    ip: string;
    failedAttempts: number;
    isBruteForce: boolean;
  }>;
}

/*
 * Halaman Dashboard Utama
 * Menampilkan ringkasan statistik dan daftar node
 */
export default function Dashboard() {
  const [dataNodes, setDataNodes] = useState<ResponseNodes | null>(null);
  const [dataSSH, setDataSSH] = useState<ResponseSSH | null>(null);
  const [loading, setLoading] = useState(true);

  // ambil data dari server
  useEffect(() => {
    async function ambilData() {
      try {
        // fetch data secara paralel
        const [resNodes, resSSH] = await Promise.all([
          fetch('/api/nodes'),
          fetch('/api/events/ssh'),
        ]);

        const nodes = await resNodes.json();
        const ssh = await resSSH.json();

        setDataNodes(nodes);
        setDataSSH(ssh);
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      } finally {
        setLoading(false);
      }
    }

    ambilData();

    // refresh tiap 10 detik
    const timer = setInterval(ambilData, 10000);
    return () => clearInterval(timer);
  }, []);

  // tampilkan loading
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* header halaman */}
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>Pantau server kamu secara realtime</p>
      </div>

      {/* grid statistik */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Server</div>
          <div className="value info">{dataNodes?.totalNodes || 0}</div>
        </div>

        <div className="stat-card">
          <div className="label">Online</div>
          <div className="value success">{dataNodes?.onlineNodes || 0}</div>
        </div>

        <div className="stat-card">
          <div className="label">Login Gagal</div>
          <div className="value warning">{dataSSH?.summary?.totalFailed || 0}</div>
        </div>

        <div className="stat-card">
          <div className="label">Brute Force</div>
          <div className="value danger">{dataSSH?.summary?.bruteForceIPs || 0}</div>
        </div>
      </div>

      {/* daftar node */}
      <div className="card">
        <div className="card-header">
          <h3>🖥️ Server Terhubung</h3>
          <span className="badge info">{dataNodes?.totalNodes || 0} total</span>
        </div>
        <div className="card-body">
          {dataNodes?.nodes && dataNodes.nodes.length > 0 ? (
            <div className="node-list">
              {dataNodes.nodes.map((node) => (
                <div key={node.nodeName} className="node-item">
                  <div className="node-info">
                    <div className="node-icon">🖥️</div>
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
              <div className="icon">🖥️</div>
              <h4>Belum ada server</h4>
              <p>Install Sentry Agent di server kamu untuk mulai monitoring</p>
            </div>
          )}
        </div>
      </div>

      {/* tabel IP penyerang */}
      <div className="card">
        <div className="card-header">
          <h3>🚨 IP Mencurigakan</h3>
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
                        {item.isBruteForce ? '🚨 Brute Force' : '⚠️ Mencurigakan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="icon">✅</div>
              <h4>Aman</h4>
              <p>Tidak ada serangan terdeteksi</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
