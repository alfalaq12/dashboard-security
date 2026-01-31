'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import CredentialModal from './components/CredentialModal';
import FileManager from './components/FileManager';

// Dynamic import for Terminal (SSR disabled)
const Terminal = dynamic(() => import('./components/Terminal'), { ssr: false });

interface Credential {
    id: number;
    nodeId: string;
    name: string;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'privatekey';
}

interface Node {
    nodeName: string;
    hostname: string;
    os: string;
    isOnline: boolean;
}

// Icons
const TerminalIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

const FolderIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export default function SSHConsolePage() {
    const [activeTab, setActiveTab] = useState<'terminal' | 'files'>('terminal');
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
    const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);

    // Fetch credentials
    const loadCredentials = useCallback(async () => {
        try {
            const response = await fetch('/api/ssh/credentials');
            const data = await response.json();
            if (data.success) {
                setCredentials(data.credentials);
            }
        } catch (err) {
            console.error('Failed to load credentials:', err);
        } finally {
            setIsLoadingCredentials(false);
        }
    }, []);

    // Fetch nodes
    const loadNodes = useCallback(async () => {
        try {
            const response = await fetch('/api/nodes');
            const data = await response.json();
            // /api/nodes returns { nodes: [...], totalNodes, onlineNodes, ... }
            if (data.nodes && Array.isArray(data.nodes)) {
                setNodes(data.nodes.map((n: any) => ({
                    nodeName: n.nodeName || n.hostname,
                    hostname: n.hostname || n.nodeName,
                    os: n.os || 'Unknown',
                    isOnline: n.isOnline ?? true,
                })));
            }
        } catch (err) {
            console.error('Failed to load nodes:', err);
        }
    }, []);

    useEffect(() => {
        loadCredentials();
        loadNodes();
    }, [loadCredentials, loadNodes]);

    const handleDeleteCredential = async (id: number) => {
        if (!confirm('Are you sure you want to delete this credential?')) return;

        try {
            const response = await fetch(`/api/ssh/credentials?id=${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                setCredentials(prev => prev.filter(c => c.id !== id));
                if (selectedCredential?.id === id) {
                    setSelectedCredential(null);
                }
            }
        } catch (err) {
            console.error('Failed to delete credential:', err);
        }
    };

    const handleSaveCredential = (credential: Credential) => {
        if (editingCredential) {
            setCredentials(prev => prev.map(c => c.id === credential.id ? credential : c));
        } else {
            setCredentials(prev => [...prev, credential]);
        }
        setEditingCredential(null);
    };

    return (
        <div style={{
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #7c5cff, #4d9fff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Remote SSH Console
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#606078', fontSize: '14px' }}>
                        Connect to remote servers via SSH terminal and manage files
                    </p>
                </div>

                {/* Tab Switcher */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '4px',
                }}>
                    <button
                        onClick={() => setActiveTab('terminal')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: activeTab === 'terminal' ? 'linear-gradient(135deg, #7c5cff, #4d9fff)' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#e0e0e0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                        }}
                    >
                        <TerminalIcon />
                        Terminal
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: activeTab === 'files' ? 'linear-gradient(135deg, #7c5cff, #4d9fff)' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#e0e0e0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                        }}
                    >
                        <FolderIcon />
                        File Manager
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
                gap: '20px',
                minHeight: 0,
            }}>
                {/* Credentials Sidebar */}
                <div style={{
                    background: 'rgba(13, 13, 26, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '15px' }}>
                            SSH Credentials
                        </span>
                        <button
                            onClick={() => {
                                setEditingCredential(null);
                                setIsModalOpen(true);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #7c5cff, #4d9fff)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                            }}
                        >
                            <PlusIcon />
                            Add
                        </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                        {isLoadingCredentials ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#606078' }}>
                                Loading...
                            </div>
                        ) : credentials.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#606078' }}>
                                <p>No credentials yet</p>
                                <p style={{ fontSize: '13px' }}>Click "Add" to create one</p>
                            </div>
                        ) : (
                            credentials.map(credential => (
                                <div
                                    key={credential.id}
                                    onClick={() => setSelectedCredential(credential)}
                                    style={{
                                        padding: '12px',
                                        background: selectedCredential?.id === credential.id
                                            ? 'linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.2))'
                                            : 'transparent',
                                        border: selectedCredential?.id === credential.id
                                            ? '1px solid rgba(124, 92, 255, 0.4)'
                                            : '1px solid transparent',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ color: '#e0e0e0', fontWeight: '500', marginBottom: '4px' }}>
                                                {credential.name}
                                            </div>
                                            <div style={{ color: '#606078', fontSize: '12px' }}>
                                                {credential.username}@{credential.host}:{credential.port}
                                            </div>
                                            <div style={{ color: '#7c5cff', fontSize: '11px', marginTop: '4px' }}>
                                                {credential.authType === 'password' ? '🔑 Password' : '🔐 Private Key'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    setEditingCredential(credential);
                                                    setIsModalOpen(true);
                                                }}
                                                style={{
                                                    padding: '6px',
                                                    background: 'rgba(77, 159, 255, 0.2)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: '#4d9fff',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCredential(credential.id)}
                                                style={{
                                                    padding: '6px',
                                                    background: 'rgba(255, 90, 90, 0.2)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: '#ff5a5a',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Panel */}
                <div style={{
                    background: 'rgba(13, 13, 26, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {!selectedCredential ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '16px',
                            color: '#606078',
                        }}>
                            <TerminalIcon />
                            <p>Select a credential from the sidebar to connect</p>
                        </div>
                    ) : activeTab === 'terminal' ? (
                        <Terminal
                            credentialId={selectedCredential.id}
                            onDisconnect={() => { }}
                        />
                    ) : (
                        <FileManager credentialId={selectedCredential.id} />
                    )}
                </div>
            </div>

            {/* Credential Modal */}
            <CredentialModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCredential(null);
                }}
                onSave={handleSaveCredential}
                credential={editingCredential}
                nodes={nodes}
            />
        </div>
    );
}
