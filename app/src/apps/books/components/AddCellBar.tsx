import type { FC } from 'react';
import { Code2, Type } from 'lucide-react';
import { useNotebookStore } from '../store/useNotebookStore';

interface AddCellBarProps {
    index: number;
}

export const AddCellBar: FC<AddCellBarProps> = ({ index }) => {
    const addCell = useNotebookStore((state: any) => state.addCell);

    return (
        <div className="group relative flex items-center justify-center my-1 -mx-4 h-6 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
            {/* The invisible hit area expands the hover zone */}
            <div className="absolute inset-x-0 inset-y-[-8px]" />

            {/* The visible horizontal line */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-200" />

            {/* The buttons */}
            <div className="relative flex gap-2 bg-slate-50 border border-cyan-200 px-3 py-1 rounded-full shadow-sm text-xs font-medium text-slate-500">
                <button
                    onClick={() => addCell(index, 'code')}
                    className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors focus:outline-none focus:text-cyan-600"
                    title="Add Code Cell"
                >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code</span>
                </button>
                <div className="w-[1px] h-3.5 bg-slate-200 my-auto" />
                <button
                    onClick={() => addCell(index, 'markdown')}
                    className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors focus:outline-none focus:text-cyan-600"
                    title="Add Markdown Cell"
                >
                    <Type className="w-3.5 h-3.5" />
                    <span>Markdown</span>
                </button>
            </div>
        </div>
    );
};
