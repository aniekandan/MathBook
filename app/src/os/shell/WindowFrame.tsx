import React, { type ReactNode } from 'react';

interface WindowFrameProps {
    appId: string;
    children: ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ children }) => {
    return (
        <div className="flex-1 relative flex flex-col min-h-0 bg-white dark:bg-slate-900">
            {children}
        </div>
    );
};
