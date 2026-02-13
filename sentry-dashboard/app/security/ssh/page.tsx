'use client';

import { useState, useEffect } from 'react';
import {
    Clock,
    Shield,
    Search,
    RefreshCw,
    Server,
    User,
    Terminal,
    AlertTriangle
} from 'lucide-react';

interface ActiveSession {
    user: string;
    ip: string;
    login_time: string;
    tty: string;
}

interface ActiveSessionEvent {
    id: string;
    nodeName: string;
    timestamp: string;
    data: ActiveSession[];
}

export default function SSHMonitoringPage() {
    const [history, setHistory] = useState<ActiveSessionEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/events/ssh');
            const data = await res.json();
            if (data.activeSessionsHistory) {
                setHistory(data.activeSessionsHistory);
            }
        } catch (error) {
            console.error('Failed to fetch SSH data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    // Get unique nodes
    const nodes = Array.from(new Set(history.map(h => h.nodeName)));

    // Filter data
    const filteredHistory = history.filter(event => {
        if (selectedNode !== 'all' && event.nodeName !== selectedNode) return false;

        // Search in sessions
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const inNode = event.nodeName.toLowerCase().includes(term);
            const inSessions = event.data.some(s =>
                s.user.toLowerCase().includes(term) ||
                s.ip.includes(term) ||
                s.tty.toLowerCase().includes(term)
            );
            return inNode || inSessions;
        }
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        SSH Session Monitoring
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Track active SSH sessions across your infrastructure (Retention: 1 Month)
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                >
                    <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 bg-[#0d0d1a]/80 border border-white/10 rounded-xl">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search user, IP, or node..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1a1a28] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                <select
                    value={selectedNode}
                    onChange={(e) => setSelectedNode(e.target.value)}
                    className="bg-[#1a1a28] border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
                >
                    <option value="all">All Nodes</option>
                    {nodes.map(node => (
                        <option key={node} value={node}>{node}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto space-y-4">
                {isLoading && history.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">Loading SSH sessions history...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No SSH session data found</div>
                ) : (
                    filteredHistory.map((event) => (
                        <div key={event.id} className="bg-[#0d0d1a]/80 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                        <Server className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="font-medium text-gray-200">{event.nodeName}</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDate(event.timestamp)}
                                    </div>
                                </div>
                                <div className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    {event.data.length} Active Sessions
                                </div>
                            </div>

                            <div className="divide-y divide-white/5">
                                {event.data.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500 italic">
                                        No active sessions at this time
                                    </div>
                                ) : (
                                    event.data.map((session, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3 w-48">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-300 font-medium">{session.user}</span>
                                                </div>
                                                <div className="flex items-center gap-2 w-48">
                                                    <Shield className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-mono text-gray-400">{session.ip}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Terminal className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-400">{session.tty}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 w-32 text-right">
                                                    Since {new Date(session.login_time).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
