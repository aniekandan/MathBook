import React from 'react';
import type { AppDefinition } from '../types/AppDefinition';

interface AppLauncherProps {
    apps: AppDefinition[];
    onLaunch: (appId: string) => void;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({ apps, onLaunch }) => {
    return (
        <div className="flex-1 overflow-y-auto p-12 bg-meridian-bg dark:bg-slate-900">
            <h1 className="text-3xl font-light mb-12 text-center text-slate-800 dark:text-slate-100">
                Welcome to Meridian
            </h1>

            <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                {apps.map(app => (
                    <button
                        key={app.id}
                        onClick={() => onLaunch(app.id)}
                        className="group flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all hover:-translate-y-1"
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white"
                            style={{ backgroundColor: app.color }}
                        >
                            {/* We will map icons in a real icon system, placeholder for now */}
                            <span className="text-2xl font-bold">{app.name.charAt(app.name.indexOf(' ') + 1) || app.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {app.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
