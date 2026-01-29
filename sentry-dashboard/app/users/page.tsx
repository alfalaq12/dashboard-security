'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
}

export default function HalamanUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'viewer' as 'admin' | 'operator' | 'viewer',
        department: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Gagal fetch users:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(user?: User) {
        if (user) {
            setEditUser(user);
            setFormData({
                email: user.email,
                password: '',
                name: user.name,
                role: user.role,
                department: user.department,
            });
        } else {
            setEditUser(null);
            setFormData({
                email: '',
                password: '',
                name: '',
                role: 'viewer',
                department: '',
            });
        }
        setError('');
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditUser(null);
        setError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const url = editUser ? `/api/users/${editUser.id}` : '/api/users';
            const method = editUser ? 'PUT' : 'POST';

            const body = { ...formData };
            if (editUser && !body.password) {
                delete (body as Partial<typeof formData>).password;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal menyimpan');
            }

            fetchUsers();
            closeModal();

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: editUser ? 'User Diperbarui!' : 'User Ditambahkan!',
                text: editUser ? `${formData.name} berhasil diupdate` : `${formData.name} berhasil ditambahkan`,
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user: User) {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Konfirmasi Hapus',
            html: `
                <div style="text-align: center;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: rgba(255, 107, 107, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </div>
                    <p style="font-size: 1rem; margin-bottom: 8px; color: rgba(255,255,255,0.8);">
                        Hapus user ini?
                    </p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #ff6b6b; margin-bottom: 8px;">
                        ${user.name}
                    </p>
                    <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">
                        ${user.email}
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '🗑️ Ya, Hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: 'swal-premium-popup',
                confirmButton: 'swal-danger-btn',
            }
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal menghapus');
            }

            fetchUsers();

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'User Dihapus!',
                text: `${user.name} berhasil dihapus dari sistem`,
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus',
                    text: err.message,
                    customClass: {
                        popup: 'swal-premium-popup',
                    }
                });
            }
        }
    }

    function getRoleBadgeClass(role: string) {
        switch (role) {
            case 'admin': return 'role-admin';
            case 'operator': return 'role-operator';
            default: return 'role-viewer';
        }
    }

    function getRoleIcon(role: string) {
        switch (role) {
            case 'admin':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                );
            case 'operator':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                );
            default:
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                );
        }
    }

    // Stats
    const adminCount = users.filter(u => u.role === 'admin').length;
    const operatorCount = users.filter(u => u.role === 'operator').length;
    const viewerCount = users.filter(u => u.role === 'viewer').length;

    if (loading) {
        return (
            <div className="premium-loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Loading Users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="premium-dashboard">
            {/* Page Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        User Management
                    </h1>
                    <p className="header-subtitle">Manage dashboard users and permissions</p>
                </div>
                <div className="header-right">
                    <button className="btn-add-user" onClick={() => openModal()}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="premium-stats-grid users-stats">
                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper purple">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{users.length}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>

                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper red">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{adminCount}</span>
                        <span className="stat-label">Admins</span>
                    </div>
                </div>

                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper orange">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{operatorCount}</span>
                        <span className="stat-label">Operators</span>
                    </div>
                </div>

                <div className="stat-card-premium">
                    <div className="stat-icon-wrapper blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{viewerCount}</span>
                        <span className="stat-label">Viewers</span>
                    </div>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="premium-card">
                <div className="card-header">
                    <div className="header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <h3>All Users</h3>
                    </div>
                    <span className="count-badge">{users.length} users</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {users.length > 0 ? (
                        <div className="users-table-wrapper">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Department</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="user-name">{user.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <code className="user-email">{user.email}</code>
                                            </td>
                                            <td>
                                                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="dept-text">{user.department || '-'}</span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-action edit" onClick={() => openModal(user)}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button className="btn-action delete" onClick={() => handleDelete(user)}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state-premium" style={{ padding: '60px 20px' }}>
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                            <h4>No Users Found</h4>
                            <p>Click "Add User" to create the first user</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-premium" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editUser ? 'Edit User' : 'Add New User'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="form-error">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Password
                                        {editUser && <span className="label-hint">(leave empty to keep current)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editUser ? '••••••••' : 'Enter password'}
                                        required={!editUser}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'operator' | 'viewer' })}
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="operator">Operator</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="IT, Finance, etc."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={saving}>
                                    {saving ? 'Saving...' : (editUser ? 'Update User' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .users-stats {
                    grid-template-columns: repeat(4, 1fr);
                }
                
                .btn-add-user {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #7c5cff 0%, #6b4fd6 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px rgba(124, 92, 255, 0.3);
                }
                
                .btn-add-user:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(124, 92, 255, 0.4);
                }
                
                .users-table-wrapper {
                    overflow-x: auto;
                }
                
                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .users-table th {
                    text-align: left;
                    padding: 16px 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-muted);
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                
                .users-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }
                
                .users-table tr:hover td {
                    background: rgba(255, 255, 255, 0.02);
                }
                
                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #7c5cff 0%, #4d9fff 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1rem;
                    color: white;
                }
                
                .user-name {
                    font-weight: 600;
                    color: var(--text-white);
                }
                
                .user-email {
                    font-size: 0.85rem;
                    color: var(--text-gray);
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .role-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                
                .role-badge.role-admin {
                    background: rgba(255, 107, 107, 0.15);
                    color: #ff6b6b;
                }
                
                .role-badge.role-operator {
                    background: rgba(255, 170, 51, 0.15);
                    color: #ffaa33;
                }
                
                .role-badge.role-viewer {
                    background: rgba(77, 159, 255, 0.15);
                    color: #4d9fff;
                }
                
                .dept-text {
                    color: var(--text-gray);
                    font-size: 0.9rem;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-action {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: var(--text-gray);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-action:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .btn-action.edit:hover {
                    color: #4d9fff;
                    border-color: rgba(77, 159, 255, 0.3);
                }
                
                .btn-action.delete:hover {
                    color: #ff6b6b;
                    border-color: rgba(255, 107, 107, 0.3);
                }
                
                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                
                .modal-premium {
                    background: linear-gradient(135deg, #16161e 0%, #1a1a24 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    width: 100%;
                    max-width: 500px;
                    overflow: hidden;
                    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                
                .modal-header h3 {
                    font-size: 1.2rem;
                    font-weight: 600;
                }
                
                .modal-close {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    border-radius: 8px;
                    color: var(--text-gray);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .modal-close:hover {
                    background: rgba(255, 107, 107, 0.15);
                    color: #ff6b6b;
                }
                
                .modal-body {
                    padding: 24px;
                }
                
                .form-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: rgba(255, 107, 107, 0.1);
                    border: 1px solid rgba(255, 107, 107, 0.2);
                    border-radius: 10px;
                    color: #ff6b6b;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-gray);
                    margin-bottom: 8px;
                }
                
                .label-hint {
                    font-weight: 400;
                    color: var(--text-muted);
                    margin-left: 8px;
                }
                
                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 14px 16px;
                    background: #1a1a28;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: var(--text-white);
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }
                
                .form-group select option {
                    background: #1a1a28;
                    color: var(--text-white);
                    padding: 12px;
                }
                
                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #7c5cff;
                    background: #1e1e2e;
                }
                
                .form-group input::placeholder {
                    color: var(--text-muted);
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(0, 0, 0, 0.2);
                }
                
                .btn-cancel {
                    padding: 12px 24px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: var(--text-gray);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-white);
                }
                
                .btn-submit {
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #7c5cff 0%, #6b4fd6 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-submit:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(124, 92, 255, 0.4);
                }
                
                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                @media (max-width: 1024px) {
                    .users-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 768px) {
                    .users-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .users-table th:nth-child(4),
                    .users-table td:nth-child(4) {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
