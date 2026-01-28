/*
 * Database Manager
 * Mengelola koneksi database berdasarkan konfigurasi
 */

import { DatabaseAdapter, DatabaseType } from './types';
import { MemoryAdapter } from './memory-adapter';

// instance database singleton
let dbInstance: DatabaseAdapter | null = null;

/*
 * Mendapatkan tipe database dari environment variable
 */
function getDatabaseType(): DatabaseType {
    const type = process.env.DB_TYPE as DatabaseType;
    return type || 'memory';
}

/*
 * Membuat instance adapter berdasarkan tipe database
 */
async function createAdapter(): Promise<DatabaseAdapter> {
    const type = getDatabaseType();

    switch (type) {
        case 'memory':
            return new MemoryAdapter();

        case 'sqlite':
            const { SQLiteAdapter } = await import('./sqlite-adapter');
            return new SQLiteAdapter(process.env.DB_FILENAME || 'sentry.db');

        case 'mysql':
            const { MySQLAdapter } = await import('./mysql-adapter');
            return new MySQLAdapter({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                database: process.env.DB_NAME || 'sentry',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
            });

        case 'postgresql':
            const { PostgreSQLAdapter } = await import('./postgresql-adapter');
            return new PostgreSQLAdapter({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'sentry',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '',
            });

        default:
            console.warn(`⚠️ Database type "${type}" not configured, using memory`);
            return new MemoryAdapter();
    }
}

/*
 * Mendapatkan instance database
 * Singleton pattern: hanya ada satu koneksi
 */
export async function getDatabase(): Promise<DatabaseAdapter> {
    if (!dbInstance) {
        const type = getDatabaseType();
        console.log(`🔌 Initializing ${type} database...`);

        dbInstance = await createAdapter();
        await dbInstance.connect();
    }
    return dbInstance;
}

/*
 * Menutup koneksi database
 */
export async function closeDatabase(): Promise<void> {
    if (dbInstance) {
        await dbInstance.disconnect();
        dbInstance = null;
    }
}

/*
 * Export types untuk kemudahan import
 */
export * from './types';
