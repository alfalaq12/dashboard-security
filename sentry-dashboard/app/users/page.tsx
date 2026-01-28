'use client';

import { useEffect, useState } from 'react';

interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
}

/*
 * Halaman Kelola User
 * CRUD user - hanya bisa diakses oleh admin
 */
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

            // jangan kirim password kosong saat edit
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user: User) {
        if (!confirm(`Yakin hapus user ${user.name}?`)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal menghapus');
            }

            fetchUsers();
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            }
        }
    }

    function getRoleBadge(role: string) {
        const colors: Record<string, string> = {
            admin: 'danger',
            operator: 'warning',
            viewer: 'info',
        };
        return colors[role] || 'info';
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
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Kelola User
                </h2>
                <p>Tambah, edit, dan hapus user dashboard</p>
            </div>

            {/* tombol tambah */}
            <div style={{ marginBottom: 20 }}>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah User
                </button>
            </div>

            {/* tabel user */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        Daftar User
                    </h3>
                    <span className="badge info">{users.length} user</span>
                </div>
                <div className="card-body">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Departemen</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td><code>{user.email}</code></td>
                                    <td>
                                        <span className={`badge ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.department || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-small btn-secondary" onClick={() => openModal(user)}>
                                                Edit
                                            </button>
                                            <button className="btn btn-small btn-danger" onClick={() => handleDelete(user)}>
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* modal form */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editUser ? 'Edit User' : 'Tambah User'}</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert-error" style={{ marginBottom: 16 }}>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Nama</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Password {editUser && <span style={{ color: 'var(--text-muted)' }}>(kosongkan jika tidak diubah)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editUser}
                                        placeholder={editUser ? '••••••••' : ''}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-input"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'operator' | 'viewer' })}
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="operator">Operator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Departemen</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Contoh: IT, Umum, Keuangan"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
