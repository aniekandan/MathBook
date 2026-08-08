import { type FC, useEffect, useRef } from 'react';
import { Pencil, Trash2, FolderPlus, FilePlus } from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    itemName: string | null;
    isDirectory: boolean | null;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onNewFolder: () => void;
    onNewNotebook: () => void;
}

export const ContextMenu: FC<ContextMenuProps> = ({ x, y, itemName, onClose, onRename, onDelete, onNewFolder, onNewNotebook }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-xl py-2 min-w-[200px] text-sm font-medium text-slate-700"
            style={{ top: y, left: x }}
        >
            {itemName ? (
                <>
                    <div className="px-3 py-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider border-b mb-1 truncate">
                        {itemName}
                    </div>
                    <button
                        onClick={() => { onRename(); onClose(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 hover:text-cyan-600 transition-colors text-left"
                    >
                        <Pencil className="w-4 h-4" /> Rename
                    </button>
                    <button
                        onClick={() => { onDelete(); onClose(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={() => { onNewFolder(); onClose(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 hover:text-cyan-600 transition-colors text-left"
                    >
                        <FolderPlus className="w-4 h-4" /> New Folder
                    </button>
                    <button
                        onClick={() => { onNewNotebook(); onClose(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 hover:text-cyan-600 transition-colors text-left"
                    >
                        <FilePlus className="w-4 h-4" /> New Notebook
                    </button>
                </>
            )}
        </div>
    );
};
