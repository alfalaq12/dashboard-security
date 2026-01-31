'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

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

interface CredentialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (credential: Credential) => void;
    credential?: Credential | null;
    nodes: Node[];
}

// Premium Icon Components
const Icons = {
    server: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    ),
    tag: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
    ),
    globe: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    hash: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="10" y1="3" x2="8" y2="21" />
            <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
    ),
    user: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    key: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
    ),
    lock: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    file: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    shield: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    unlock: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
    ),
    terminal: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c5cff" />
                    <stop offset="100%" stopColor="#4d9fff" />
                </linearGradient>
            </defs>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    ),
    edit: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#editGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
                <linearGradient id="editGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4d9fff" />
                    <stop offset="100%" stopColor="#00d9a5" />
                </linearGradient>
            </defs>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
};

// Icon wrapper with gradient background
function IconWrapper({ children, color = 'purple' }: { children: React.ReactNode; color?: string }) {
    const colors: Record<string, string> = {
        purple: 'linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.15))',
        green: 'linear-gradient(135deg, rgba(0, 217, 165, 0.2), rgba(0, 179, 136, 0.15))',
        blue: 'linear-gradient(135deg, rgba(77, 159, 255, 0.2), rgba(56, 189, 248, 0.15))',
        orange: 'linear-gradient(135deg, rgba(255, 170, 51, 0.2), rgba(255, 136, 0, 0.15))',
    };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: colors[color] || colors.purple,
            borderRadius: '8px',
            marginRight: '10px',
            color: '#a0a0ff',
        }}>
            {children}
        </span>
    );
}

