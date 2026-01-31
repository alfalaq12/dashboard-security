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
 * SSH Credential Interface
 * Untuk menyimpan kredensial SSH yang terenkripsi
 */
export interface SSHCredential {
    id: number;
    nodeId: string;                    // Reference ke node yang terdaftar
    name: string;                      // Display name untuk credential
    host: string;                      // IP/hostname dari node
    port: number;                      // SSH port (default 22)
    username: string;                  // SSH username
    authType: 'password' | 'privatekey';
    encryptedPassword?: string;        // Encrypted password (jika authType = password)
    encryptedPrivateKey?: string;      // Encrypted private key (jika authType = privatekey)
    encryptedPassphrase?: string;      // Encrypted passphrase untuk private key
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SSHCredentialCreate {
    nodeId: string;
    name: string;
    host: string;
    port?: number;
    username: string;
    authType: 'password' | 'privatekey';
    password?: string;                 // Plain password (akan di-encrypt)
    privateKey?: string;               // Plain private key (akan di-encrypt)
    passphrase?: string;               // Plain passphrase (akan di-encrypt)
}

export interface SSHCredentialUpdate {
    name?: string;
    host?: string;
    port?: number;
    username?: string;
    authType?: 'password' | 'privatekey';
    password?: string;
    privateKey?: string;
    passphrase?: string;
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

    // operasi SSH credential
    createSSHCredential(data: SSHCredentialCreate): Promise<SSHCredential>;
    getSSHCredentialById(id: number): Promise<SSHCredential | null>;
    getSSHCredentialsByNode(nodeId: string): Promise<SSHCredential[]>;
    getAllSSHCredentials(): Promise<SSHCredential[]>;
    updateSSHCredential(id: number, data: SSHCredentialUpdate): Promise<SSHCredential | null>;
    deleteSSHCredential(id: number): Promise<boolean>;
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

