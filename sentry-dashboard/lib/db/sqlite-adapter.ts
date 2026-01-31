/*
 * SQLite Adapter
 * Adapter untuk database SQLite (file-based)
 * Cocok untuk single-server deployment
 */

import { DatabaseAdapter, User, UserCreate, UserUpdate, SSHCredential, SSHCredentialCreate, SSHCredentialUpdate } from './types';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { encrypt } from '../crypto';

export class SQLiteAdapter implements DatabaseAdapter {
    private db: Database.Database | null = null;
    private filename: string;

    constructor(filename: string = 'sentry.db') {
        this.filename = filename;
    }

    async connect(): Promise<void> {
        this.db = new Database(this.filename);

        // buat tabel users jika belum ada
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        department TEXT NOT NULL DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // buat tabel ssh_credentials jika belum ada
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS ssh_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT NOT NULL,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL DEFAULT 22,
        username TEXT NOT NULL,
        auth_type TEXT NOT NULL DEFAULT 'password',
        encrypted_password TEXT,
        encrypted_private_key TEXT,
        encrypted_passphrase TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // cek apakah ada user, jika tidak, buat admin default
        const result = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        if (result.count === 0) {
            const hashedPassword = await this.hashPassword('admin123');
            this.db.prepare(`
        INSERT INTO users (email, password, name, role, department)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin@bapenda.go.id', '$2b$10$97/qtlZ7SFTjgXj6LN71fOWlcNrmFJf1onWRuasg3ehiLIsiO0BLO', 'Administrator', 'admin', 'IT');
        }

        console.log('📦 SQLite database connected:', this.filename);
    }

    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        console.log('📦 SQLite database disconnected');
    }

    async findUserByEmail(email: string): Promise<User | null> {
        if (!this.db) return null;
        const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
        return row || null;
    }

    async findUserById(id: number): Promise<User | null> {
        if (!this.db) return null;
        const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
        return row || null;
    }

    async getAllUsers(): Promise<User[]> {
        if (!this.db) return [];
        const rows = this.db.prepare('SELECT id, email, name, role, department, created_at, updated_at FROM users').all() as User[];
        return rows;
    }

    async createUser(data: UserCreate): Promise<User> {
        if (!this.db) throw new Error('Database not connected');

        const hashedPassword = await this.hashPassword(data.password);
        const result = this.db.prepare(`
      INSERT INTO users (email, password, name, role, department)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.email, hashedPassword, data.name, data.role, data.department);

        return {
            id: result.lastInsertRowid as number,
            ...data,
            password: '***',
        };
    }

    async updateUser(id: number, data: UserUpdate): Promise<User | null> {
        if (!this.db) return null;

        const updates: string[] = [];
        const values: (string | undefined)[] = [];

        if (data.email) { updates.push('email = ?'); values.push(data.email); }
        if (data.name) { updates.push('name = ?'); values.push(data.name); }
        if (data.role) { updates.push('role = ?'); values.push(data.role); }
        if (data.department) { updates.push('department = ?'); values.push(data.department); }
        if (data.password) {
            const hashedPassword = await this.hashPassword(data.password);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length === 0) return null;

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id.toString());

        this.db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        return this.findUserById(id);
    }

    async deleteUser(id: number): Promise<boolean> {
        if (!this.db) return false;
        const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return result.changes > 0;
    }

    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    // SSH Credential Methods
    private mapRowToSSHCredential(row: any): SSHCredential {
        return {
            id: row.id,
            nodeId: row.node_id,
            name: row.name,
            host: row.host,
            port: row.port,
            username: row.username,
            authType: row.auth_type as 'password' | 'privatekey',
            encryptedPassword: row.encrypted_password,
            encryptedPrivateKey: row.encrypted_private_key,
            encryptedPassphrase: row.encrypted_passphrase,
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        };
    }

    async createSSHCredential(data: SSHCredentialCreate): Promise<SSHCredential> {
        if (!this.db) throw new Error('Database not connected');

        const result = this.db.prepare(`
            INSERT INTO ssh_credentials (node_id, name, host, port, username, auth_type, encrypted_password, encrypted_private_key, encrypted_passphrase)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.nodeId,
            data.name,
            data.host,
            data.port || 22,
            data.username,
            data.authType,
            data.password ? encrypt(data.password) : null,
            data.privateKey ? encrypt(data.privateKey) : null,
            data.passphrase ? encrypt(data.passphrase) : null
        );

        const credential = await this.getSSHCredentialById(result.lastInsertRowid as number);
        if (!credential) throw new Error('Failed to create SSH credential');
        return credential;
    }

    async getSSHCredentialById(id: number): Promise<SSHCredential | null> {
        if (!this.db) return null;
        const row = this.db.prepare('SELECT * FROM ssh_credentials WHERE id = ?').get(id);
        return row ? this.mapRowToSSHCredential(row) : null;
    }

    async getSSHCredentialsByNode(nodeId: string): Promise<SSHCredential[]> {
        if (!this.db) return [];
        const rows = this.db.prepare('SELECT * FROM ssh_credentials WHERE node_id = ?').all(nodeId);
        return rows.map(row => this.mapRowToSSHCredential(row));
    }

    async getAllSSHCredentials(): Promise<SSHCredential[]> {
        if (!this.db) return [];
        const rows = this.db.prepare('SELECT id, node_id, name, host, port, username, auth_type, created_at, updated_at FROM ssh_credentials').all();
        return rows.map(row => ({
            ...this.mapRowToSSHCredential(row),
            encryptedPassword: undefined,
            encryptedPrivateKey: undefined,
            encryptedPassphrase: undefined,
        }));
    }

    async updateSSHCredential(id: number, data: SSHCredentialUpdate): Promise<SSHCredential | null> {
        if (!this.db) return null;

        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (data.name) { updates.push('name = ?'); values.push(data.name); }
        if (data.host) { updates.push('host = ?'); values.push(data.host); }
        if (data.port) { updates.push('port = ?'); values.push(data.port); }
        if (data.username) { updates.push('username = ?'); values.push(data.username); }
        if (data.authType) { updates.push('auth_type = ?'); values.push(data.authType); }
        if (data.password) { updates.push('encrypted_password = ?'); values.push(encrypt(data.password)); }
        if (data.privateKey) { updates.push('encrypted_private_key = ?'); values.push(encrypt(data.privateKey)); }
        if (data.passphrase) { updates.push('encrypted_passphrase = ?'); values.push(encrypt(data.passphrase)); }

        if (updates.length === 0) return null;

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        this.db.prepare(`UPDATE ssh_credentials SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        return this.getSSHCredentialById(id);
    }

    async deleteSSHCredential(id: number): Promise<boolean> {
        if (!this.db) return false;
        const result = this.db.prepare('DELETE FROM ssh_credentials WHERE id = ?').run(id);
        return result.changes > 0;
    }
}

