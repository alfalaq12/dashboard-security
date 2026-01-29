'use client';

import { useEffect, useState } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup
} from 'react-simple-maps';

interface GeoMarker {
    ip: string;
    attacks: number;
    country: string;
    countryCode: string;
    city: string;
    lat: number;
    lon: number;
}

interface GeoData {
    totalAttackers: number;
    markers: GeoMarker[];
    topCountries: Array<{
        countryCode: string;
        country: string;
        count: number;
        attacks: number;
    }>;
    summary: {
        totalAttacks: number;
        uniqueCountries: number;
    };
}

const WARNA = {
    primary: '#7c5cff',
    blue: '#4d9fff',
    green: '#3dd68c',
    red: '#ff5a5a',
    orange: '#ffaa33',
    gray: '#606078'
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function HalamanGeo() {
    const [data, setData] = useState<GeoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredMarker, setHoveredMarker] = useState<GeoMarker | null>(null);
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    useEffect(() => {
        async function fetchGeo() {
            try {
                const res = await fetch('/api/geo');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Gagal fetch geo data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchGeo();
        const timer = setInterval(fetchGeo, 30000);
        return () => clearInterval(timer);
    }, []);

    function handleZoomIn() {
        if (position.zoom >= 4) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
    }

    function handleZoomOut() {
        if (position.zoom <= 1) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
    }

    function handleReset() {
        setPosition({ coordinates: [0, 20], zoom: 1 });
    }

    function handleMoveEnd(position: { coordinates: [number, number]; zoom: number }) {
        setPosition(position);
    }

    function getMarkerSize(attacks: number) {
        if (attacks >= 50) return 14;
        if (attacks >= 20) return 11;
        if (attacks >= 10) return 8;
        return 5;
    }

    function getMarkerOpacity(attacks: number) {
        if (attacks >= 50) return 0.9;
        if (attacks >= 20) return 0.75;
        return 0.6;
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 10 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    IP Geolocation Map
                </h2>
                <p>Visualisasi geografis asal serangan • <span className="live-indicator"><span className="live-dot"></span> Live</span></p>
            </div>

            {/* Hero Stats */}
            <div className="hero-stats">
                <div className="hero-stat red">
                    <div className="hero-stat-glow"></div>
                    <div className="hero-stat-content">
                        <div className="hero-stat-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="hero-stat-info">
                            <div className="hero-stat-value">{data?.summary?.totalAttacks || 0}</div>
                            <div className="hero-stat-label">Total Serangan</div>
                        </div>
                    </div>
                </div>

                <div className="hero-stat orange">
                    <div className="hero-stat-glow"></div>
                    <div className="hero-stat-content">
                        <div className="hero-stat-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        <div className="hero-stat-info">
                            <div className="hero-stat-value">{data?.totalAttackers || 0}</div>
                            <div className="hero-stat-label">IP Penyerang</div>
                        </div>
                    </div>
                </div>

                <div className="hero-stat blue">
                    <div className="hero-stat-glow"></div>
                    <div className="hero-stat-content">
                        <div className="hero-stat-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                        </div>
                        <div className="hero-stat-info">
                            <div className="hero-stat-value">{data?.summary?.uniqueCountries || 0}</div>
                            <div className="hero-stat-label">Negara Asal</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="geo-container">
                {/* Map */}
                <div className="map-wrapper">
                    <div className="map-card">
                        <div className="map-overlay-top"></div>
                        <div className="map-overlay-bottom"></div>

                        <div className="map-controls">
                            <button onClick={handleZoomIn} className="control-btn" title="Zoom In">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                            <button onClick={handleZoomOut} className="control-btn" title="Zoom Out">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                            <button onClick={handleReset} className="control-btn" title="Reset View">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>
                        </div>

                        <ComposableMap
                            projectionConfig={{
                                rotate: [-10, 0, 0],
                                scale: 147
                            }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <defs>
                                <radialGradient id="markerGrad" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#ff5a5a" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#ff5a5a" stopOpacity="0.3" />
                                </radialGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            <ZoomableGroup
                                zoom={position.zoom}
                                center={position.coordinates}
                                onMoveEnd={handleMoveEnd}
                            >
                                <Geographies geography={geoUrl}>
                                    {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                                        geographies.map((geo) => {
                                            const isHighlighted = data?.topCountries?.some(
                                                c => c.countryCode === selectedCountry
                                            );
                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    fill={isHighlighted ? '#3a3a5a' : '#252535'}
                                                    stroke="#3a3a4a"
                                                    strokeWidth={0.3}
                                                    style={{
                                                        default: { outline: 'none' },
                                                        hover: { fill: '#353550', outline: 'none', transition: 'all 0.3s' },
                                                        pressed: { outline: 'none' }
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>

                                {/* Connection lines */}
                                {data?.markers?.slice(0, 20).map((marker) => (
                                    <line
                                        key={`line-${marker.ip}`}
                                        x1={0}
                                        y1={0}
                                        x2={marker.lon}
                                        y2={marker.lat}
                                        stroke="rgba(255, 90, 90, 0.1)"
                                        strokeWidth={0.5}
                                        strokeDasharray="2,2"
                                    />
                                ))}

                                {data?.markers?.map((marker) => (
                                    <Marker
                                        key={marker.ip}
                                        coordinates={[marker.lon, marker.lat]}
                                        onMouseEnter={() => setHoveredMarker(marker)}
                                        onMouseLeave={() => setHoveredMarker(null)}
                                    >
                                        {/* Pulse ring */}
                                        <circle
                                            r={getMarkerSize(marker.attacks) + 4}
                                            fill="none"
                                            stroke={WARNA.red}
                                            strokeWidth={1}
                                            opacity={0.3}
                                            className="pulse-ring"
                                        />
                                        {/* Main marker */}
                                        <circle
                                            r={getMarkerSize(marker.attacks)}
                                            fill={WARNA.red}
                                            fillOpacity={getMarkerOpacity(marker.attacks)}
                                            stroke="#fff"
                                            strokeWidth={1}
                                            filter="url(#glow)"
                                            style={{ cursor: 'pointer' }}
                                        />
                                        {/* Center dot */}
                                        <circle
                                            r={2}
                                            fill="#fff"
                                            fillOpacity={0.9}
                                        />
                                    </Marker>
                                ))}
                            </ZoomableGroup>
                        </ComposableMap>

                        {/* Tooltip */}
                        {hoveredMarker && (
                            <div className="hover-tooltip">
                                <div className="tooltip-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={WARNA.red} strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <div className="tooltip-content">
                                    <div className="tooltip-ip">{hoveredMarker.ip}</div>
                                    <div className="tooltip-location">{hoveredMarker.city}, {hoveredMarker.country}</div>
                                    <div className="tooltip-attacks">
                                        <span className="attacks-num">{hoveredMarker.attacks}</span> serangan
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="map-legend">
                            <div className="legend-title">Intensitas</div>
                            <div className="legend-items">
                                <div className="legend-item">
                                    <span className="legend-dot small"></span>
                                    <span>&lt; 10</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot medium"></span>
                                    <span>10-20</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot large"></span>
                                    <span>&gt; 20</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="geo-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-header">
                            <h3>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                    <line x1="4" y1="22" x2="4" y2="15" />
                                </svg>
                                Top Negara
                            </h3>
                        </div>
                        <div className="sidebar-body">
                            {data?.topCountries && data.topCountries.length > 0 ? (
                                <div className="country-list">
                                    {data.topCountries.map((country, idx) => (
                                        <div
                                            key={country.countryCode}
                                            className={`country-row ${selectedCountry === country.countryCode ? 'selected' : ''}`}
                                            onMouseEnter={() => setSelectedCountry(country.countryCode)}
                                            onMouseLeave={() => setSelectedCountry(null)}
                                        >
                                            <div className="country-rank-badge" data-rank={idx + 1}>
                                                {idx + 1}
                                            </div>
                                            <div className="country-details">
                                                <div className="country-name">{country.country}</div>
                                                <div className="country-bar">
                                                    <div
                                                        className="country-bar-fill"
                                                        style={{
                                                            width: `${(country.attacks / (data.topCountries[0]?.attacks || 1)) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="country-attacks">
                                                <span className="attacks-value">{country.attacks}</span>
                                                <span className="attacks-unit">hits</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-sidebar">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8 15h8M9 9h.01M15 9h.01" />
                                    </svg>
                                    <p>Belum ada data serangan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Attacks */}
                    <div className="sidebar-card">
                        <div className="sidebar-header">
                            <h3>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Serangan Terbaru
                            </h3>
                        </div>
                        <div className="sidebar-body">
                            {data?.markers && data.markers.length > 0 ? (
                                <div className="attack-list">
                                    {data.markers.slice(0, 5).map((marker) => (
                                        <div key={marker.ip} className="attack-item">
                                            <div className="attack-dot"></div>
                                            <div className="attack-info">
                                                <code>{marker.ip}</code>
                                                <span className="attack-loc">{marker.city}</span>
                                            </div>
                                            <div className="attack-count">{marker.attacks}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-sidebar">
                                    <p>Tidak ada serangan</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .live-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: ${WARNA.green};
                    font-size: 0.9rem;
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: ${WARNA.green};
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                .hero-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .hero-stat {
                    position: relative;
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    padding: 20px 24px;
                    overflow: hidden;
                }

                .hero-stat-glow {
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    opacity: 0.15;
                    pointer-events: none;
                }

                .hero-stat.red .hero-stat-glow { background: radial-gradient(circle, ${WARNA.red} 0%, transparent 70%); }
                .hero-stat.orange .hero-stat-glow { background: radial-gradient(circle, ${WARNA.orange} 0%, transparent 70%); }
                .hero-stat.blue .hero-stat-glow { background: radial-gradient(circle, ${WARNA.blue} 0%, transparent 70%); }

                .hero-stat.red .hero-stat-icon { color: ${WARNA.red}; background: rgba(255, 90, 90, 0.15); }
                .hero-stat.orange .hero-stat-icon { color: ${WARNA.orange}; background: rgba(255, 170, 51, 0.15); }
                .hero-stat.blue .hero-stat-icon { color: ${WARNA.blue}; background: rgba(77, 159, 255, 0.15); }

                .hero-stat.red .hero-stat-value { color: ${WARNA.red}; }
                .hero-stat.orange .hero-stat-value { color: ${WARNA.orange}; }
                .hero-stat.blue .hero-stat-value { color: ${WARNA.blue}; }

                .hero-stat-content {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .hero-stat-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hero-stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .hero-stat-label {
                    font-size: 0.9rem;
                    color: var(--text-gray);
                    margin-top: 4px;
                }

                .geo-container {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 20px;
                }

                @media (max-width: 1100px) {
                    .geo-container { grid-template-columns: 1fr; }
                    .hero-stats { grid-template-columns: 1fr; }
                }

                .map-wrapper {
                    position: relative;
                }

                .map-card {
                    position: relative;
                    background: linear-gradient(180deg, #1a1a28 0%, #12121a 100%);
                    border: 1px solid var(--border-main);
                    border-radius: 16px;
                    height: 500px;
                    overflow: hidden;
                }

                .map-overlay-top {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: linear-gradient(180deg, rgba(18, 18, 26, 0.9) 0%, transparent 100%);
                    pointer-events: none;
                    z-index: 2;
                }

                .map-overlay-bottom {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 80px;
                    background: linear-gradient(0deg, rgba(18, 18, 26, 0.9) 0%, transparent 100%);
                    pointer-events: none;
                    z-index: 2;
                }

                .map-controls {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    z-index: 10;
                }

                .control-btn {
                    width: 36px;
                    height: 36px;
                    background: rgba(30, 30, 45, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--border-main);
                    border-radius: 8px;
                    color: var(--text-main);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .control-btn:hover {
                    background: var(--primary);
                    border-color: var(--primary);
                }

                .hover-tooltip {
                    position: absolute;
                    bottom: 80px;
                    left: 20px;
                    background: rgba(20, 20, 30, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 90, 90, 0.3);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    gap: 12px;
                    z-index: 20;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .tooltip-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 90, 90, 0.15);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .tooltip-ip {
                    font-family: monospace;
                    font-size: 1rem;
                    color: ${WARNA.red};
                    font-weight: 600;
                }

                .tooltip-location {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    margin: 4px 0;
                }

                .tooltip-attacks {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .attacks-num {
                    font-weight: 600;
                    color: var(--text-main);
                }

                .map-legend {
                    position: absolute;
                    bottom: 16px;
                    left: 16px;
                    background: rgba(20, 20, 30, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--border-main);
                    border-radius: 10px;
                    padding: 12px 16px;
                    z-index: 10;
                }

                .legend-title {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }

                .legend-items {
                    display: flex;
                    gap: 16px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--text-gray);
                }

                .legend-dot {
                    border-radius: 50%;
                    background: ${WARNA.red};
                }

                .legend-dot.small { width: 6px; height: 6px; opacity: 0.5; }
                .legend-dot.medium { width: 10px; height: 10px; opacity: 0.7; }
                .legend-dot.large { width: 14px; height: 14px; opacity: 0.9; }

                .geo-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .sidebar-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-main);
                    border-radius: 14px;
                    overflow: hidden;
                }

                .sidebar-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-main);
                }

                .sidebar-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0;
                }

                .sidebar-body {
                    padding: 12px;
                }

                .country-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .country-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .country-row:hover, .country-row.selected {
                    background: var(--bg-hover);
                }

                .country-rank-badge {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: var(--bg-hover);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-gray);
                }

                .country-row:nth-child(1) .country-rank-badge { background: rgba(255, 90, 90, 0.2); color: ${WARNA.red}; }
                .country-row:nth-child(2) .country-rank-badge { background: rgba(255, 170, 51, 0.2); color: ${WARNA.orange}; }
                .country-row:nth-child(3) .country-rank-badge { background: rgba(77, 159, 255, 0.2); color: ${WARNA.blue}; }

                .country-details {
                    flex: 1;
                    min-width: 0;
                }

                .country-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-bottom: 6px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .country-bar {
                    height: 4px;
                    background: var(--bg-hover);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .country-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, ${WARNA.red}, ${WARNA.orange});
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .country-attacks {
                    text-align: right;
                }

                .attacks-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: ${WARNA.red};
                }

                .attacks-unit {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }

                .attack-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .attack-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }

                .attack-item:hover {
                    background: var(--bg-hover);
                }

                .attack-dot {
                    width: 8px;
                    height: 8px;
                    background: ${WARNA.red};
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .attack-info {
                    flex: 1;
                    min-width: 0;
                }

                .attack-info code {
                    font-size: 0.8rem;
                    color: var(--text-main);
                    display: block;
                }

                .attack-loc {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .attack-count {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: ${WARNA.red};
                }

                .empty-sidebar {
                    text-align: center;
                    padding: 24px;
                    color: var(--text-muted);
                }

                .empty-sidebar p {
                    margin: 8px 0 0;
                    font-size: 0.85rem;
                }

                :global(.pulse-ring) {
                    animation: pulseRing 2s infinite;
                }

                @keyframes pulseRing {
                    0% { opacity: 0.3; r: 8; }
                    50% { opacity: 0.1; r: 16; }
                    100% { opacity: 0.3; r: 8; }
                }
            `}</style>
        </>
    );
}
