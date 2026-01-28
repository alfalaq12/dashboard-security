'use client';

import { useState } from 'react';

/*
 * Halaman Setup Agent
 * Instruksi instalasi agent di server
 */
export default function HalamanSetup() {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000');
    const [apiKey, setApiKey] = useState('rahasia-123');
    const [copied, setCopied] = useState('');

    // command install linux
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

    // command docker
    const cmdDocker = `# Jalankan dengan Docker
docker run -d \\
  --name sentry-agent \\
  -e SENTRY_SERVER_URL="${serverUrl}" \\
  -e SENTRY_API_KEY="${apiKey}" \\
  -e SENTRY_NODE_NAME="$(hostname)" \\
  -v /var/log:/var/log:ro \\
  bintang/sentry-agent:latest`;

    // command systemd
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

    function copyKe(teks: string, id: string) {
        navigator.clipboard.writeText(teks);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    }

    return (
        <>
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Setup Agent
                </h2>
                <p>Install agent di server untuk mulai monitoring</p>
            </div>

            {/* konfigurasi */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06" />
                        </svg>
                        Konfigurasi
                    </h3>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label className="form-label">URL Server Dashboard</label>
                        <input
                            type="text"
                            className="form-input"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            placeholder="https://sentry.domain-kamu.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">API Key</label>
                        <input
                            type="text"
                            className="form-input"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="masukkan api key"
                        />
                    </div>
                </div>
            </div>

            {/* install linux */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <polyline points="4 17 10 11 4 5" />
                            <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                        Install Manual (Linux)
                    </h3>
                    <button className="btn btn-secondary" onClick={() => copyKe(cmdLinux, 'linux')}>
                        {copied === 'linux' ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Tercopy!
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
                <div className="card-body">
                    <pre className="code-block">{cmdLinux}</pre>
                </div>
            </div>

            {/* systemd service */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <rect x="2" y="2" width="20" height="8" rx="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" />
                        </svg>
                        Systemd Service (Recommended)
                    </h3>
                    <button className="btn btn-secondary" onClick={() => copyKe(cmdSystemd, 'systemd')}>
                        {copied === 'systemd' ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Tercopy!
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
                <div className="card-body">
                    <pre className="code-block">{cmdSystemd}</pre>
                </div>
            </div>

            {/* docker */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
                        </svg>
                        Docker
                    </h3>
                    <button className="btn btn-secondary" onClick={() => copyKe(cmdDocker, 'docker')}>
                        {copied === 'docker' ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Tercopy!
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
                <div className="card-body">
                    <pre className="code-block">{cmdDocker}</pre>
                </div>
            </div>

            {/* build dari source */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                        Build dari Source
                    </h3>
                </div>
                <div className="card-body">
                    <pre className="code-block">{`# Clone repo
git clone https://github.com/alfalaq12/dashboard-security.git
cd dashboard-security/sentry-agent

# Build untuk Linux
go build -o sentry-agent ./cmd/agent

# Build untuk Windows
GOOS=windows GOARCH=amd64 go build -o sentry-agent.exe ./cmd/agent

# Build untuk ARM (Raspberry Pi)
GOOS=linux GOARCH=arm64 go build -o sentry-agent-arm64 ./cmd/agent`}</pre>
                </div>
            </div>
        </>
    );
}
