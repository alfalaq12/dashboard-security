/**
 * SFTP API
 * File management operations over SFTP
 */

// Force Node.js runtime for ssh2 compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Client, SFTPWrapper } from 'ssh2';
import { getDatabase } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size: number;
    modifiedAt: Date;
    permissions: string;
}

// Helper: Create SSH connection
async function createConnection(credentialId: number): Promise<{ client: Client; sftp: SFTPWrapper }> {
    const db = await getDatabase();
    const credential = await db.getSSHCredentialById(credentialId);

    if (!credential) {
        throw new Error('Credential not found');
    }

    return new Promise((resolve, reject) => {
        const client = new Client();

        client.on('ready', () => {
            client.sftp((err, sftp) => {
                if (err) {
                    client.end();
                    reject(err);
                } else {
                    resolve({ client, sftp });
                }
            });
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

// Helper: Convert mode to permission string
function modeToPermissions(mode: number): string {
    const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = (mode >> 6) & 7;
    const group = (mode >> 3) & 7;
    const other = mode & 7;
    return permissions[owner] + permissions[group] + permissions[other];
}

// GET - List directory or download file
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');
    const path = searchParams.get('path') || '/';
    const action = searchParams.get('action') || 'list';

    if (!credentialId) {
        return NextResponse.json(
            { success: false, error: 'Missing credentialId' },
            { status: 400 }
        );
    }

    let client: Client | null = null;

    try {
        const conn = await createConnection(parseInt(credentialId));
        client = conn.client;
        const sftp = conn.sftp;

        if (action === 'list') {
            // List directory
            return new Promise<NextResponse>((resolve) => {
                sftp.readdir(path, (err, list) => {
                    client?.end();

                    if (err) {
                        resolve(NextResponse.json(
                            { success: false, error: err.message },
                            { status: 500 }
                        ));
                        return;
                    }

                    const files: FileInfo[] = list.map((item) => {
                        let type: 'file' | 'directory' | 'symlink' = 'file';
                        if (item.attrs.isDirectory()) type = 'directory';
                        else if (item.attrs.isSymbolicLink()) type = 'symlink';

                        return {
                            name: item.filename,
                            path: path === '/' ? `/${item.filename}` : `${path}/${item.filename}`,
                            type,
                            size: item.attrs.size,
                            modifiedAt: new Date(item.attrs.mtime * 1000),
                            permissions: modeToPermissions(item.attrs.mode & 0o777),
                        };
                    });

                    // Sort: directories first, then by name
                    files.sort((a, b) => {
                        if (a.type === 'directory' && b.type !== 'directory') return -1;
                        if (a.type !== 'directory' && b.type === 'directory') return 1;
                        return a.name.localeCompare(b.name);
                    });

                    resolve(NextResponse.json({ success: true, files, currentPath: path }));
                });
            });
        } else if (action === 'download') {
            // Download file
            return new Promise<NextResponse>((resolve) => {
                const chunks: Buffer[] = [];
                const readStream = sftp.createReadStream(path);

                readStream.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });

                readStream.on('end', () => {
                    client?.end();
                    const content = Buffer.concat(chunks);
                    const fileName = path.split('/').pop() || 'download';

                    resolve(new NextResponse(content, {
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': `attachment; filename="${fileName}"`,
                            'Content-Length': content.length.toString(),
                        },
                    }));
                });

                readStream.on('error', (err: Error) => {
                    client?.end();
                    resolve(NextResponse.json(
                        { success: false, error: err.message },
                        { status: 500 }
                    ));
                });
            });
        } else if (action === 'read') {
            // Read file content as text
            return new Promise<NextResponse>((resolve) => {
                const chunks: Buffer[] = [];
                const readStream = sftp.createReadStream(path);

                readStream.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });

                readStream.on('end', () => {
                    client?.end();
                    const content = Buffer.concat(chunks).toString('utf8');
                    resolve(NextResponse.json({ success: true, content }));
                });

                readStream.on('error', (err: Error) => {
                    client?.end();
                    resolve(NextResponse.json(
                        { success: false, error: err.message },
                        { status: 500 }
                    ));
                });
            });
        }

        client.end();
        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        client?.end();
        console.error('SFTP GET error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Connection failed' },
            { status: 500 }
        );
    }
}

// POST - Upload file or create directory
export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');
    const path = searchParams.get('path');
    const action = searchParams.get('action') || 'upload';

    if (!credentialId || !path) {
        return NextResponse.json(
            { success: false, error: 'Missing credentialId or path' },
            { status: 400 }
        );
    }

    let client: Client | null = null;

    try {
        const conn = await createConnection(parseInt(credentialId));
        client = conn.client;
        const sftp = conn.sftp;

        if (action === 'mkdir') {
            // Create directory
            return new Promise<NextResponse>((resolve) => {
                sftp.mkdir(path, (err) => {
                    client?.end();
                    if (err) {
                        resolve(NextResponse.json(
                            { success: false, error: err.message },
                            { status: 500 }
                        ));
                    } else {
                        resolve(NextResponse.json({ success: true }));
                    }
                });
            });
        } else if (action === 'upload') {
            // Upload file
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                client.end();
                return NextResponse.json(
                    { success: false, error: 'No file provided' },
                    { status: 400 }
                );
            }

            const buffer = Buffer.from(await file.arrayBuffer());

            return new Promise<NextResponse>((resolve) => {
                const writeStream = sftp.createWriteStream(path);

                writeStream.on('close', () => {
                    client?.end();
                    resolve(NextResponse.json({ success: true }));
                });

                writeStream.on('error', (err: Error) => {
                    client?.end();
                    resolve(NextResponse.json(
                        { success: false, error: err.message },
                        { status: 500 }
                    ));
                });

                writeStream.end(buffer);
            });
        } else if (action === 'write') {
            // Write text content
            const body = await request.json();
            const content = body.content;

            if (content === undefined) {
                client.end();
                return NextResponse.json(
                    { success: false, error: 'No content provided' },
                    { status: 400 }
                );
            }

            return new Promise<NextResponse>((resolve) => {
                const writeStream = sftp.createWriteStream(path);

                writeStream.on('close', () => {
                    client?.end();
                    resolve(NextResponse.json({ success: true }));
                });

                writeStream.on('error', (err: Error) => {
                    client?.end();
                    resolve(NextResponse.json(
                        { success: false, error: err.message },
                        { status: 500 }
                    ));
                });

                writeStream.end(Buffer.from(content, 'utf8'));
            });
        }

        client.end();
        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        client?.end();
        console.error('SFTP POST error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
            { status: 500 }
        );
    }
}

// DELETE - Delete file or directory
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');
    const path = searchParams.get('path');
    const type = searchParams.get('type') || 'file'; // 'file' or 'directory'

    if (!credentialId || !path) {
        return NextResponse.json(
            { success: false, error: 'Missing credentialId or path' },
            { status: 400 }
        );
    }

    let client: Client | null = null;

    try {
        const conn = await createConnection(parseInt(credentialId));
        client = conn.client;
        const sftp = conn.sftp;

        return new Promise<NextResponse>((resolve) => {
            const callback = (err: Error | null | undefined) => {
                client?.end();
                if (err) {
                    resolve(NextResponse.json(
                        { success: false, error: err.message },
                        { status: 500 }
                    ));
                } else {
                    resolve(NextResponse.json({ success: true }));
                }
            };

            if (type === 'directory') {
                sftp.rmdir(path, callback);
            } else {
                sftp.unlink(path, callback);
            }
        });
    } catch (error) {
        client?.end();
        console.error('SFTP DELETE error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
            { status: 500 }
        );
    }
}
