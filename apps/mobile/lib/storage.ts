// ponytail: in-memory storage; no expo-secure-store to avoid native bundling issues
const memoryStore = new Map<string, string>();

export const storage = {
    getItemAsync: async (k: string): Promise<string | null> => memoryStore.get(k) ?? null,
    setItemAsync: async (k: string, v: string): Promise<void> => {
        memoryStore.set(k, v);
    },
    deleteItemAsync: async (k: string): Promise<void> => {
        memoryStore.delete(k);
    },
};
