'use client';

import { useState, useEffect } from 'react';

const FITUR_NOTIF = [
  {
    nama: 'Email',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    warna: '#4d9fff',
    deskripsi: 'Notifikasi langsung ke inbox'
  },
  {
    nama: 'Telegram',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 5L2 12.5l7 1M21 5l-2.5 15L9 13.5M21 5L9 13.5m0 0V21l3.5-4.5" />
      </svg>
    ),
    warna: '#29b6f6',
    deskripsi: 'Alert instan via bot Telegram'
  },
  {
    nama: 'Discord',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
        <path d="M18.93 5.34A16.33 16.33 0 0 0 14.86 4c-.18.33-.39.76-.53 1.1a15.27 15.27 0 0 0-4.66 0A11.43 11.43 0 0 0 9.14 4a16.42 16.42 0 0 0-4.07 1.34A17.33 17.33 0 0 0 2.1 17.54a16.5 16.5 0 0 0 5.06 2.59 12.3 12.3 0 0 0 1.06-1.76c-.58-.22-1.14-.49-1.66-.81.14-.1.28-.21.41-.31a11.71 11.71 0 0 0 10.06 0c.13.11.27.21.41.31-.53.33-1.08.6-1.66.81.31.63.68 1.22 1.06 1.76a16.46 16.46 0 0 0 5.06-2.59 17.32 17.32 0 0 0-2.97-12.2z" />
      </svg>
    ),
    warna: '#7289da',
    deskripsi: 'Webhook ke channel server'
  },
  {
    nama: 'Slack',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
        <path d="M20.5 10H19v-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
        <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
        <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
        <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
      </svg>
    ),
    warna: '#e01e5a',
    deskripsi: 'Integrasi workspace Slack'
  }
];

export default function HalamanAlerts() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 75 ? 75 : prev + 1));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="premium-dashboard">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alerts & Notifications
          </h1>
          <p className="header-subtitle">Real-time notification system for server monitoring</p>
        </div>
      </div>

      <div className="alerts-container">
        {/* Hero Section */}
        <div className="hero-card">
          <div className="hero-glow"></div>
          <div className="hero-content">
            <div className="badge-coming-soon">
              <span className="pulse"></span>
              Dalam Pengembangan
            </div>
            <h1>Segera Hadir</h1>
            <p>Dapatkan notifikasi instan ketika terjadi serangan atau anomali pada server Anda melalui berbagai platform.</p>

            <div className="progress-section">
              <div className="progress-header">
                <span>Progress Pengembangan</span>
                <span className="progress-percent">{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="features-grid">
          {FITUR_NOTIF.map((fitur, idx) => (
            <div key={fitur.nama} className="feature-card" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="feature-icon" style={{ background: `${fitur.warna}20`, color: fitur.warna }}>
                {fitur.icon}
              </div>
              <h3>{fitur.nama}</h3>
              <p>{fitur.deskripsi}</p>
              <div className="feature-status">
                <span className="status-dot" style={{ background: fitur.warna }}></span>
                Planned
              </div>
            </div>
          ))}
        </div>

        {/* Info Cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="info-content">
              <h4>Real-time Monitoring</h4>
              <p>Notifikasi dikirim dalam hitungan detik setelah event terdeteksi</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="info-content">
              <h4>Smart Filtering</h4>
              <p>Filter cerdas untuk menghindari spam notifikasi yang tidak penting</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="info-content">
              <h4>Auto Escalation</h4>
              <p>Eskalasi otomatis jika alert tidak ditangani dalam waktu tertentu</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
                .alerts-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .hero-card {
                    position: relative;
                    background: var(--bg-card);
                    border-radius: 20px;
                    border: 1px solid var(--border-main);
                    padding: 48px;
                    overflow: hidden;
                    text-align: center;
                }

                .hero-glow {
                    position: absolute;
                    top: -50%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 600px;
                    height: 400px;
                    background: radial-gradient(ellipse, rgba(255, 159, 67, 0.15) 0%, transparent 70%);
                    pointer-events: none;
                }

                .hero-content {
                    position: relative;
                    z-index: 1;
                }

                .badge-coming-soon {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, rgba(255, 159, 67, 0.2), rgba(255, 107, 107, 0.2));
                    border: 1px solid rgba(255, 159, 67, 0.3);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    color: #ff9f43;
                    margin-bottom: 24px;
                }

                .pulse {
                    width: 8px;
                    height: 8px;
                    background: #ff9f43;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                .hero-content h1 {
                    font-size: 2.5rem;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #ff9f43, #ff6b6b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero-content > p {
                    color: var(--text-gray);
                    max-width: 500px;
                    margin: 0 auto 32px;
                    line-height: 1.7;
                }

                .progress-section {
                    max-width: 400px;
                    margin: 0 auto;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                    color: var(--text-gray);
                }

                .progress-percent {
                    color: #ff9f43;
                    font-weight: 600;
                }

                .progress-track {
                    height: 8px;
                    background: var(--bg-hover);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff9f43, #ff6b6b);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }

                .feature-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    transition: all 0.3s ease;
                    animation: fadeInUp 0.5s ease forwards;
                    opacity: 0;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .feature-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .feature-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }

                .feature-card h3 {
                    font-size: 1.1rem;
                    margin-bottom: 8px;
                    color: var(--text-main);
                }

                .feature-card p {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    margin-bottom: 16px;
                    line-height: 1.5;
                }

                .feature-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    animation: blink 2s infinite;
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                }

                .info-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    transition: all 0.3s ease;
                }

                .info-card:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .info-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .info-icon.blue {
                    background: rgba(77, 159, 255, 0.15);
                    color: #4d9fff;
                }

                .info-icon.green {
                    background: rgba(61, 214, 140, 0.15);
                    color: #3dd68c;
                }

                .info-icon.purple {
                    background: rgba(124, 92, 255, 0.15);
                    color: #7c5cff;
                }

                .info-content h4 {
                    font-size: 1rem;
                    margin-bottom: 6px;
                    color: var(--text-main);
                }

                .info-content p {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    line-height: 1.5;
                    margin: 0;
                }
            `}</style>
    </div>
  );
}