export default function CredentialModal({ isOpen, onClose, onSave, credential, nodes }: CredentialModalProps) {
    const [formData, setFormData] = useState({
        nodeId: '',
        name: '',
        host: '',
        port: 22,
        username: '',
        authType: 'password' as 'password' | 'privatekey',
        password: '',
        privateKey: '',
        passphrase: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (credential) {
            setFormData({
                nodeId: credential.nodeId,
                name: credential.name,
                host: credential.host,
                port: credential.port,
                username: credential.username,
                authType: credential.authType,
                password: '',
                privateKey: '',
                passphrase: '',
            });
        } else {
            setFormData({
                nodeId: nodes[0]?.nodeName || '',
                name: '',
                host: nodes[0]?.hostname || '',
                port: 22,
                username: 'root',
                authType: 'password',
                password: '',
                privateKey: '',
                passphrase: '',
            });
        }
    }, [credential, nodes, isOpen]);

    const handleNodeChange = (nodeId: string) => {
        const node = nodes.find(n => n.nodeName === nodeId);
        setFormData(prev => ({
            ...prev,
            nodeId,
            host: node?.hostname || prev.host,
            name: prev.name || `${nodeId} SSH`,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const url = '/api/ssh/credentials';
            const method = credential ? 'PUT' : 'POST';
            const body = credential ? { id: credential.id, ...formData } : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                onSave(data.credential);
                onClose();

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: credential ? 'Credential Updated!' : 'Credential Added!',
                    text: `${formData.name} saved successfully`,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true,
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: '#fff',
                    iconColor: '#00d9a5',
                    customClass: {
                        popup: 'swal-premium-toast',
                    }
                });
            } else {
                setError(data.error || 'Failed to save credential');
            }
        } catch (err) {
            setError('Failed to save credential');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Styles
    const styles = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
        },
        modal: {
            background: 'linear-gradient(160deg, #1a1a28 0%, #12121a 100%)',
            border: '1px solid rgba(124, 92, 255, 0.15)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 100px rgba(124, 92, 255, 0.08)',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '28px 28px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'linear-gradient(90deg, rgba(124, 92, 255, 0.05), transparent)',
        },
        headerContent: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
        },
        headerIcon: {
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.15))',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124, 92, 255, 0.2)',
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em',
        },
        subtitle: {
            fontSize: '0.85rem',
            color: '#606078',
            margin: '4px 0 0',
        },
        closeBtn: {
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: '#606078',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        body: {
            padding: '28px',
        },
        formGroup: {
            marginBottom: '24px',
        },
        label: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#c0c0d0',
            marginBottom: '10px',
        },
        labelHint: {
            fontWeight: 400,
            color: '#505060',
            marginLeft: '8px',
            fontSize: '0.8rem',
        },
        input: {
            width: '100%',
            padding: '14px 18px',
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box' as const,
            transition: 'all 0.2s',
        },
        select: {
            width: '100%',
            padding: '14px 18px',
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box' as const,
        },
        formRow: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
        },
        authButtons: {
            display: 'flex',
            gap: '12px',
        },
        authBtn: (active: boolean) => ({
            flex: 1,
            padding: '16px 18px',
            background: active
                ? 'linear-gradient(135deg, rgba(124, 92, 255, 0.2), rgba(77, 159, 255, 0.15))'
                : 'rgba(20, 20, 30, 0.8)',
            border: active
                ? '1px solid rgba(124, 92, 255, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: active ? '#fff' : '#707080',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: active ? '0 4px 20px rgba(124, 92, 255, 0.15)' : 'none',
            transition: 'all 0.2s',
        }),
        textarea: {
            width: '100%',
            padding: '14px 18px',
            background: 'rgba(20, 20, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '12px',
            fontFamily: 'monospace',
            minHeight: '120px',
            resize: 'vertical' as const,
            outline: 'none',
            boxSizing: 'border-box' as const,
        },
        error: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            background: 'rgba(255, 90, 90, 0.08)',
            border: '1px solid rgba(255, 90, 90, 0.2)',
            borderRadius: '12px',
            color: '#ff6b6b',
            fontSize: '0.9rem',
            marginBottom: '24px',
        },
        footer: {
            display: 'flex',
            gap: '14px',
            padding: '24px 28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
        },
        cancelBtn: {
            flex: 1,
            padding: '16px 24px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#a0a0b0',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        submitBtn: {
            flex: 1,
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #7c5cff 0%, #5b3fd9 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(124, 92, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
        },
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <div style={styles.headerIcon}>
                            {credential ? Icons.edit : Icons.terminal}
                        </div>
                        <div>
                            <h3 style={styles.title}>
                                {credential ? 'Edit Credential' : 'Add SSH Credential'}
                            </h3>
                            <p style={styles.subtitle}>
                                {credential ? 'Update connection settings' : 'Securely connect to your server'}
                            </p>
                        </div>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={styles.body}>
                        {error && (
                            <div style={styles.error}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Target Node */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                <IconWrapper color="purple">{Icons.server}</IconWrapper>
                                Target Node
                            </label>
                            <select
                                value={formData.nodeId}
                                onChange={(e) => handleNodeChange(e.target.value)}
                                style={styles.select}
                                required
                            >
                                <option value="" style={{ background: '#14141e' }}>Select a node...</option>
                                {nodes.map(node => (
                                    <option key={node.nodeName} value={node.nodeName} style={{ background: '#14141e' }}>
                                        {node.nodeName} ({node.hostname}) - {node.isOnline ? '● Online' : '○ Offline'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Credential Name */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                <IconWrapper color="blue">{Icons.tag}</IconWrapper>
                                Credential Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Production Server SSH"
                                style={styles.input}
                                required
                            />
                        </div>

                        {/* Host & Port */}
                        <div style={{ ...styles.formGroup }}>
                            <div style={styles.formRow}>
                                <div>
                                    <label style={styles.label}>
                                        <IconWrapper color="green">{Icons.globe}</IconWrapper>
                                        Host / IP
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.host}
                                        onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                                        placeholder="192.168.1.100"
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>
                                        <IconWrapper color="orange">{Icons.hash}</IconWrapper>
                                        Port
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.port}
                                        onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                                        style={{ ...styles.input, textAlign: 'center' }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Username */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                <IconWrapper color="purple">{Icons.user}</IconWrapper>
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="root"
                                style={styles.input}
                                required
                            />
                        </div>

                        {/* Auth Type */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                <IconWrapper color="blue">{Icons.shield}</IconWrapper>
                                Authentication Type
                            </label>
                            <div style={styles.authButtons}>
                                <button
                                    type="button"
                                    style={styles.authBtn(formData.authType === 'password')}
                                    onClick={() => setFormData(prev => ({ ...prev, authType: 'password' }))}
                                >
                                    {Icons.key}
                                    Password
                                </button>
                                <button
                                    type="button"
                                    style={styles.authBtn(formData.authType === 'privatekey')}
                                    onClick={() => setFormData(prev => ({ ...prev, authType: 'privatekey' }))}
                                >
                                    {Icons.file}
                                    Private Key
                                </button>
                            </div>
                        </div>

                        {/* Password or Private Key */}
                        {formData.authType === 'password' ? (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    <IconWrapper color="orange">{Icons.lock}</IconWrapper>
                                    Password
                                    {credential && <span style={styles.labelHint}>(leave empty to keep)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="••••••••••••"
                                    style={styles.input}
                                    required={!credential}
                                />
                            </div>
                        ) : (
                            <>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        <IconWrapper color="green">{Icons.file}</IconWrapper>
                                        Private Key
                                        {credential && <span style={styles.labelHint}>(leave empty to keep)</span>}
                                    </label>

                                    {/* File Upload Area */}
                                    <div
                                        style={{
                                            border: '2px dashed rgba(124, 92, 255, 0.3)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            textAlign: 'center',
                                            marginBottom: '12px',
                                            background: 'rgba(124, 92, 255, 0.05)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onClick={() => document.getElementById('privateKeyFile')?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'rgba(124, 92, 255, 0.6)';
                                            e.currentTarget.style.background = 'rgba(124, 92, 255, 0.1)';
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(124, 92, 255, 0.3)';
                                            e.currentTarget.style.background = 'rgba(124, 92, 255, 0.05)';
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'rgba(124, 92, 255, 0.3)';
                                            e.currentTarget.style.background = 'rgba(124, 92, 255, 0.05)';
                                            const file = e.dataTransfer.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const content = event.target?.result as string;
                                                    setFormData(prev => ({ ...prev, privateKey: content }));
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                    >
                                        <input
                                            type="file"
                                            id="privateKeyFile"
                                            accept=".pem,.ppk,.key,.pub"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const content = event.target?.result as string;
                                                        setFormData(prev => ({ ...prev, privateKey: content }));
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                        />
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c5cff" strokeWidth="1.5" style={{ marginBottom: '10px' }}>
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <div style={{ color: '#a0a0ff', fontSize: '0.95rem', fontWeight: 500, marginBottom: '4px' }}>
                                            Click to upload or drag & drop
                                        </div>
                                        <div style={{ color: '#606078', fontSize: '0.8rem' }}>
                                            Supports .pem, .ppk, .key files
                                        </div>
                                    </div>

                                    {/* Or divider */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                        <span style={{ color: '#505060', fontSize: '0.8rem' }}>or paste manually</span>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                    </div>

                                    {/* Textarea for manual input */}
                                    <textarea
                                        value={formData.privateKey}
                                        onChange={(e) => setFormData(prev => ({ ...prev, privateKey: e.target.value }))}
                                        placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                                        style={styles.textarea}
                                        required={!credential}
                                    />

                                    {/* Show file loaded indicator */}
                                    {formData.privateKey && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginTop: '10px',
                                            padding: '10px 14px',
                                            background: 'rgba(0, 217, 165, 0.1)',
                                            border: '1px solid rgba(0, 217, 165, 0.2)',
                                            borderRadius: '8px',
                                            color: '#00d9a5',
                                            fontSize: '0.85rem',
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Private key loaded ({formData.privateKey.length} characters)
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, privateKey: '' }))}
                                                style={{
                                                    marginLeft: 'auto',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ff6b6b',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        <IconWrapper color="purple">{Icons.unlock}</IconWrapper>
                                        Passphrase
                                        <span style={styles.labelHint}>(optional)</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.passphrase}
                                        onChange={(e) => setFormData(prev => ({ ...prev, passphrase: e.target.value }))}
                                        placeholder="Leave blank if no passphrase"
                                        style={styles.input}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <button type="button" style={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.submitBtn, opacity: isLoading ? 0.7 : 1 }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                        <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {credential ? 'Update Credential' : 'Add Credential'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
