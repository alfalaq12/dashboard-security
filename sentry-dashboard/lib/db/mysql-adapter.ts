/*
 * MySQL Adapter
 * Adapter untuk database MySQL/MariaDB
 */

import { DatabaseAdapter, User, UserCreate, UserUpdate, SSHCredential, SSHCredentialCreate, SSHCredentialUpdate } from './types';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { encrypt } from '../crypto';

export class MySQLAdapter implements DatabaseAdapter {
    private pool: mysql.Pool | null = null;
    private config: mysql.PoolOptions;

    constructor(config: {
        host: string;
        port?: number;
        database: string;
        user: string;
        password: string;
    }) {
        this.config = {
            host: config.host,
            port: config.port || 3306,
            database: config.database,
            user: config.user,
            password: config.password,
            waitForConnections: true,
            connectionLimit: 10,
        };
    }

    async connect(): Promise<void> {
        this.pool = mysql.createPool(this.config);

        // buat tabel users jika belum ada
        await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
        department VARCHAR(255) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // buat tabel ssh_credentials jika belum ada
        await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS ssh_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port INT NOT NULL DEFAULT 22,
        username VARCHAR(255) NOT NULL,
        auth_type ENUM('password', 'privatekey') NOT NULL DEFAULT 'password',
        encrypted_password TEXT,
        encrypted_private_key TEXT,
        encrypted_passphrase TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        // cek apakah ada user, jika tidak, buat admin default
        const [rows] = await this.pool.execute('SELECT COUNT(*) as count FROM users');
        const count = (rows as { count: number }[])[0].count;

        if (count === 0) {
            const hashedPassword = await this.hashPassword('admin123');
            await this.pool.execute(
                'INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)',
                ['admin@bapenda.go.id', '$2b$10$97/qtlZ7SFTjgXj6LN71fOWlcNrmFJf1onWRuasg3ehiLIsiO0BLO', 'Administrator', 'admin', 'IT']
            );
        }

        console.log('📦 MySQL database connected:', this.config.host);
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
        console.log('📦 MySQL database disconnected');
    }

    async findUserByEmail(email: string): Promise<User | null> {
        if (!this.pool) return null;
        const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const users = rows as User[];
        return users[0] || null;
    }

    async findUserById(id: number): Promise<User | null> {
        if (!this.pool) return null;
        const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        const users = rows as User[];
        return users[0] || null;
    }

    async getAllUsers(): Promise<User[]> {
        if (!this.pool) return [];
        const [rows] = await this.pool.execute(
            'SELECT id, email, name, role, department, created_at, updated_at FROM users'
        );
        return rows as User[];
    }

    async createUser(data: UserCreate): Promise<User> {
        if (!this.pool) throw new Error('Database not connected');

        const hashedPassword = await this.hashPassword(data.password);
        const [result] = await this.pool.execute(
            'INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)',
            [data.email, hashedPassword, data.name, data.role, data.department]
        );

        const insertResult = result as mysql.ResultSetHeader;
        return {
            id: insertResult.insertId,
            ...data,
            password: '***',
        };
    }

    async updateUser(id: number, data: UserUpdate): Promise<User | null> {
        if (!this.pool) return null;

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

        values.push(id.toString());

        await this.pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.findUserById(id);
    }

    async deleteUser(id: number): Promise<boolean> {
        if (!this.pool) return false;
        const [result] = await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return (result as mysql.ResultSetHeader).affectedRows > 0;
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

        const [result] = await this.pool.execute(
            `INSERT INTO ssh_credentials (node_id, name, host, port, username, auth_type, encrypted_password, encrypted_private_key, encrypted_passphrase)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

        const insertResult = result as mysql.ResultSetHeader;
        const credential = await this.getSSHCredentialById(insertResult.insertId);
        if (!credential) throw new Error('Failed to create SSH credential');
        return credential;
    }

    async getSSHCredentialById(id: number): Promise<SSHCredential | null> {
        if (!this.pool) return null;
        const [rows] = await this.pool.execute('SELECT * FROM ssh_credentials WHERE id = ?', [id]);
        const credentials = rows as any[];
        return credentials[0] ? this.mapRowToSSHCredential(credentials[0]) : null;
    }

    async getSSHCredentialsByNode(nodeId: string): Promise<SSHCredential[]> {
        if (!this.pool) return [];
        const [rows] = await this.pool.execute('SELECT * FROM ssh_credentials WHERE node_id = ?', [nodeId]);
        return (rows as any[]).map(row => this.mapRowToSSHCredential(row));
    }

    async getAllSSHCredentials(): Promise<SSHCredential[]> {
        if (!this.pool) return [];
        const [rows] = await this.pool.execute(
            'SELECT id, node_id, name, host, port, username, auth_type, created_at, updated_at FROM ssh_credentials'
        );
        return (rows as any[]).map(row => ({
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

        if (data.name) { updates.push('name = ?'); values.push(data.name); }
        if (data.host) { updates.push('host = ?'); values.push(data.host); }
        if (data.port) { updates.push('port = ?'); values.push(data.port); }
        if (data.username) { updates.push('username = ?'); values.push(data.username); }
        if (data.authType) { updates.push('auth_type = ?'); values.push(data.authType); }
        if (data.password) { updates.push('encrypted_password = ?'); values.push(encrypt(data.password)); }
        if (data.privateKey) { updates.push('encrypted_private_key = ?'); values.push(encrypt(data.privateKey)); }
        if (data.passphrase) { updates.push('encrypted_passphrase = ?'); values.push(encrypt(data.passphrase)); }

        if (updates.length === 0) return null;

        values.push(id);

        await this.pool.execute(`UPDATE ssh_credentials SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.getSSHCredentialById(id);
    }

    async deleteSSHCredential(id: number): Promise<boolean> {
        if (!this.pool) return false;
        const [result] = await this.pool.execute('DELETE FROM ssh_credentials WHERE id = ?', [id]);
        return (result as mysql.ResultSetHeader).affectedRows > 0;
    }
}

