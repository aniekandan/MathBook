import { ConfigService } from './ConfigService';

export const UIService = {
    setMode: (mode: 'dark' | 'light') => {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },
    applyAppTheme: (appId: string) => {
        const app = ConfigService.getApp(appId);
        document.documentElement.style.setProperty('--accent-primary', app.color);
    },
    getAccentColor: (appId: string) => {
        return ConfigService.getApp(appId).color;
    }
};
