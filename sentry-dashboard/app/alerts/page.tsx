'use client';

export default function HalamanAlerts() {
    return (
        <div className="alerts-coming-soon">
            <div className="coming-soon-content">
                <div className="icon-wrapper">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradAlert)" strokeWidth="1.5">
                        <defs>
                            <linearGradient id="gradAlert" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ff9f43" />
                                <stop offset="100%" stopColor="#ff6b6b" />
                            </linearGradient>
                        </defs>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h1>Coming Soon</h1>
                <p>Fitur Alerts & Notifications sedang dalam tahap pengembangan.</p>
                <div className="progress-bar">
                    <div className="progress-value"></div>
                </div>
                <p className="sub-text">Kami sedang membangun sistem notifikasi real-time via Email, Telegram, dan Discord.</p>
            </div>

            <style jsx>{`
        .alerts-coming-soon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }
        
        .coming-soon-content {
          background: var(--bg-card);
          padding: 40px;
          border-radius: 16px;
          border: 1px solid var(--border-main);
          max-width: 480px;
          box-shadow: var(--shadow-card);
        }

        .icon-wrapper {
          margin-bottom: 24px;
          animation: floatIcon 3s ease-in-out infinite;
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 12px;
          background: linear-gradient(to right, #ff9f43, #ff6b6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: var(--text-gray);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .progress-bar {
          height: 6px;
          background: var(--bg-hover);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 16px;
          position: relative;
        }

        .progress-value {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 60%;
          background: linear-gradient(to right, #ff9f43, #ff6b6b);
          border-radius: 3px;
          animation: shimmer 2s infinite linear;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .sub-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 0;
        }
      `}</style>
        </div>
    );
}
