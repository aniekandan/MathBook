import React from 'react';
import type { AppDefinition } from '../types/AppDefinition';

interface TaskbarProps {
    apps: AppDefinition[];
    activeAppId: string | null;
    onAppClick: (appId: string) => void;
    onHomeClick: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ apps, activeAppId, onAppClick, onHomeClick }) => {
    return (
        <div className="h-14 bg-meridian-shell border-b border-slate-800 flex items-center px-4 shrink-0 shadow-md z-50">
            <div className="flex items-center gap-1">
                <button
                    onClick={onHomeClick}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                </button>
                <div className="w-px h-6 bg-slate-800 mx-2" />

                {apps.map(app => {
                    const isActive = activeAppId === app.id;
                    return (
                        <button
                            key={app.id}
                            onClick={() => onAppClick(app.id)}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${isActive
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: app.color, opacity: isActive ? 1 : 0.6 }}
                            />
                            <span className="text-sm font-medium tracking-wide">
                                {app.name.replace('Meridian ', '')}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
