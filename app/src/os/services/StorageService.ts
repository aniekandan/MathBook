import { ConfigService } from './ConfigService';
import { NotifyService } from './NotifyService';

// Helper to make hitting the API cleaner
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = ConfigService.getPath('apiUrl');
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API Error: ${response.status}`);
        }

        return await response.json();
    } catch (err: any) {
        NotifyService.error(err.message);
        throw err;
    }
};

export const StorageService = {
    listFiles: async (path: string) => {
        return apiCall(`/files/list?path=${encodeURIComponent(path || '')}`);
    },
    createFolder: async (path: string, name: string) => {
        return apiCall('/files/folder', {
            method: 'POST',
            body: JSON.stringify({ path, name })
        });
    },
    createNotebook: async (path: string, name: string) => {
        return apiCall('/notebooks', {
            method: 'POST',
            body: JSON.stringify({ path, name })
        });
    },
    renameItem: async (path: string, oldName: string, newName: string) => {
        return apiCall('/files/rename', {
            method: 'PUT',
            body: JSON.stringify({ path, oldName, newName })
        });
    },
    deleteItem: async (path: string, name: string) => {
        return apiCall('/files', {
            method: 'DELETE',
            body: JSON.stringify({ path, name })
        });
    },
    loadNotebook: async (path: string) => {
        return apiCall(`/notebooks?path=${encodeURIComponent(path)}`);
    },
    saveNotebook: async (path: string, data: any) => {
        return apiCall('/notebooks', {
            method: 'PUT',
            body: JSON.stringify({ path, data })
        });
    }
};
