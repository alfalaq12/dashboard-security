'use client';

import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';

interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size: number;
    modifiedAt: string;
    permissions: string;
}

interface FileManagerProps {
    credentialId: number | null;
}

// Icons
const FolderIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd93d" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const FileIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4d9fff" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const UploadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const NewFolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const DeleteIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export default function FileManager({ credentialId }: FileManagerProps) {
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const loadDirectory = useCallback(async (path: string) => {
        if (!credentialId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ssh/sftp?credentialId=${credentialId}&path=${encodeURIComponent(path)}&action=list`);
            const data = await response.json();

            if (data.success) {
                setFiles(data.files);
                setCurrentPath(data.currentPath);
            } else {
                setError(data.error || 'Failed to load directory');
            }
        } catch (err) {
            setError('Failed to connect');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [credentialId]);

    useEffect(() => {
        if (credentialId) {
            loadDirectory('/');
        }
    }, [credentialId, loadDirectory]);

    const navigateUp = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = '/' + parts.join('/');
        loadDirectory(newPath || '/');
    };

    const handleFileClick = (file: FileInfo) => {
        if (file.type === 'directory') {
            loadDirectory(file.path);
        } else {
            setSelectedFile(file);
        }
    };

    const handleDownload = async (file: FileInfo) => {
        if (!credentialId) return;

        try {
            const response = await fetch(`/api/ssh/sftp?credentialId=${credentialId}&path=${encodeURIComponent(file.path)}&action=download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download error:', err);
        }
    };

    const handleDelete = async (file: FileInfo) => {
        if (!credentialId) return;

        const result = await Swal.fire({
            title: 'Delete File?',
            html: `<p style="color: rgba(255,255,255,0.7)">Are you sure you want to delete <b>${file.name}</b>?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ff4757',
            cancelButtonColor: '#3a3a4a',
            background: '#1a1a28',
            color: '#e4e4e7',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                `/api/ssh/sftp?credentialId=${credentialId}&path=${encodeURIComponent(file.path)}&type=${file.type}`,
                { method: 'DELETE' }
            );
            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: `${file.name} has been deleted.`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a28',
                    color: '#e4e4e7',
                });
                loadDirectory(currentPath);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'Delete failed',
                    background: '#1a1a28',
                    color: '#e4e4e7',
                });
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!credentialId || !e.target.files?.length) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const uploadPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;

        try {
            const response = await fetch(
                `/api/ssh/sftp?credentialId=${credentialId}&path=${encodeURIComponent(uploadPath)}&action=upload`,
                { method: 'POST', body: formData }
            );
            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Uploaded!',
                    text: `${file.name} uploaded successfully.`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a28',
                    color: '#e4e4e7',
                });
                loadDirectory(currentPath);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: data.error || 'Upload failed',
                    background: '#1a1a28',
                    color: '#e4e4e7',
                });
            }
        } catch (err) {
            console.error('Upload error:', err);
        }

        e.target.value = '';
    };

    const handleNewFolder = async () => {
        if (!credentialId) return;

        const { value: folderName } = await Swal.fire({
            title: 'Create New Folder',
            input: 'text',
            inputLabel: 'Folder Name',
            inputPlaceholder: 'Enter folder name...',
            showCancelButton: true,
            confirmButtonText: 'Create',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#7c5cff',
            cancelButtonColor: '#3a3a4a',
            background: '#1a1a28',
            color: '#e4e4e7',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter a folder name';
                }
                return null;
            },
        });

        if (!folderName) return;

        const folderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;

        try {
            const response = await fetch(
                `/api/ssh/sftp?credentialId=${credentialId}&path=${encodeURIComponent(folderPath)}&action=mkdir`,
                { method: 'POST' }
            );
            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: `Folder "${folderName}" created.`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a28',
                    color: '#e4e4e7',
                });
                loadDirectory(currentPath);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'Failed to create folder',
                    background: '#1a1a28',
                    color: '#e4e4e7',
                });
            }
        } catch (err) {
            console.error('Mkdir error:', err);
        }
    };

    const pathParts = currentPath.split('/').filter(Boolean);

    return (
        <div className="file-manager" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(13, 13, 26, 0.8)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
        }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
                <button
                    onClick={() => loadDirectory(currentPath)}
                    disabled={isLoading || !credentialId}
                    style={{
                        padding: '6px 10px',
                        background: 'rgba(124, 92, 255, 0.2)',
                        border: '1px solid rgba(124, 92, 255, 0.3)',
                        borderRadius: '6px',
                        color: '#7c5cff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <RefreshIcon />
                </button>
                <label style={{
                    padding: '6px 10px',
                    background: 'rgba(61, 214, 140, 0.2)',
                    border: '1px solid rgba(61, 214, 140, 0.3)',
                    borderRadius: '6px',
                    color: '#3dd68c',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    <UploadIcon />
                    <input
                        type="file"
                        onChange={handleUpload}
                        disabled={!credentialId}
                        style={{ display: 'none' }}
                    />
                </label>
                <button
                    onClick={handleNewFolder}
                    disabled={!credentialId}
                    style={{
                        padding: '6px 10px',
                        background: 'rgba(255, 217, 61, 0.2)',
                        border: '1px solid rgba(255, 217, 61, 0.3)',
                        borderRadius: '6px',
                        color: '#ffd93d',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <NewFolderIcon />
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.2)',
                fontSize: '13px',
                overflow: 'auto',
            }}>
                <span
                    onClick={() => loadDirectory('/')}
                    style={{ color: '#7c5cff', cursor: 'pointer' }}
                >
                    /
                </span>
                {pathParts.map((part, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#606078', margin: '0 4px' }}>/</span>
                        <span
                            onClick={() => loadDirectory('/' + pathParts.slice(0, i + 1).join('/'))}
                            style={{
                                color: i === pathParts.length - 1 ? '#e0e0e0' : '#7c5cff',
                                cursor: 'pointer',
                            }}
                        >
                            {part}
                        </span>
                    </span>
                ))}
            </div>

            {/* File list */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#606078' }}>
                        Loading...
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ff5a5a' }}>
                        {error}
                    </div>
                ) : !credentialId ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#606078' }}>
                        Select a credential to browse files
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: '#606078', fontSize: '12px', textTransform: 'uppercase' }}>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                                <th style={{ textAlign: 'right', padding: '8px', width: '80px' }}>Size</th>
                                <th style={{ textAlign: 'left', padding: '8px', width: '100px' }}>Permissions</th>
                                <th style={{ textAlign: 'right', padding: '8px', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPath !== '/' && (
                                <tr
                                    onClick={navigateUp}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124, 92, 255, 0.1)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FolderIcon />
                                        <span style={{ color: '#e0e0e0' }}>..</span>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            )}
                            {files.map((file) => (
                                <tr
                                    key={file.path}
                                    onClick={() => handleFileClick(file)}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124, 92, 255, 0.1)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {file.type === 'directory' ? <FolderIcon /> : <FileIcon />}
                                        <span style={{ color: '#e0e0e0' }}>{file.name}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '10px 8px', color: '#606078', fontSize: '13px' }}>
                                        {file.type === 'file' ? formatSize(file.size) : '-'}
                                    </td>
                                    <td style={{ padding: '10px 8px', color: '#606078', fontSize: '13px', fontFamily: 'monospace' }}>
                                        {file.permissions}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '10px 8px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                                            {file.type === 'file' && (
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    style={{
                                                        padding: '4px',
                                                        background: 'rgba(77, 159, 255, 0.2)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        color: '#4d9fff',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <DownloadIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(file)}
                                                style={{
                                                    padding: '4px',
                                                    background: 'rgba(255, 90, 90, 0.2)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: '#ff5a5a',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
