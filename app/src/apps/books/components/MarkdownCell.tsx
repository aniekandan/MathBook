import { type FC, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeMirror from '@uiw/react-codemirror';
import { AlertCircle, CheckCircle, Info, Flame, Lightbulb } from 'lucide-react';
import { useNotebookStore, type Cell } from '../store/useNotebookStore';

interface MarkdownCellProps {
    cell: Cell;
    isEditing: boolean;
    onEditEnd: () => void;
    onEditStart: () => void;
}

// Helper to style GitHub admonitions in blockquotes
const CustomBlockquote: FC<{ children?: any }> = ({ children }) => {
    // We need to inspect the text content to see if it starts with [!NOTE], etc.
    let isAdmonition = false;
    let admonitionType = '';
    let content = children;

    // ReactMarkdown passes children as an array if there are multiple paragraphs
    const firstChild = Array.isArray(children) ? children[0] : children;

    if (firstChild?.props?.children) {
        const textNodes = Array.isArray(firstChild.props.children)
            ? firstChild.props.children
            : [firstChild.props.children];

        if (typeof textNodes[0] === 'string') {
            const text = textNodes[0];
            const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
            if (match) {
                isAdmonition = true;
                admonitionType = match[1].toLowerCase();

                // Strip the [!TYPE] tag from the output
                const clonedFirstChild = {
                    ...firstChild,
                    props: {
                        ...firstChild.props,
                        children: [
                            text.substring(match[0].length).trimStart(),
                            ...textNodes.slice(1)
                        ]
                    }
                };

                content = Array.isArray(children)
                    ? [clonedFirstChild, ...children.slice(1)]
                    : clonedFirstChild;
            }
        }
    }

    if (!isAdmonition) {
        return (
            <blockquote className="border-l-4 border-slate-200 pl-4 py-1 my-4 text-slate-600 italic">
                {children}
            </blockquote>
        );
    }

    const admonitionConfigs: Record<string, any> = {
        note: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-400', icon: <Info className="w-5 h-5 flex-shrink-0" />, title: 'Note' },
        tip: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-400', icon: <Lightbulb className="w-5 h-5 flex-shrink-0" />, title: 'Tip' },
        important: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400', icon: <CheckCircle className="w-5 h-5 flex-shrink-0" />, title: 'Important' },
        warning: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-400', icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />, title: 'Warning' },
        caution: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-400', icon: <Flame className="w-5 h-5 flex-shrink-0" />, title: 'Caution' },
    };

    const config = admonitionConfigs[admonitionType] || admonitionConfigs['note'];

    return (
        <div className={`my-4 border-l-4 ${config.border} ${config.bg} rounded-r-lg p-4`}>
            <div className={`flex items-center gap-2 font-bold mb-2 ${config.color}`}>
                {config.icon}
                <span>{config.title}</span>
            </div>
            <div className="text-slate-700 leading-relaxed text-sm [&>p]:mb-2 last:[&>p]:mb-0">
                {content}
            </div>
        </div>
    );
};

export const MarkdownCell: FC<MarkdownCellProps> = ({ cell, isEditing, onEditEnd, onEditStart }) => {
    const updateCellCode = useNotebookStore((state: any) => state.updateCellCode);
    const focusNextCell = useNotebookStore((state: any) => state.focusNextCell);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside to end edit mode
    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onEditEnd();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing, onEditEnd]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            onEditEnd();
            focusNextCell(cell.id, 'markdown');
        }
    };

    if (isEditing) {
        return (
            <div
                ref={containerRef}
                className="px-4 py-3 bg-slate-50 border border-cyan-300 rounded-lg shadow-inner ring-4 ring-cyan-50"
                onKeyDownCapture={handleKeyDown}
            >
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-cyan-600 uppercase tracking-wider">
                    Markdown Editing
                </div>
                <CodeMirror
                    value={cell.code}
                    onChange={(val) => updateCellCode(cell.id, val)}
                    placeholder="Type markdown here... (e.g. # Header, **bold**, > [!NOTE])"
                    autoFocus
                    basicSetup={{
                        lineNumbers: false,
                        foldGutter: false,
                        highlightActiveLine: false,
                    }}
                    className="text-base font-sans [&_.cm-editor]:bg-transparent [&_.cm-editor.cm-focused]:outline-none"
                />
            </div>
        );
    }

    const handleViewKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusNextCell(cell.id, 'markdown');
        }
    };

    if (!cell.code.trim()) {
        return (
            <div
                className="px-8 py-6 text-slate-400 italic font-medium cursor-text hover:bg-slate-50 rounded-lg transition-colors"
                onDoubleClick={onEditStart}
                onKeyDown={handleViewKeyDown}
                tabIndex={0}
            >
                Double-click to edit markdown...
            </div>
        );
    }

    return (
        <div
            className="px-8 py-6 cursor-text"
            onDoubleClick={onEditStart}
            onKeyDown={handleViewKeyDown}
            tabIndex={0}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    blockquote: CustomBlockquote,
                    // Style basic tags
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-slate-800 border-b pb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-slate-800">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2 text-slate-800">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700">{children}</p>,
                    a: ({ children, href }) => <a href={href} className="text-cyan-600 hover:underline">{children}</a>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-slate-700 space-y-1">{children}</ol>,
                    code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !className?.includes('language-');
                        return isInline
                            ? <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600" {...props}>{children}</code>
                            : <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto mb-4 font-mono text-sm"><code className={className} {...props}>{children}</code></pre>;
                    },
                    table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="min-w-full border-collapse border border-slate-200">{children}</table></div>,
                    th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-4 py-2 text-left font-bold text-slate-700">{children}</th>,
                    td: ({ children }) => <td className="border border-slate-200 px-4 py-2 text-slate-700">{children}</td>,
                }}
            >
                {cell.code}
            </ReactMarkdown>
        </div>
    );
};
