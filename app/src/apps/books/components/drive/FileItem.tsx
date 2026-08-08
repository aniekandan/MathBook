import { type FC } from 'react';
import { Folder, FileText } from 'lucide-react';
import type { DriveEntry } from '../../store/useDriveStore';

interface FileItemProps {
    entry: DriveEntry;
    onDoubleClick: (entry: DriveEntry) => void;
    onContextMenu: (e: React.MouseEvent, entry: DriveEntry) => void;
}

export const FileItem: FC<FileItemProps> = ({ entry, onDoubleClick, onContextMenu }) => {
    const isNotebook = entry.extension === '.nb';

    return (
        <div
            onDoubleClick={() => onDoubleClick(entry)}
            onContextMenu={(e) => onContextMenu(e, entry)}
            className="flex flex-col items-center justify-center p-4 gap-3 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all group"
        >
            <div className={`p-4 rounded-xl shadow-sm ${entry.isDirectory ? 'bg-amber-100 text-amber-500' : isNotebook ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-400'}`}>
                {entry.isDirectory ? (
                    <Folder className="w-10 h-10 fill-current" />
                ) : isNotebook ? (
                    <FileText className="w-10 h-10" />
                ) : (
                    <FileText className="w-10 h-10 opacity-50" />
                )}
            </div>
            <div className="text-sm font-semibold text-slate-700 max-w-full truncate text-center group-hover:text-cyan-700 transition-colors">
                {entry.name}
            </div>
        </div>
    );
};
