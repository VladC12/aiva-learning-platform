interface CacheEntry {
    key: string;
    data: ArrayBuffer;
    timestamp: number;
}

export class PDFCache {
    private dbName = 'pdf-cache';
    private storeName = 'pdfs';
    private db: IDBDatabase | null = null;
    private readonly MAX_AGE = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

    async init() {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 3); // Increment version to force upgrade
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.cleanup().catch(console.error); // Run cleanup on initialization
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Delete old store if exists
                if (db.objectStoreNames.contains(this.storeName)) {
                    db.deleteObjectStore(this.storeName);
                }
                
                // Create new store with proper index
                const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            };
        });
    }

    async get(key: string): Promise<ArrayBuffer | null> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const entry = request.result;
                if (!entry) return resolve(null);
                
                // Check if entry is expired
                if (Date.now() - entry.timestamp > this.MAX_AGE) {
                    this.delete(key); // Delete expired entry
                    resolve(null);
                } else {
                    resolve(entry.data);
                }
            };
        });
    }

    async set(key: string, data: ArrayBuffer): Promise<void> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const entry: CacheEntry & { key: string } = {
                key,
                data,
                timestamp: Date.now()
            };
            const request = store.put(entry);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async delete(key: string): Promise<void> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    private async cleanup(): Promise<void> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');
            const cutoff = Date.now() - this.MAX_AGE;
            
            // Use only completed transactions
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            
            const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        });
    }
}