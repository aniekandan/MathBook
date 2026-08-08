import React, { useState } from 'react';
import { Taskbar } from './shell/Taskbar';
import { AppLauncher } from './shell/AppLauncher';
import { WindowFrame } from './shell/WindowFrame';
import { installedApps } from './apps/registry';
import { UIService } from './services/UIService';

export const OS: React.FC = () => {
    const [activeAppId, setActiveAppId] = useState<string | null>(null);
    const [appContext, setAppContext] = useState<any>(null);

    const handleLaunchApp = (appId: string, context?: any) => {
        setActiveAppId(appId);
        setAppContext(context || null);
        UIService.applyAppTheme(appId);
    };

    const handleGoHome = () => {
        setActiveAppId(null);
        setAppContext(null);
        // Reset to default generic OS theme
        document.documentElement.style.setProperty('--accent-primary', '#64748b'); // slate-500
    };

    const activeApp = installedApps.find(a => a.id === activeAppId);
    const ActiveComponent = activeApp?.component;

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
            <Taskbar
                apps={installedApps}
                activeAppId={activeAppId}
                onAppClick={(id) => handleLaunchApp(id)}
                onHomeClick={handleGoHome}
            />
            {activeAppId && ActiveComponent ? (
                <WindowFrame appId={activeAppId}>
                    <ActiveComponent {...appContext} onLaunchApp={handleLaunchApp} />
                </WindowFrame>
            ) : (
                <AppLauncher apps={installedApps} onLaunch={handleLaunchApp} />
            )}
        </div>
    );
};
