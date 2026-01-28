import type { Metadata } from "next";
import "./globals.css";

/*
 * Metadata untuk SEO dan title browser
 */
export const metadata: Metadata = {
  title: "Sentry - Monitor Server",
  description: "Dashboard monitoring keamanan server secara realtime",
};

/*
 * Root Layout
 * Komponen utama yang membungkus semua halaman
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* font dari google */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="layout">
          {/* sidebar navigasi */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <span className="shield">🛡️</span>
              <h1>Sentry</h1>
            </div>

            <nav>
              {/* menu utama */}
              <div className="nav-section">
                <div className="nav-section-title">Menu</div>
                <a href="/" className="nav-link active">
                  <span className="icon">📊</span>
                  <span>Dashboard</span>
                </a>
                <a href="/nodes" className="nav-link">
                  <span className="icon">🖥️</span>
                  <span>Nodes</span>
                </a>
              </div>

              {/* menu keamanan */}
              <div className="nav-section">
                <div className="nav-section-title">Keamanan</div>
                <a href="/security" className="nav-link">
                  <span className="icon">🔐</span>
                  <span>SSH Events</span>
                </a>
                <a href="/alerts" className="nav-link">
                  <span className="icon">🚨</span>
                  <span>Alerts</span>
                </a>
              </div>

              {/* menu pengaturan */}
              <div className="nav-section">
                <div className="nav-section-title">Pengaturan</div>
                <a href="/setup" className="nav-link">
                  <span className="icon">⚙️</span>
                  <span>Setup Agent</span>
                </a>
              </div>
            </nav>
          </aside>

          {/* area konten */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
