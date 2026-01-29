'use client';

import { useState } from 'react';

export default function HalamanSetup() {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000');
    const [apiKey, setApiKey] = useState('rahasia-123');
    const [copied, setCopied] = useState('');
    const [activeTab, setActiveTab] = useState('linux');

    const cmdLinux = `# Download dan install Sentry Agent
curl -sSL https://domain-kamu.com/install.sh | bash

# Atau setup manual:
# 1. Download binary dari GitHub releases
# 2. Set environment variable:
export SENTRY_SERVER_URL="${serverUrl}"
export SENTRY_API_KEY="${apiKey}"
export SENTRY_NODE_NAME="$(hostname)"
export SENTRY_LOG_PATH="/var/log/secure"  # untuk CentOS

# 3. Jalankan agent
./sentry-agent`;

    const cmdDocker = `# Jalankan dengan Docker
docker run -d \\
  --name sentry-agent \\
  -e SENTRY_SERVER_URL="${serverUrl}" \\
  -e SENTRY_API_KEY="${apiKey}" \\
  -e SENTRY_NODE_NAME="$(hostname)" \\
  -v /var/log:/var/log:ro \\
  bintang/sentry-agent:latest`;

    const cmdSystemd = `# Buat systemd service
sudo tee /etc/systemd/system/sentry-agent.service << EOF
[Unit]
Description=Sentry Agent
After=network.target

[Service]
Type=simple
Environment="SENTRY_SERVER_URL=${serverUrl}"
Environment="SENTRY_API_KEY=${apiKey}"
Environment="SENTRY_NODE_NAME=$(hostname)"
Environment="SENTRY_LOG_PATH=/var/log/secure"
WorkingDirectory=/opt/sentry-agent
ExecStart=/opt/sentry-agent/sentry-agent
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable dan start
sudo systemctl daemon-reload
sudo systemctl enable sentry-agent
sudo systemctl start sentry-agent`;

    const cmdBuild = `# Clone repo
git clone https://github.com/alfalaq12/dashboard-security.git
cd dashboard-security/sentry-agent

# Build untuk Linux
go build -o sentry-agent ./cmd/agent

# Build untuk Windows
GOOS=windows GOARCH=amd64 go build -o sentry-agent.exe ./cmd/agent

# Build untuk ARM (Raspberry Pi)
GOOS=linux GOARCH=arm64 go build -o sentry-agent-arm64 ./cmd/agent`;

    function copyKe(teks: string, id: string) {
        navigator.clipboard.writeText(teks);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    }

    const tabs = [
        { id: 'linux', label: 'Linux', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg> },
        { id: 'systemd', label: 'Systemd', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /></svg>, recommended: true },
        { id: 'docker', label: 'Docker', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" /></svg> },
        { id: 'source', label: 'Build', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg> },
    ];

    const getCommandByTab = () => {
        switch (activeTab) {
            case 'linux': return cmdLinux;
            case 'systemd': return cmdSystemd;
            case 'docker': return cmdDocker;
            case 'source': return cmdBuild;
            default: return cmdLinux;
        }
    };

    return (
        <div className="premium-dashboard">
            {/* Page Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        Agent Setup
                    </h1>
                    <p className="header-subtitle">Install agent on your servers to start monitoring</p>
                </div>
            </div>

            {/* Configuration Card */}
            <div className="premium-card config-card">
                <div className="card-header">
                    <div className="header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82" />
                        </svg>
                        <h3>Configuration</h3>
                    </div>
                    <span className="config-hint">Commands will update automatically</span>
                </div>
                <div className="card-body">
                    <div className="config-grid">
                        <div className="config-field">
                            <label>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10" />
                                </svg>
                                Dashboard URL
                            </label>
                            <input
                                type="text"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="https://sentry.yourdomain.com"
                            />
                        </div>
                        <div className="config-field">
                            <label>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                API Key
                            </label>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="your-secret-api-key"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Installation Card */}
            <div className="premium-card install-card">
                <div className="card-header">
                    <div className="header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="4 17 10 11 4 5" />
                            <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                        <h3>Installation</h3>
                    </div>
                </div>
                <div className="card-body">
                    {/* Tabs */}
                    <div className="install-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.recommended && <span className="recommended-badge">Recommended</span>}
                            </button>
                        ))}
                    </div>

                    {/* Code Block */}
                    <div className="code-container">
                        <div className="code-header">
                            <span className="code-title">
                                {activeTab === 'linux' && 'Manual Installation'}
                                {activeTab === 'systemd' && 'Systemd Service'}
                                {activeTab === 'docker' && 'Docker Container'}
                                {activeTab === 'source' && 'Build from Source'}
                            </span>
                            <button
                                className={`copy-btn ${copied === activeTab ? 'copied' : ''}`}
                                onClick={() => copyKe(getCommandByTab(), activeTab)}
                            >
                                {copied === activeTab ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="code-block">{getCommandByTab()}</pre>
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="tips-grid">
                <div className="tip-card">
                    <div className="tip-icon blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    </div>
                    <div className="tip-content">
                        <h4>Auto Reconnect</h4>
                        <p>Agent akan otomatis reconnect jika koneksi terputus</p>
                    </div>
                </div>
                <div className="tip-card">
                    <div className="tip-icon green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <div className="tip-content">
                        <h4>Secure Connection</h4>
                        <p>Komunikasi terenkripsi antara agent dan dashboard</p>
                    </div>
                </div>
                <div className="tip-card">
                    <div className="tip-icon purple">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className="tip-content">
                        <h4>Low Overhead</h4>
                        <p>Resource usage minimal, tidak membebani server</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .config-card .card-body {
                    padding: 24px;
                }
                
                .config-hint {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                
                .config-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                .config-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .config-field label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    font-weight: 500;
                }
                
                .config-field input {
                    padding: 14px 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: var(--text-white);
                    font-size: 0.95rem;
                    font-family: monospace;
                    transition: all 0.2s;
                }
                
                .config-field input:focus {
                    outline: none;
                    border-color: #7c5cff;
                    background: rgba(124, 92, 255, 0.05);
                }
                
                .install-card .card-body {
                    padding: 0;
                }
                
                .install-tabs {
                    display: flex;
                    gap: 4px;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    overflow-x: auto;
                }
                
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    color: var(--text-gray);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                
                .tab-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-white);
                }
                
                .tab-btn.active {
                    background: rgba(124, 92, 255, 0.15);
                    border-color: rgba(124, 92, 255, 0.3);
                    color: #7c5cff;
                }
                
                .recommended-badge {
                    padding: 2px 6px;
                    background: rgba(0, 217, 165, 0.15);
                    color: #00d9a5;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .code-container {
                    background: #0d0d14;
                    border-radius: 0 0 16px 16px;
                }
                
                .code-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                
                .code-title {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .copy-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: var(--text-gray);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .copy-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-white);
                }
                
                .copy-btn.copied {
                    background: rgba(0, 217, 165, 0.15);
                    border-color: rgba(0, 217, 165, 0.3);
                    color: #00d9a5;
                }
                
                .code-block {
                    padding: 20px;
                    margin: 0;
                    font-size: 0.85rem;
                    line-height: 1.6;
                    color: #c4c9d4;
                    overflow-x: auto;
                    max-height: 400px;
                }
                
                .tips-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-top: 20px;
                }
                
                .tip-card {
                    display: flex;
                    gap: 16px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    transition: all 0.2s;
                }
                
                .tip-card:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                }
                
                .tip-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .tip-icon.blue { background: rgba(77, 159, 255, 0.15); color: #4d9fff; }
                .tip-icon.green { background: rgba(0, 217, 165, 0.15); color: #00d9a5; }
                .tip-icon.purple { background: rgba(124, 92, 255, 0.15); color: #7c5cff; }
                
                .tip-content h4 {
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .tip-content p {
                    font-size: 0.8rem;
                    color: var(--text-gray);
                    line-height: 1.4;
                    margin: 0;
                }
                
                @media (max-width: 1024px) {
                    .tips-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                @media (max-width: 768px) {
                    .config-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .install-tabs {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                }
            `}</style>
        </div>
    );
}
