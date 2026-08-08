import { type FC } from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
    currentPath: string;
    onNavigate: (path: string) => void;
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ currentPath, onNavigate }) => {
    const parts = currentPath.split('/').filter(Boolean);

    return (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-6 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit">
            <button
                onClick={() => onNavigate('')}
                className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors"
            >
                <Home className="w-4 h-4" />
                <span>Drive</span>
            </button>

            {parts.map((part, idx) => {
                const pathUpToHere = parts.slice(0, idx + 1).join('/');
                return (
                    <div key={pathUpToHere} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <button
                            onClick={() => onNavigate(pathUpToHere)}
                            className="hover:text-cyan-600 transition-colors px-1"
                        >
                            {part}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
