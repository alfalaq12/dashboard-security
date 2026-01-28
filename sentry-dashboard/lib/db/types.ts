/*
 * Database Adapter Interface
 * Interface umum untuk berbagai jenis database
 */

export interface User {
    id: number;
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserCreate {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    department: string;
}

export interface UserUpdate {
    email?: string;
    password?: string;
    name?: string;
    role?: 'admin' | 'operator' | 'viewer';
    department?: string;
}

/*
 * Interface DatabaseAdapter
 * Harus diimplementasikan oleh semua adapter database
 */
export interface DatabaseAdapter {
    // koneksi
    connect(): Promise<void>;
    disconnect(): Promise<void>;

    // operasi user
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: number): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    createUser(data: UserCreate): Promise<User>;
    updateUser(id: number, data: UserUpdate): Promise<User | null>;
    deleteUser(id: number): Promise<boolean>;

    // validasi password
    verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    hashPassword(password: string): Promise<string>;
}

/*
 * Tipe database yang didukung
 */
export type DatabaseType = 'memory' | 'sqlite' | 'mysql' | 'postgresql' | 'mongodb';

/*
 * Konfigurasi database
 */
export interface DatabaseConfig {
    type: DatabaseType;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    filename?: string; // untuk SQLite
    connectionString?: string; // untuk MongoDB
}
