import { create } from 'zustand';
import { Parser } from '../engine/parser/Parser';
import { astToString, astRenameIdentifier, astCollectIdentifiers } from '../engine/parser/ASTNodes';
import versionConfig from '../../../version.json';

export interface Cell {
    id: string;
    varName: string;
    code: string;
    result: string | null;
    error: string | null;
    type: string | null;
    cellType: 'code' | 'markdown';
}

const DEFAULT_CELLS: Cell[] = [
    {
        id: 'cell_1',
        cellType: 'markdown',
        varName: '_md1',
        code: '# Welcome to MathBook\nThis is an elegant, interactive reactive math notebook environment.\n\nDouble-click a cell to edit. Press **Shift+Enter** or use the action buttons to evaluate cells.\n\nYou can define variables and write mathematical expressions dynamically!',
        result: null,
        error: null,
        type: null
    },
    {
        id: 'cell_2',
        cellType: 'code',
        varName: 'x',
        code: 'x = 10',
        result: '10',
        error: null,
        type: 'number'
    },
    {
        id: 'cell_3',
        cellType: 'code',
        varName: 'y',
        code: 'y = x * 2.5 + 5',
        result: '30',
        error: null,
        type: 'number'
    },
    {
        id: 'cell_4',
        cellType: 'markdown',
        varName: '_md2',
        code: '### Reactive recalculations\nNotice how changing variables will automatically trigger updates when you re-evaluate! You can also insert new markdown and code cells using the spacing actions.',
        result: null,
        error: null,
        type: null
    }
];

/**
 * Generate a random variable name that follows identifier naming conventions.
 * Format: _xxxxxx (underscore + 6 hex chars)
 */
function generateVarName(): string {
    const hex = Math.random().toString(16).substring(2, 8);
    return `_${hex}`;
}

/**
 * Reserved keywords that cannot be used as variable names.
 */
const RESERVED_WORDS = new Set([
    'func', 'tuple', 'pi', 'e', 
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
    'sqrt', 'log', 'exp', 'abs', 'round', 'ceil', 'floor', 
    'pow', 'min', 'max'
]);

/**
 * Check if a string is a valid identifier.
 */
function isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

interface NotebookState {
    cells: Cell[];
    worker: Worker | null;

    // Reference tracking: varName → set of cell IDs that reference it
    references: Record<string, string[]>;

    // UI State
    activeCellId: string | null;
    expandedGroups: Record<string, boolean>;

    initializeWorker: () => void;
    addCell: (index?: number, cellType?: 'code' | 'markdown') => void;
    updateCellCode: (id: string, code: string) => void;
    updateCellVarName: (id: string, newName: string) => { success: boolean; error?: string };
    runCell: (id: string) => void;
    removeCell: (id: string) => { success: boolean; error?: string };

    // v2.1 UI Actions
    moveCell: (id: string, direction: 'up' | 'down') => void;
    runAll: () => void;
    setActiveCell: (id: string | null) => void;
    toggleCollapse: (headerId: string) => void;

    // v2.2 Navigation
    focusTrigger: number;
    focusNextCell: (currentId: string, fallbackType: 'code' | 'markdown') => void;

    // v3 MathDrive Integration
    currentNotebookPath: string | null;
    saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
    saveError: string | null;
    isDirty: boolean;
    loadNotebook: (path?: string) => Promise<boolean>;
    saveNotebook: () => Promise<void>;
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
    cells: [],
    worker: null,
    references: {},
    activeCellId: null,
    focusTrigger: 0,
    expandedGroups: {},

    // MathDrive Integration
    currentNotebookPath: 'MyNotebook.nb',
    saveStatus: 'saved',
    saveError: null,
    isDirty: false,

    loadNotebook: async (path: string = 'MyNotebook.nb') => {
        set({ currentNotebookPath: path, saveStatus: 'saved', saveError: null, isDirty: false });
        try {
            const raw = localStorage.getItem('mathbook_notebook');
            let data: any = null;
            if (raw) {
                try {
                    data = JSON.parse(raw);
                } catch {
                    // Ignore corrupt data
                }
            }

            const loadedCells = data && data.cells && data.cells.length > 0 ? data.cells : DEFAULT_CELLS;
            set({
                cells: loadedCells,
                activeCellId: data?.activeCellId || null,
                references: rebuildReferences(loadedCells),
                saveStatus: 'saved',
                isDirty: false
            });
            return true;
        } catch (err: any) {
            set({ saveError: err.message, saveStatus: 'error' });
            return false;
        }
    },

