import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface NoteAppDB extends DBSchema {
    notes: {
        key: any;
        value: CachedNote;
        indexes: { 'by-modified': any };
    };
    syncQueue: {
        key: any;
        value: SyncOperation;
        indexes: { 'by-timestamp': any };
    };
}

export interface CachedNote {
    id: string | number;
    data: any;
    locallyModified: boolean;
    lastSyncedAt?: string;
}

export interface SyncOperation {
    id?: number;
    type: string;
    resourceType: string;
    resourceId: string | number;
    payload: any;
    timestamp: number;
    retryCount?: number;
}

const DB_NAME = 'note-app-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<NoteAppDB> | null = null;

async function getDB(): Promise<IDBPDatabase<NoteAppDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<NoteAppDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create notes store
            if (!db.objectStoreNames.contains('notes')) {
                const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                notesStore.createIndex('by-modified', 'locallyModified');
            }

            // Create sync queue store
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                syncStore.createIndex('by-timestamp', 'timestamp');
            }
        },
    });

    return dbInstance;
}

// Notes operations
export async function getCachedNotes(): Promise<CachedNote[]> {
    const db = await getDB();
    return db.getAll('notes');
}

export async function getCachedNoteById(id: string | number): Promise<CachedNote | undefined> {
    const db = await getDB();
    let note = await db.get('notes', id);

    // Fallback: If not found and id is a numeric string, try as number
    if (!note && typeof id === 'string' && !isNaN(Number(id))) {
        note = await db.get('notes', Number(id));
    }
    // Fallback: If not found and id is a number, try as string
    if (!note && typeof id === 'number') {
        note = await db.get('notes', id.toString());
    }

    return note;
}

export async function addCachedNote(note: CachedNote): Promise<void> {
    const db = await getDB();
    await db.put('notes', note);
}

export async function updateCachedNote(
    id: string | number,
    updates: Partial<CachedNote>
): Promise<void> {
    const db = await getDB();
    const existing = await db.get('notes', id);
    if (existing) {
        await db.put('notes', { ...existing, ...updates });
    }
}

export async function removeCachedNote(id: string | number): Promise<void> {
    const db = await getDB();
    await db.delete('notes', id);
}

export async function setCachedNotes(notes: CachedNote[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('notes', 'readwrite');
    await tx.store.clear();
    await Promise.all(notes.map((note) => tx.store.put(note)));
    await tx.done;
}

// Sync queue operations
export async function getSyncQueue(): Promise<SyncOperation[]> {
    const db = await getDB();
    return db.getAll('syncQueue');
}

export async function setSyncQueue(operations: SyncOperation[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.store.clear();
    await Promise.all(operations.map((op) => tx.store.put(op)));
    await tx.done;
}

export async function enqueueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<void> {
    const db = await getDB();
    const op: SyncOperation = {
        ...operation,
        timestamp: Date.now(),
        retryCount: 0,
    };
    await db.add('syncQueue', op);
    console.log('📥 Operation enqueued:', operation.type, operation.resourceType);
}

export async function clearSyncQueue(): Promise<void> {
    const db = await getDB();
    await db.clear('syncQueue');
}

// Utility to generate UUID (same as mobile)
export const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
