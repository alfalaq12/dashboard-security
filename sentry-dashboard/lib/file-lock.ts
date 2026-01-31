// Simple file-based mutex locks for preventing race conditions
// Each file has its own lock to allow parallel operations on different files

type LockResolver = () => void;

const locks: Map<string, boolean> = new Map();
const queues: Map<string, LockResolver[]> = new Map();

/**
 * Acquire a lock for a specific file
 * @param filename - The file identifier to lock
 * @returns Promise that resolves when lock is acquired
 */
export async function acquireFileLock(filename: string): Promise<void> {
    return new Promise((resolve) => {
        const isLocked = locks.get(filename) || false;

        if (!isLocked) {
            locks.set(filename, true);
            resolve();
        } else {
            // Add to queue
            const queue = queues.get(filename) || [];
            queue.push(resolve);
            queues.set(filename, queue);
        }
    });
}

/**
 * Release a lock for a specific file
 * @param filename - The file identifier to unlock
 */
export function releaseFileLock(filename: string): void {
    const queue = queues.get(filename) || [];

    if (queue.length > 0) {
        // Pass lock to next in queue
        const next = queue.shift();
        queues.set(filename, queue);
        if (next) next();
    } else {
        // No one waiting, release lock
        locks.set(filename, false);
    }
}

/**
 * Execute a function with file lock protection
 * @param filename - The file identifier to lock
 * @param fn - The async function to execute while holding the lock
 * @returns The result of the function
 */
export async function withFileLock<T>(filename: string, fn: () => Promise<T>): Promise<T> {
    await acquireFileLock(filename);
    try {
        return await fn();
    } finally {
        releaseFileLock(filename);
    }
}