    saveNotebook: async () => {
        const state = get();
        if (!state.isDirty || state.saveStatus === 'saving') return;

        set({ saveStatus: 'saving', saveError: null });
        try {
            const payload = {
                meta: { mathbook_version: versionConfig.version },
                cells: state.cells,
                activeCellId: state.activeCellId,
            };

            localStorage.setItem('mathbook_notebook', JSON.stringify(payload));
            set({ saveStatus: 'saved', isDirty: false, saveError: null });
        } catch (err: any) {
            set({ saveStatus: 'error', saveError: err.message });
        }
    },

    initializeWorker: () => {
        if (get().worker) return;

        const worker = new Worker(
            new URL('../engine/engine.worker.ts', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (event) => {
            const { id, success, result, error, type, assignedName } = event.data;
            set((state) => {
                let updatedCells = state.cells;

                if (success && assignedName) {
                    const cell = state.cells.find(c => c.id === id);
                    if (cell && cell.varName !== assignedName) {
                        const isReserved = RESERVED_WORDS.has(assignedName);
                        const isValid = isValidIdentifier(assignedName);
                        const isUsed = state.cells.some(c => c.id !== id && c.varName === assignedName);

                        if (isUsed || isReserved || !isValid) {
                            let errMsg = '';
                            if (isUsed) {
                                errMsg = `Variable name '${assignedName}' is already defined by another cell`;
                            } else if (isReserved) {
                                errMsg = `Cannot assign to reserved keyword '${assignedName}'`;
                            } else {
                                errMsg = `Invalid variable name '${assignedName}'`;
                            }
                            const finalCells = state.cells.map(c =>
                                c.id === id
                                    ? { ...c, result: null, error: errMsg, type: null }
                                    : c
                            );
                            const updatedRefs = rebuildReferences(finalCells);
                            return { cells: finalCells, references: updatedRefs };
                        }

                        const oldName = cell.varName;
                        const referencingCellIds = state.references[oldName] || [];
                        updatedCells = state.cells.map(c => {
                            if (c.cellType === 'code' && referencingCellIds.includes(c.id)) {
                                try {
                                    const ast = Parser.parse(c.code);
                                    const renamed = astRenameIdentifier(ast, oldName, assignedName);
                                    return { ...c, code: astToString(renamed) };
                                } catch {
                                    return c;
                                }
                            }
                            if (c.id === id) {
                                return { ...c, varName: assignedName };
                            }
                            return c;
                        });
                    }
                }

                updatedCells = updatedCells.map((cell) =>
                    cell.id === id
                        ? { ...cell, result: success ? result : null, error: success ? null : error, type: success ? type : null }
                        : cell
                );

                // Update references for this cell based on its code
                const cell = updatedCells.find(c => c.id === id);
                let updatedRefs = { ...state.references };
                if (cell && success) {
                    updatedRefs = rebuildReferences(updatedCells);
                }

                return { cells: updatedCells, references: updatedRefs };
            });
        };

        set({ worker });
    },

    addCell: (index?: number, cellType: 'code' | 'markdown' = 'code') => {
        const id = Math.random().toString(36).substr(2, 9);
        const varName = generateVarName();
        const newCell: Cell = { id, varName, code: '', result: null, error: null, type: null, cellType };

        set((state) => {
            const newCells = [...state.cells];
            if (index !== undefined && index >= 0 && index <= newCells.length) {
                newCells.splice(index, 0, newCell);
            } else {
                newCells.push(newCell);
            }
            return { cells: newCells, activeCellId: id }; // focus new cell
        });
    },

    updateCellCode: (id, code) => {
        set((state) => ({
            cells: state.cells.map((cell) =>
                cell.id === id ? { ...cell, code } : cell
            ),
        }));
    },

    updateCellVarName: (id, newName) => {
        const state = get();
        const cell = state.cells.find(c => c.id === id);
        if (!cell) return { success: false, error: 'Cell not found' };

        const oldName = cell.varName;
        if (oldName === newName) return { success: true };

        // Validation
        if (!isValidIdentifier(newName)) {
            return { success: false, error: `'${newName}' is not a valid identifier` };
        }
        if (RESERVED_WORDS.has(newName)) {
            return { success: false, error: `'${newName}' is a reserved word` };
        }
        if (state.cells.some(c => c.id !== id && c.varName === newName)) {
            return { success: false, error: `'${newName}' is already in use` };
        }

        // Structural rename: parse → tree-walk → toString for all referencing cells
        const referencingCellIds = state.references[oldName] || [];
        const updatedCells = state.cells.map(c => {
            // Unparsed markdown cells obviously shouldn't have math expressions structurally renamed
            if (c.cellType === 'code' && referencingCellIds.includes(c.id)) {
                try {
                    const ast = Parser.parse(c.code);
                    const renamed = astRenameIdentifier(ast, oldName, newName);
                    return { ...c, code: astToString(renamed) };
                } catch {
                    return c;
                }
            }
            if (c.id === id) {
                return { ...c, varName: newName };
            }
            return c;
        });

        // Also update the cell's own varName
        const finalCells = updatedCells.map(c =>
            c.id === id ? { ...c, varName: newName } : c
        );

        const newRefs = rebuildReferences(finalCells);
        set({ cells: finalCells, references: newRefs });
        return { success: true };
    },

    runCell: (id) => {
        const state = get();
        const cell = state.cells.find((c) => c.id === id);
        if (cell && cell.cellType === 'code' && state.worker) {
            // Collect bindings from all other code cells that have been evaluated
            const bindings = state.cells
                .filter(c => c.id !== id && c.cellType === 'code' && c.result !== null && c.type !== null)
                .map(c => ({
                    varName: c.varName,
                    value: c.result!,
                    type: c.type!,
                }));

            state.worker.postMessage({ id, text: cell.code, bindings });
        }
    },

    removeCell: (id) => {
        const state = get();
        const cell = state.cells.find(c => c.id === id);
        if (!cell) return { success: false, error: 'Cell not found' };

        // Check if any other cell references this cell's varName (only matters if code)
        if (cell.cellType === 'code') {
            const refs = state.references[cell.varName] || [];
            const externalRefs = refs.filter(refId => refId !== id);
            if (externalRefs.length > 0) {
                const refCells = externalRefs
                    .map(refId => state.cells.find(c => c.id === refId))
                    .filter(Boolean)
                    .map(c => c!.varName);
                return {
                    success: false,
                    error: `Cannot delete: referenced by ${refCells.join(', ')}`
                };
            }
        }

        const remainingCells = state.cells.filter((c) => c.id !== id);
        const newRefs = rebuildReferences(remainingCells);

        let newActiveId = state.activeCellId;
        if (newActiveId === id) {
            newActiveId = null;
        }

        set({ cells: remainingCells, references: newRefs, activeCellId: newActiveId });
        return { success: true };
    },

    moveCell: (id, direction) => {
        set((state) => {
            const index = state.cells.findIndex(c => c.id === id);
            if (index < 0) return {};
            if (direction === 'up' && index === 0) return {};
            if (direction === 'down' && index === state.cells.length - 1) return {};

            const newCells = [...state.cells];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;

            const temp = newCells[index];
            newCells[index] = newCells[swapIndex];
            newCells[swapIndex] = temp;

            return { cells: newCells };
        });
    },

    runAll: () => {
        const state = get();
        state.cells.forEach(cell => {
            if (cell.cellType === 'code') {
                state.runCell(cell.id);
            }
        });
    },

    setActiveCell: (id: string | null) => {
        set({ activeCellId: id });
    },

    toggleCollapse: (headerId: string) => {
        set((state) => ({
            expandedGroups: {
                ...state.expandedGroups,
                [headerId]: !state.expandedGroups[headerId]
            }
        }));
    },

    focusNextCell: (currentId: string, fallbackType: 'code' | 'markdown') => {
        const state = get();
        const currentIndex = state.cells.findIndex(c => c.id === currentId);

        if (currentIndex !== -1 && currentIndex < state.cells.length - 1) {
            // There is a cell below
            const nextCell = state.cells[currentIndex + 1];
            set((s) => ({ activeCellId: nextCell.id, focusTrigger: s.focusTrigger + 1 }));
        } else {
            // No cell below, create a new one
            // addCell automatically changes activeCellId but we need to increment the trigger here too
            state.addCell(state.cells.length, fallbackType);
            set((s) => ({ focusTrigger: s.focusTrigger + 1 }));
        }
    },
}));

/**
 * Rebuild the full reference map by parsing all cells and collecting identifiers.
 */
function rebuildReferences(cells: Cell[]): Record<string, string[]> {
    const refs: Record<string, string[]> = {};
    const varNames = new Set(cells.filter(c => c.cellType === 'code').map(c => c.varName));

    for (const cell of cells) {
        if (cell.cellType !== 'code') continue;
        if (!cell.code.trim()) continue;

        try {
            const ast = Parser.parse(cell.code);
            const ids = astCollectIdentifiers(ast);
            for (const id of ids) {
                // Only track references to known code cell varNames
                if (varNames.has(id)) {
                    if (!refs[id]) refs[id] = [];
                    if (!refs[id].includes(cell.id)) {
                        refs[id].push(cell.id);
                    }
                }
            }
        } catch {
            // If parsing fails, skip this cell
        }
    }

    return refs;
}
