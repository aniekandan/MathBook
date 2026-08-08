import configData from '../../../../config.json';
import type { AppDefinition } from '../types/AppDefinition';

export interface ConfigType {
    version: string;
    mode: 'local' | 'cloud';
    paths: Record<string, string>;
    ports: Record<string, number>;
    registry: Record<string, Omit<AppDefinition, 'component' | 'id'>>;
}

const config = configData as ConfigType;

export const ConfigService = {
    getVersion: () => config.version,
    getMode: () => config.mode,
    getPath: (key: string) => config.paths[key],
    getPort: (key: string) => config.ports[key],
    getApp: (id: string) => {
        const appInfo = config.registry[id];
        if (!appInfo) throw new Error(`App ${id} not found in registry`);
        return { id, ...appInfo };
    },
    getAllApps: () => {
        return Object.entries(config.registry).map(([id, info]) => ({
            id,
            ...info
        }));
    }
};
