import { create } from 'zustand';
import { StorageService } from '../../os/services/StorageService';

export interface DriveEntry {
    name: string;
    isDirectory: boolean;
    extension: string | null;
    size: number | null;
    modified: string;
    created: string;
}

interface DriveState {
    currentPath: string;
    entries: DriveEntry[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setCurrentPath: (path: string) => void;
    fetchEntries: () => Promise<void>;
    createFolder: (name: string) => Promise<{ success: boolean; error?: string }>;
    createNotebook: (name: string) => Promise<{ success: boolean; name?: string; error?: string }>;
    renameItem: (oldName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
    deleteItem: (name: string) => Promise<{ success: boolean; error?: string }>;
}

export const useDriveStore = create<DriveState>((set, get) => ({
    currentPath: '',
    entries: [],
    isLoading: false,
    error: null,

    setCurrentPath: (path: string) => {
        set({ currentPath: path });
        get().fetchEntries();
    },

    fetchEntries: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await StorageService.listFiles(get().currentPath);
            set({ entries: data.entries, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    createFolder: async (name: string) => {
        try {
            await StorageService.createFolder(get().currentPath, name);
            await get().fetchEntries();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    createNotebook: async (name: string) => {
        try {
            const data = await StorageService.createNotebook(get().currentPath, name);
            await get().fetchEntries();
            return { success: true, name: data.name };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    renameItem: async (oldName: string, newName: string) => {
        try {
            await StorageService.renameItem(get().currentPath, oldName, newName);
            await get().fetchEntries();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    deleteItem: async (name: string) => {
        try {
            await StorageService.deleteItem(get().currentPath, name);
            await get().fetchEntries();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
}));
