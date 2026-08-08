import { type FC, useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { useDriveStore, type DriveEntry } from './useDriveStore';
import { Breadcrumbs } from './components/Breadcrumbs';
import { FileItem } from './components/FileItem';
import { ContextMenu } from './components/ContextMenu';
import versionConfig from '../../version.json';

interface DriveAppProps {
    onLaunchApp: (appId: string, context?: any) => void;
}

export const DriveApp: FC<DriveAppProps> = ({ onLaunchApp }) => {
    const { currentPath, entries, isLoading, error, fetchEntries, setCurrentPath, createFolder, createNotebook, renameItem, deleteItem } = useDriveStore();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemName: string | null; isDirectory: boolean | null } | null>(null);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleDoubleClick = (entry: DriveEntry) => {
        if (entry.isDirectory) {
            setCurrentPath(currentPath ? `${currentPath}/${entry.name}` : entry.name);
        } else if (entry.extension === '.nb') {
            const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            onLaunchApp('books', { path: fullPath });
        }
    };

    const handleContextMenu = (e: React.MouseEvent, entry?: DriveEntry) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            itemName: entry?.name || null,
            isDirectory: entry?.isDirectory || null,
        });
    };

    const closeMenu = () => setContextMenu(null);

    const handleNewFolder = async () => {
        const name = prompt('Folder name:');
        if (name) await createFolder(name);
    };

    const handleNewNotebook = async () => {
        const name = prompt('Notebook name:');
        if (name) await createNotebook(name);
    };

    const handleRename = async () => {
        if (!contextMenu?.itemName) return;
        const newName = prompt('New name:', contextMenu.itemName);
        if (newName && newName !== contextMenu.itemName) {
            await renameItem(contextMenu.itemName, newName);
        }
    };

    const handleDelete = async () => {
        if (!contextMenu?.itemName) return;
        if (confirm(`Move "${contextMenu.itemName}" to trash?`)) {
            await deleteItem(contextMenu.itemName);
        }
    };

    return (
        <div
            className="min-h-screen bg-slate-50 text-slate-900 font-sans"
            onContextMenu={(e) => handleContextMenu(e)}
            onClick={closeMenu}
        >
            <div className="max-w-6xl mx-auto p-4 md:p-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-cyan-500 p-3 rounded-2xl shadow-lg shadow-cyan-500/30">
                        <Calculator className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 italic">MathDrive</h1>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">MathBook v{versionConfig.version}</p>
                    </div>
                </div>

                <Breadcrumbs currentPath={currentPath} onNavigate={setCurrentPath} />

                {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 font-medium">{error}</div>}

                {/* File Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {entries.map((entry: DriveEntry) => (
                        <FileItem
                            key={entry.name}
                            entry={entry}
                            onDoubleClick={handleDoubleClick}
                            onContextMenu={handleContextMenu}
                        />
                    ))}
                    {!isLoading && entries.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 font-medium italic">
                            This folder is empty. Right-click to create a notebook.
                        </div>
                    )}
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    {...contextMenu}
                    onClose={closeMenu}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onNewFolder={handleNewFolder}
                    onNewNotebook={handleNewNotebook}
                />
            )}
        </div>
    );
};
