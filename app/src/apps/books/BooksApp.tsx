import { type FC, useEffect, useState, useRef } from 'react';
import { Save, AlertCircle, Loader2, Pencil, Calculator } from 'lucide-react';
import { useNotebookStore } from './store/useNotebookStore';
import { Cell } from './components/Cell';
import { CommandBar } from './components/CommandBar';
import { AddCellBar } from './components/AddCellBar';

interface BooksAppProps {
    path?: string;
}

export const BooksApp: FC<BooksAppProps> = ({ path = 'MyNotebook.nb' }) => {
    const cells = useNotebookStore((state: any) => state.cells);
    const initializeWorker = useNotebookStore((state: any) => state.initializeWorker);
    const loadNotebook = useNotebookStore((state: any) => state.loadNotebook);
    const saveStatus = useNotebookStore((state: any) => state.saveStatus);
    const saveError = useNotebookStore((state: any) => state.saveError);

    const activeCellId = useNotebookStore((state: any) => state.activeCellId);
    const saveNotebook = useNotebookStore((state: any) => state.saveNotebook);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [notebookName, setNotebookName] = useState(() => {
        return localStorage.getItem('mathbook_name') || 'Interactive Math Notebook';
    });
    const [editedName, setEditedName] = useState('');

    // 1. Initial Load
    useEffect(() => {
        initializeWorker();

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            const success = await loadNotebook(path);
            if (!success) setError('Failed to load notebook.');
            setIsLoading(false);
        };

        loadData();
    }, [initializeWorker, loadNotebook, path]);

    // 2. Dirty Tracking
    // We skip the first render by using a ref so we don't mark as dirty immediately on load
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current || isLoading) {
            isFirstRender.current = false;
            return;
        }
        useNotebookStore.setState({ isDirty: true, saveStatus: 'unsaved' });
    }, [cells, activeCellId, path, isLoading]);

    // 3. Auto-Save Interval (5 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            saveNotebook();
        }, 5000);
        return () => clearInterval(interval);
    }, [saveNotebook]);

    // 4. Ctrl+S Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveNotebook();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveNotebook]);

    // Determine which cells should be visible based on heading groups
    const visibleCellIds = new Set<string>();

    for (const cell of cells) {
        visibleCellIds.add(cell.id);
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                <span className="text-slate-500 font-medium text-sm">Loading MathBook...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="text-red-500 font-bold">{error}</div>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">Reload App</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-12 font-sans selection:bg-cyan-100 selection:text-cyan-900 relative">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 relative mb-24">

                {/* Header */}
                <div className="bg-slate-900 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="bg-cyan-500 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20 shrink-0">
                            <Calculator className="text-white w-5 h-5" />
                        </div>

                        {/* Editable Title */}
                        <div className="flex-1 max-w-lg">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    autoFocus
                                    onBlur={() => {
                                        if (editedName.trim()) {
                                            setNotebookName(editedName.trim());
                                            localStorage.setItem('mathbook_name', editedName.trim());
                                        }
                                        setIsEditingName(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.currentTarget.blur();
                                        if (e.key === 'Escape') setIsEditingName(false);
                                    }}
                                    className="w-full bg-slate-800 text-white font-bold text-xl px-2 py-0.5 rounded border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                />
                            ) : (
                                <div
                                    className="group flex items-center gap-2 cursor-text"
                                    onClick={() => {
                                        setEditedName(notebookName);
                                        setIsEditingName(true);
                                    }}
                                >
                                    <h1 className="text-xl font-bold text-white hover:text-cyan-100 transition-colors truncate">
                                        {notebookName}
                                    </h1>
                                    <Pencil className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Status Indicator */}
                    <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 select-none">
                        {saveStatus === 'saved' && <><Save className="w-3.5 h-3.5 text-emerald-400" /> Saved</>}
                        {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Saving...</>}
                        {saveStatus === 'unsaved' && <><div className="w-2 h-2 rounded-full bg-amber-400" /> Unsaved changes</>}
                        {saveStatus === 'error' && <><AlertCircle className="w-3.5 h-3.5 text-red-400" /> Save failed</>}
                    </div>
                </div>

                {saveError && (
                    <div className="bg-red-50 px-6 py-3 border-b border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {saveError}
                    </div>
                )}

                <div className="p-4 md:p-8 space-y-6">
                    <AddCellBar index={0} />
                    {cells.map((cell: any, index: number) => {
                        if (!visibleCellIds.has(cell.id)) return null;

                        return (
                            <div key={cell.id}>
                                <Cell cell={cell} />
                                <AddCellBar index={index + 1} />
                            </div>
                        );
                    })}
                </div>
            </div>
            <CommandBar />
        </div>
    );
};
