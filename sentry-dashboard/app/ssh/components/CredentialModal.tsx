'use client';

import { useState, useEffect } from 'react';

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

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: '#e0e0e0',
        fontSize: '14px',
        outline: 'none',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        color: '#a0a0a0',
        fontSize: '13px',
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <h2 style={{ margin: 0, color: '#e0e0e0', fontSize: '18px', fontWeight: '600' }}>
                        {credential ? 'Edit Credential' : 'Add SSH Credential'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#606078',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '4px',
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 90, 90, 0.1)',
                            border: '1px solid rgba(255, 90, 90, 0.3)',
                            borderRadius: '8px',
                            color: '#ff5a5a',
                            marginBottom: '16px',
                            fontSize: '14px',
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Target Node</label>
                        <select
                            value={formData.nodeId}
                            onChange={(e) => handleNodeChange(e.target.value)}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                            required
                        >
                            <option value="">Select a node</option>
                            {nodes.map(node => (
                                <option key={node.nodeName} value={node.nodeName}>
                                    {node.nodeName} ({node.hostname}) - {node.isOnline ? '🟢 Online' : '🔴 Offline'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Credential Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Production Server SSH"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={labelStyle}>Host / IP</label>
                            <input
                                type="text"
                                value={formData.host}
                                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                                placeholder="192.168.1.100"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Port</label>
                            <input
                                type="number"
                                value={formData.port}
                                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                                style={inputStyle}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="root"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Authentication Type</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <label style={{
                                flex: 1,
                                padding: '12px',
                                background: formData.authType === 'password' ? 'rgba(124, 92, 255, 0.2)' : 'rgba(0,0,0,0.2)',
                                border: formData.authType === 'password' ? '1px solid #7c5cff' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                color: '#e0e0e0',
                            }}>
                                <input
                                    type="radio"
                                    name="authType"
                                    value="password"
                                    checked={formData.authType === 'password'}
                                    onChange={() => setFormData(prev => ({ ...prev, authType: 'password' }))}
                                    style={{ display: 'none' }}
                                />
                                🔑 Password
                            </label>
                            <label style={{
                                flex: 1,
                                padding: '12px',
                                background: formData.authType === 'privatekey' ? 'rgba(124, 92, 255, 0.2)' : 'rgba(0,0,0,0.2)',
                                border: formData.authType === 'privatekey' ? '1px solid #7c5cff' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                color: '#e0e0e0',
                            }}>
                                <input
                                    type="radio"
                                    name="authType"
                                    value="privatekey"
                                    checked={formData.authType === 'privatekey'}
                                    onChange={() => setFormData(prev => ({ ...prev, authType: 'privatekey' }))}
                                    style={{ display: 'none' }}
                                />
                                🔐 Private Key
                            </label>
                        </div>
                    </div>

                    {formData.authType === 'password' ? (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Password {credential && '(leave blank to keep existing)'}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="••••••••"
                                style={inputStyle}
                                required={!credential}
                            />
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Private Key {credential && '(leave blank to keep existing)'}</label>
                                <textarea
                                    value={formData.privateKey}
                                    onChange={(e) => setFormData(prev => ({ ...prev, privateKey: e.target.value }))}
                                    placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                                    style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                                    required={!credential}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Passphrase (optional)</label>
                                <input
                                    type="password"
                                    value={formData.passphrase}
                                    onChange={(e) => setFormData(prev => ({ ...prev, passphrase: e.target.value }))}
                                    placeholder="Leave blank if no passphrase"
                                    style={inputStyle}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: '#e0e0e0',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: 'linear-gradient(135deg, #7c5cff, #4d9fff)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                opacity: isLoading ? 0.7 : 1,
                            }}
                        >
                            {isLoading ? 'Saving...' : credential ? 'Update' : 'Add Credential'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
