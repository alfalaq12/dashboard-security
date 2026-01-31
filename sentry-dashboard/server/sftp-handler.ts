/**
 * SFTP Handler
 * Handles SFTP operations for file management
 */

import { Client, SFTPWrapper } from 'ssh2';
import { decrypt } from '../lib/crypto';
import { getDatabase, SSHCredential } from '../lib/db';
import { Readable, Writable } from 'stream';

export interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size: number;
    modifiedAt: Date;
    permissions: string;
    owner: number;
    group: number;
}

export interface SFTPResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Create SSH client connected to server
 */
async function createSSHClient(credentialId: number): Promise<{ client: Client; credential: SSHCredential }> {
    const db = await getDatabase();
    const credential = await db.getSSHCredentialById(credentialId);

    if (!credential) {
        throw new Error('Credential not found');
    }

    return new Promise((resolve, reject) => {
        const client = new Client();

        client.on('ready', () => {
            resolve({ client, credential });
        });

        client.on('error', (err) => {
            reject(err);
        });

        const connectConfig: any = {
            host: credential.host,
            port: credential.port,
            username: credential.username,
            readyTimeout: 30000,
        };

        if (credential.authType === 'password' && credential.encryptedPassword) {
            connectConfig.password = decrypt(credential.encryptedPassword);
        } else if (credential.authType === 'privatekey' && credential.encryptedPrivateKey) {
            connectConfig.privateKey = decrypt(credential.encryptedPrivateKey);
            if (credential.encryptedPassphrase) {
                connectConfig.passphrase = decrypt(credential.encryptedPassphrase);
            }
        }

        client.connect(connectConfig);
    });
}

/**
 * Get SFTP wrapper from SSH client
 */
function getSFTP(client: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
        client.sftp((err, sftp) => {
            if (err) reject(err);
            else resolve(sftp);
        });
    });
}

/**
 * Convert file mode to permission string (e.g., "rwxr-xr-x")
 */
function modeToPermissions(mode: number): string {
    const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = (mode >> 6) & 7;
    const group = (mode >> 3) & 7;
    const other = mode & 7;
    return permissions[owner] + permissions[group] + permissions[other];
}

/**
 * List directory contents
 */
export async function listDirectory(credentialId: number, remotePath: string): Promise<SFTPResult<FileInfo[]>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            sftp.readdir(remotePath, (err, list) => {
                client?.end();

                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }

                const files: FileInfo[] = list.map((item) => {
                    let type: 'file' | 'directory' | 'symlink' = 'file';
                    if (item.attrs.isDirectory()) type = 'directory';
                    else if (item.attrs.isSymbolicLink()) type = 'symlink';

                    return {
                        name: item.filename,
                        path: remotePath === '/' ? `/${item.filename}` : `${remotePath}/${item.filename}`,
                        type,
                        size: item.attrs.size,
                        modifiedAt: new Date(item.attrs.mtime * 1000),
                        permissions: modeToPermissions(item.attrs.mode & 0o777),
                        owner: item.attrs.uid,
                        group: item.attrs.gid,
                    };
                });

                // Sort: directories first, then by name
                files.sort((a, b) => {
                    if (a.type === 'directory' && b.type !== 'directory') return -1;
                    if (a.type !== 'directory' && b.type === 'directory') return 1;
                    return a.name.localeCompare(b.name);
                });

                resolve({ success: true, data: files });
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Read file contents
 */
export async function readFile(credentialId: number, remotePath: string): Promise<SFTPResult<Buffer>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            const chunks: Buffer[] = [];
            const readStream = sftp.createReadStream(remotePath);

            readStream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            readStream.on('end', () => {
                client?.end();
                resolve({ success: true, data: Buffer.concat(chunks) });
            });

            readStream.on('error', (err: Error) => {
                client?.end();
                resolve({ success: false, error: err.message });
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Write file
 */
export async function writeFile(credentialId: number, remotePath: string, content: Buffer): Promise<SFTPResult<void>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            const writeStream = sftp.createWriteStream(remotePath);

            writeStream.on('close', () => {
                client?.end();
                resolve({ success: true });
            });

            writeStream.on('error', (err: Error) => {
                client?.end();
                resolve({ success: false, error: err.message });
            });

            writeStream.end(content);
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Create directory
 */
export async function mkdir(credentialId: number, remotePath: string): Promise<SFTPResult<void>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            sftp.mkdir(remotePath, (err) => {
                client?.end();
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({ success: true });
                }
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete file
 */
export async function deleteFile(credentialId: number, remotePath: string): Promise<SFTPResult<void>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            sftp.unlink(remotePath, (err) => {
                client?.end();
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({ success: true });
                }
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete directory
 */
export async function rmdir(credentialId: number, remotePath: string): Promise<SFTPResult<void>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            sftp.rmdir(remotePath, (err) => {
                client?.end();
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({ success: true });
                }
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Rename/move file or directory
 */
export async function rename(credentialId: number, oldPath: string, newPath: string): Promise<SFTPResult<void>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            sftp.rename(oldPath, newPath, (err) => {
                client?.end();
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({ success: true });
                }
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get file/directory stats
 */
export async function stat(credentialId: number, remotePath: string): Promise<SFTPResult<FileInfo>> {
    let client: Client | null = null;

    try {
        const result = await createSSHClient(credentialId);
        client = result.client;
        const sftp = await getSFTP(client);

        return new Promise((resolve) => {
            sftp.stat(remotePath, (err, stats) => {
                client?.end();

                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }

                let type: 'file' | 'directory' | 'symlink' = 'file';
                if (stats.isDirectory()) type = 'directory';
                else if (stats.isSymbolicLink()) type = 'symlink';

                const name = remotePath.split('/').pop() || remotePath;

                resolve({
                    success: true,
                    data: {
                        name,
                        path: remotePath,
                        type,
                        size: stats.size,
                        modifiedAt: new Date(stats.mtime * 1000),
                        permissions: modeToPermissions(stats.mode & 0o777),
                        owner: stats.uid,
                        group: stats.gid,
                    }
                });
            });
        });
    } catch (error) {
        client?.end();
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
