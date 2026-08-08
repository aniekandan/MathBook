import { type FC, type KeyboardEvent, useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Play, CheckCircle2, AlertCircle, FunctionSquare, Pencil } from 'lucide-react';
import type { Cell as CellType } from '../store/useNotebookStore';
import { useNotebookStore } from '../store/useNotebookStore';
import { CellActionMenu } from './CellActionMenu';
import { MarkdownCell } from './MarkdownCell';

interface CellProps {
    cell: CellType;
}

export const Cell: FC<CellProps> = ({ cell }) => {
    const updateCellCode = useNotebookStore((state: any) => state.updateCellCode);
    const updateCellVarName = useNotebookStore((state: any) => state.updateCellVarName);
    const runCell = useNotebookStore((state: any) => state.runCell);
    const setActiveCell = useNotebookStore((state: any) => state.setActiveCell);
    const activeCellId = useNotebookStore((state: any) => state.activeCellId);
    const focusNextCell = useNotebookStore((state: any) => state.focusNextCell);
    const focusTrigger = useNotebookStore((state: any) => state.focusTrigger);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(cell.varName);
    const [nameError, setNameError] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Markdown edit state (start in edit mode if empty)
    const [isMarkdownEditing, setIsMarkdownEditing] = useState(cell.code.trim() === '');

    const isActive = activeCellId === cell.id;
    const isMarkdown = cell.cellType === 'markdown';

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    const cellRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isActive && focusTrigger > 0) {
            if (!isMarkdown) {
                // Expression cell: focus the CodeMirror editor
                setTimeout(() => {
                    const editor = document.querySelector(`.cell-${cell.id} .cm-content`) as HTMLElement;
                    if (editor) {
                        editor.focus();
                    }
                }, 50);
            } else if (!isMarkdownEditing) {
                // View-mode markdown cell: focus the wrapper div so it can receive keyboard events
                cellRef.current?.focus();
            }
        }
    }, [isActive, focusTrigger, isMarkdown, isMarkdownEditing, cell.id]);

    const handleKeyDown = (e: KeyboardEvent) => {
        // Both standard Enter and Shift+Enter execute the cell
        if (e.key === 'Enter') {
            e.preventDefault();
            // Blur the current CodeMirror editor so cursor leaves this cell
            const activeEl = document.activeElement as HTMLElement;
            if (activeEl) activeEl.blur();
            runCell(cell.id);
            focusNextCell(cell.id, 'code');
        }
    };

    const handleNameSubmit = () => {
        const trimmed = editName.trim();
        if (trimmed === cell.varName) {
            setIsEditingName(false);
            setNameError(null);
            return;
        }
        const result = updateCellVarName(cell.id, trimmed);
        if (result.success) {
            setIsEditingName(false);
            setNameError(null);
        } else {
            setNameError(result.error || 'Invalid name');
        }
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setEditName(cell.varName);
            setIsEditingName(false);
            setNameError(null);
        }
    };

    // Cell-level keyboard handler for view-mode markdown navigation
    const handleCellKeyDown = (e: React.KeyboardEvent) => {
        if (isMarkdown && !isMarkdownEditing && e.key === 'Enter') {
            e.preventDefault();
            focusNextCell(cell.id, 'markdown');
        }
    };

    return (
        <div
            ref={cellRef}
            onClick={() => setActiveCell(cell.id)}
            onFocus={() => setActiveCell(cell.id)}
            onKeyDown={handleCellKeyDown}
            tabIndex={isMarkdown && !isMarkdownEditing ? 0 : undefined}
            className={`cell-${cell.id} group relative transition-all rounded-2xl ${isMarkdown && !isMarkdownEditing ? 'bg-white' : 'bg-slate-50'
                } border ${isActive
                    ? 'border-cyan-400 shadow-md ring-2 ring-cyan-500/20 z-10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
        >
            {isActive && (
                <CellActionMenu
                    cell={cell}
                    isEditing={isMarkdownEditing}
                    onEdit={() => setIsMarkdownEditing(true)}
                />
            )}

            {isMarkdown ? (
                <MarkdownCell
                    cell={cell}
                    isEditing={isMarkdownEditing}
                    onEditEnd={() => setIsMarkdownEditing(false)}
                    onEditStart={() => setIsMarkdownEditing(true)}
                />
            ) : (
                <>
                    {/* Variable Name Badge (only for code) */}
                    <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={nameInputRef}
                                    value={editName}
                                    onChange={(e) => { setEditName(e.target.value); setNameError(null); }}
                                    onBlur={handleNameSubmit}
                                    onKeyDown={handleNameKeyDown}
                                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border outline-none transition-colors ${nameError
                                        ? 'border-red-300 bg-red-50 text-red-600'
                                        : 'border-cyan-300 bg-cyan-50 text-cyan-700'
                                        }`}
                                    style={{ width: Math.max(60, editName.length * 8 + 20) }}
                                />
                                {nameError && (
                                    <span className="text-[10px] text-red-500 font-medium">{nameError}</span>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => { setEditName(cell.varName); setIsEditingName(true); }}
                                className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-cyan-600 bg-slate-100 hover:bg-cyan-50 px-2 py-0.5 rounded-md border border-slate-200 hover:border-cyan-300 transition-all"
                            >
                                <span>{cell.varName}</span>
                                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>

                    {/* Code Input Area */}
                    <div className="flex items-start gap-3 px-4 pb-4 pt-1">
                        <div className="mt-2 text-slate-400">
                            <Play
                                className="w-4 h-4 cursor-pointer hover:text-cyan-500 transition-colors"
                                onClick={() => runCell(cell.id)}
                            />
                        </div>
                        <div className="flex-1 min-w-0" onKeyDownCapture={handleKeyDown}>
                            <CodeMirror
                                value={cell.code}
                                onChange={(value) => {
                                    const singleLine = value.replace(/[\r\n]+/g, '');
                                    updateCellCode(cell.id, singleLine);
                                }}
                                autoFocus={isActive && focusTrigger > 0}
                                placeholder="Enter expression... (Enter to run)"
                                theme="light"
                                basicSetup={{
                                    lineNumbers: false,
                                    foldGutter: false,
                                    highlightActiveLine: false,
                                    tabSize: 2,
                                }}
                                className="text-lg font-mono outline-none [&_.cm-editor]:bg-transparent [&_.cm-editor.cm-focused]:outline-none [&_.cm-scroller]:font-mono"
                            />
                        </div>
                    </div>

                    {/* Result Area */}
                    {(cell.result || cell.error) && (
                        <div className={`px-4 py-3 border-t flex items-center gap-3 rounded-b-2xl ${cell.error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-100'
                            }`}>
                            {cell.error ? (
                                <>
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <div className="font-mono text-sm">{cell.error}</div>
                                </>
                            ) : (
                                <>
                                    {cell.type === 'Function' ? (
                                        <FunctionSquare className="w-4 h-4 text-cyan-500 shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    )}
                                    <div className="font-mono font-bold text-slate-700">
                                        {cell.result}
                                    </div>
                                    <div className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                        {cell.type}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
