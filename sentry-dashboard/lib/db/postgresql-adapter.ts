/*
 * PostgreSQL Adapter
 * Adapter untuk database PostgreSQL
 */

import { DatabaseAdapter, User, UserCreate, UserUpdate, SSHCredential, SSHCredentialCreate, SSHCredentialUpdate } from './types';
import bcrypt from 'bcryptjs';
import { Pool, PoolConfig } from 'pg';
import { encrypt } from '../crypto';

export class PostgreSQLAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;
    private config: PoolConfig;

    constructor(config: {
        host: string;
        port?: number;
        database: string;
        user: string;
        password: string;
    }) {
        this.config = {
            host: config.host,
            port: config.port || 5432,
            database: config.database,
            user: config.user,
            password: config.password,
            max: 10,
        };
    }

    async connect(): Promise<void> {
        this.pool = new Pool(this.config);

        // buat tabel users jika belum ada
        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        department VARCHAR(255) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // buat tabel ssh_credentials jika belum ada
        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ssh_credentials (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port INTEGER NOT NULL DEFAULT 22,
        username VARCHAR(255) NOT NULL,
        auth_type VARCHAR(50) NOT NULL DEFAULT 'password',
        encrypted_password TEXT,
        encrypted_private_key TEXT,
        encrypted_passphrase TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // cek apakah ada user, jika tidak, buat admin default
        const result = await this.pool.query('SELECT COUNT(*) as count FROM users');
        const count = parseInt(result.rows[0].count);

        if (count === 0) {
            const hashedPassword = await this.hashPassword('admin123');
            await this.pool.query(
                'INSERT INTO users (email, password, name, role, department) VALUES ($1, $2, $3, $4, $5)',
                ['admin@bapenda.go.id', '$2b$10$97/qtlZ7SFTjgXj6LN71fOWlcNrmFJf1onWRuasg3ehiLIsiO0BLO', 'Administrator', 'admin', 'IT']
            );
        }

        console.log('📦 PostgreSQL database connected:', this.config.host);
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
        console.log('📦 PostgreSQL database disconnected');
    }

    async findUserByEmail(email: string): Promise<User | null> {
        if (!this.pool) return null;
        const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    async findUserById(id: number): Promise<User | null> {
        if (!this.pool) return null;
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    async getAllUsers(): Promise<User[]> {
        if (!this.pool) return [];
        const result = await this.pool.query(
            'SELECT id, email, name, role, department, created_at, updated_at FROM users'
        );
        return result.rows;
    }

    async createUser(data: UserCreate): Promise<User> {
        if (!this.pool) throw new Error('Database not connected');

        const hashedPassword = await this.hashPassword(data.password);
        const result = await this.pool.query(
            'INSERT INTO users (email, password, name, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [data.email, hashedPassword, data.name, data.role, data.department]
        );

        return {
            id: result.rows[0].id,
            ...data,
            password: '***',
        };
    }

    async updateUser(id: number, data: UserUpdate): Promise<User | null> {
        if (!this.pool) return null;

        const updates: string[] = [];
        const values: (string | number | undefined)[] = [];
        let paramIndex = 1;

        if (data.email) { updates.push(`email = $${paramIndex++}`); values.push(data.email); }
        if (data.name) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.role) { updates.push(`role = $${paramIndex++}`); values.push(data.role); }
        if (data.department) { updates.push(`department = $${paramIndex++}`); values.push(data.department); }
        if (data.password) {
            const hashedPassword = await this.hashPassword(data.password);
            updates.push(`password = $${paramIndex++}`);
            values.push(hashedPassword);
        }

        if (updates.length === 0) return null;

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        await this.pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
        return this.findUserById(id);
    }

    async deleteUser(id: number): Promise<boolean> {
        if (!this.pool) return false;
        const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
        return (result.rowCount || 0) > 0;
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
        if (!this.pool) throw new Error('Database not connected');

        const result = await this.pool.query(
            `INSERT INTO ssh_credentials (node_id, name, host, port, username, auth_type, encrypted_password, encrypted_private_key, encrypted_passphrase)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
                data.nodeId,
                data.name,
                data.host,
                data.port || 22,
                data.username,
                data.authType,
                data.password ? encrypt(data.password) : null,
                data.privateKey ? encrypt(data.privateKey) : null,
                data.passphrase ? encrypt(data.passphrase) : null
            ]
        );

        const credential = await this.getSSHCredentialById(result.rows[0].id);
        if (!credential) throw new Error('Failed to create SSH credential');
        return credential;
    }

    async getSSHCredentialById(id: number): Promise<SSHCredential | null> {
        if (!this.pool) return null;
        const result = await this.pool.query('SELECT * FROM ssh_credentials WHERE id = $1', [id]);
        return result.rows[0] ? this.mapRowToSSHCredential(result.rows[0]) : null;
    }

    async getSSHCredentialsByNode(nodeId: string): Promise<SSHCredential[]> {
        if (!this.pool) return [];
        const result = await this.pool.query('SELECT * FROM ssh_credentials WHERE node_id = $1', [nodeId]);
        return result.rows.map(row => this.mapRowToSSHCredential(row));
    }

    async getAllSSHCredentials(): Promise<SSHCredential[]> {
        if (!this.pool) return [];
        const result = await this.pool.query(
            'SELECT id, node_id, name, host, port, username, auth_type, created_at, updated_at FROM ssh_credentials'
        );
        return result.rows.map(row => ({
            ...this.mapRowToSSHCredential(row),
            encryptedPassword: undefined,
            encryptedPrivateKey: undefined,
            encryptedPassphrase: undefined,
        }));
    }

    async updateSSHCredential(id: number, data: SSHCredentialUpdate): Promise<SSHCredential | null> {
        if (!this.pool) return null;

        const updates: string[] = [];
        const values: (string | number | null)[] = [];
        let paramIndex = 1;

        if (data.name) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.host) { updates.push(`host = $${paramIndex++}`); values.push(data.host); }
        if (data.port) { updates.push(`port = $${paramIndex++}`); values.push(data.port); }
        if (data.username) { updates.push(`username = $${paramIndex++}`); values.push(data.username); }
        if (data.authType) { updates.push(`auth_type = $${paramIndex++}`); values.push(data.authType); }
        if (data.password) { updates.push(`encrypted_password = $${paramIndex++}`); values.push(encrypt(data.password)); }
        if (data.privateKey) { updates.push(`encrypted_private_key = $${paramIndex++}`); values.push(encrypt(data.privateKey)); }
        if (data.passphrase) { updates.push(`encrypted_passphrase = $${paramIndex++}`); values.push(encrypt(data.passphrase)); }

        if (updates.length === 0) return null;

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        await this.pool.query(`UPDATE ssh_credentials SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
        return this.getSSHCredentialById(id);
    }

    async deleteSSHCredential(id: number): Promise<boolean> {
        if (!this.pool) return false;
        const result = await this.pool.query('DELETE FROM ssh_credentials WHERE id = $1', [id]);
        return (result.rowCount || 0) > 0;
    }
}

