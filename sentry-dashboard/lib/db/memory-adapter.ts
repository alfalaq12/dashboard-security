/*
 * Memory Adapter
 * Adapter database in-memory untuk development dan testing
 * Data hilang saat server restart
 */

import { DatabaseAdapter, User, UserCreate, UserUpdate } from './types';
import bcrypt from 'bcryptjs';

// data user default
const defaultUsers: User[] = [
    {
        id: 1,
        email: 'admin@bapenda.go.id',
        password: '$2b$10$97/qtlZ7SFTjgXj6LN71fOWlcNrmFJf1onWRuasg3ehiLIsiO0BLO', // admin123
        name: 'Administrator',
        role: 'admin',
        department: 'IT',
        createdAt: new Date(),
    },
    {
        id: 2,
        email: 'operator@bapenda.go.id',
        password: '$2b$10$p99UEGIagjKg1ObEkP06Xe97X0P8H1klgGf2uX4a5GSv.crjgCfDW', // operator123
        name: 'Operator',
        role: 'operator',
        department: 'Infrastruktur',
        createdAt: new Date(),
    },
    {
        id: 3,
        email: 'viewer@bapenda.go.id',
        password: '$2b$10$4NLpMAMnD.VjsqWXfqU41e8jRvWHJSW0Fn7InBdl9io57k2bqiRKO', // viewer123
        name: 'Viewer',
        role: 'viewer',
        department: 'Umum',
        createdAt: new Date(),
    },
];

export class MemoryAdapter implements DatabaseAdapter {
    private users: User[] = [];
    private nextId: number = 1;

    async connect(): Promise<void> {
        // inisialisasi dengan user default
        this.users = [...defaultUsers];
        this.nextId = this.users.length + 1;
        console.log('📦 Memory database connected');
    }

    async disconnect(): Promise<void> {
        this.users = [];
        console.log('📦 Memory database disconnected');
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.users.find(u => u.email === email) || null;
    }

    async findUserById(id: number): Promise<User | null> {
        return this.users.find(u => u.id === id) || null;
    }

    async getAllUsers(): Promise<User[]> {
        return this.users.map(u => ({ ...u, password: '***' })); // sembunyikan password
    }

    async createUser(data: UserCreate): Promise<User> {
        const hashedPassword = await this.hashPassword(data.password);
        const newUser: User = {
            id: this.nextId++,
            ...data,
            password: hashedPassword,
            createdAt: new Date(),
        };
        this.users.push(newUser);
        return { ...newUser, password: '***' };
    }

    async updateUser(id: number, data: UserUpdate): Promise<User | null> {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) return null;

        // hash password jika diupdate
        if (data.password) {
            data.password = await this.hashPassword(data.password);
        }

        this.users[index] = {
            ...this.users[index],
            ...data,
            updatedAt: new Date(),
        };

        return { ...this.users[index], password: '***' };
    }

    async deleteUser(id: number): Promise<boolean> {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) return false;

        this.users.splice(index, 1);
        return true;
    }

    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }
}
