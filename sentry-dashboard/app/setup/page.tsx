'use client';

import { useState } from 'react';

/*
 * Halaman Setup Agent
 * Berisi instruksi instalasi agent di server
 */
export default function HalamanSetup() {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000');
    const [apiKey, setApiKey] = useState('rahasia-123');
    const [sudahCopy, setSudahCopy] = useState(false);

    // command untuk install di linux
    const cmdLinux = `# Download dan install Sentry Agent
curl -sSL https://domain-kamu.com/install.sh | bash

# Atau setup manual:
# 1. Download binary dari GitHub releases
# 2. Set environment variable:
export SENTRY_SERVER_URL="${serverUrl}"
export SENTRY_API_KEY="${apiKey}"
export SENTRY_NODE_NAME="$(hostname)"

# 3. Jalankan agent
./sentry-agent`;

    // command untuk docker
    const cmdDocker = `# Jalankan dengan Docker
docker run -d \\
  --name sentry-agent \\
  -e SENTRY_SERVER_URL="${serverUrl}" \\
  -e SENTRY_API_KEY="${apiKey}" \\
  -e SENTRY_NODE_NAME="$(hostname)" \\
  -v /var/log:/var/log:ro \\
  bintang/sentry-agent:latest`;

    function copyKe(teks: string) {
        navigator.clipboard.writeText(teks);
        setSudahCopy(true);
        setTimeout(() => setSudahCopy(false), 2000);
    }

    return (
        <>
            <div className="page-header">
                <h2>⚙️ Setup Agent</h2>
                <p>Install agent di server untuk mulai monitoring</p>
            </div>

            {/* konfigurasi */}
            <div className="card">
                <div className="card-header">
                    <h3>🔧 Konfigurasi</h3>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label className="form-label">URL Server</label>
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
                    <h3>🐧 Install di Linux</h3>
                    <button className="btn btn-secondary" onClick={() => copyKe(cmdLinux)}>
                        {sudahCopy ? '✅ Tercopy!' : '📋 Copy'}
                    </button>
                </div>
                <div className="card-body">
                    <pre className="code-block">{cmdLinux}</pre>
                </div>
            </div>

            {/* install docker */}
            <div className="card">
                <div className="card-header">
                    <h3>🐳 Install dengan Docker</h3>
                    <button className="btn btn-secondary" onClick={() => copyKe(cmdDocker)}>
                        {sudahCopy ? '✅ Tercopy!' : '📋 Copy'}
                    </button>
                </div>
                <div className="card-body">
                    <pre className="code-block">{cmdDocker}</pre>
                </div>
            </div>

            {/* build dari source */}
            <div className="card">
                <div className="card-header">
                    <h3>🔨 Build dari Source</h3>
                </div>
                <div className="card-body">
                    <pre className="code-block">{`# Clone repo
git clone https://github.com/bintang/sentry-agent.git
cd sentry-agent

# Build untuk Linux
GOOS=linux GOARCH=amd64 go build -o sentry-agent ./cmd/agent

# Build untuk Windows
GOOS=windows GOARCH=amd64 go build -o sentry-agent.exe ./cmd/agent

# Build untuk ARM (Raspberry Pi)
GOOS=linux GOARCH=arm64 go build -o sentry-agent-arm64 ./cmd/agent`}</pre>
                </div>
            </div>
        </>
    );
}
