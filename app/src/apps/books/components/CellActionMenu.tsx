import type { FC } from 'react';
import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';
import { useNotebookStore, type Cell } from '../store/useNotebookStore';

interface CellActionMenuProps {
    cell: Cell;
    isEditing?: boolean;
    onEdit?: () => void;
}

export const CellActionMenu: FC<CellActionMenuProps> = ({ cell, isEditing, onEdit }) => {
    const moveCell = useNotebookStore((state: any) => state.moveCell);
    const removeCell = useNotebookStore((state: any) => state.removeCell);

    const isMarkdown = cell.cellType === 'markdown';

    return (
        <div className="absolute right-2 top-2 flex flex-row items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-md p-1 z-20 opacity-0 group-[.ring-2]:opacity-100 transition-opacity">
            <button
                onClick={(e) => { e.stopPropagation(); moveCell(cell.id, 'up'); }}
                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-50 rounded-md transition-colors"
                title="Move cell up"
            >
                <ArrowUp className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); moveCell(cell.id, 'down'); }}
                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-50 rounded-md transition-colors"
                title="Move cell down"
            >
                <ArrowDown className="w-4 h-4" />
            </button>

            {isMarkdown && onEdit && !isEditing && (
                <>
                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-md transition-colors"
                        title="Edit markdown"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </>
            )}

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
            <button
                onClick={(e) => { e.stopPropagation(); removeCell(cell.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete cell"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};
