import type { FC } from 'react';
import { Play, Plus, Code2, Type } from 'lucide-react';
import { useNotebookStore } from '../store/useNotebookStore';

export const CommandBar: FC = () => {
    const addCell = useNotebookStore((state: any) => state.addCell);
    const runAll = useNotebookStore((state: any) => state.runAll);

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-sm font-medium text-slate-600 shadow-sm z-20 relative">
            <button
                onClick={() => addCell(undefined, 'code')}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
                <Plus className="w-4 h-4" />
                <Code2 className="w-4 h-4" />
                <span>Code</span>
            </button>
            <button
                onClick={() => addCell(undefined, 'markdown')}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
                <Plus className="w-4 h-4" />
                <Type className="w-4 h-4" />
                <span>Markdown</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-2" />

            <button
                onClick={runAll}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 hover:text-emerald-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
                <Play className="w-4 h-4 fill-current" />
                <span>Run All</span>
            </button>
        </div>
    );
};
