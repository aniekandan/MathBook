export const ASTNodeType = {
    NumberLiteral: 'NumberLiteral',
    Identifier: 'Identifier',
    BinaryExpression: 'BinaryExpression',
    FunctionCall: 'FunctionCall',
    TupleLiteral: 'TupleLiteral',
    FuncExpression: 'FuncExpression',
    Assignment: 'Assignment',
    StringLiteral: 'StringLiteral',
    ListLiteral: 'ListLiteral',
    DictLiteral: 'DictLiteral',
} as const;

export type ASTNodeType = (typeof ASTNodeType)[keyof typeof ASTNodeType];

export interface ASTNode {
    type: ASTNodeType;
}

export interface NumberLiteralNode extends ASTNode {
    type: typeof ASTNodeType.NumberLiteral;
    value: number;
}

export interface TupleLiteralNode extends ASTNode {
    type: typeof ASTNodeType.TupleLiteral;
    elements: ASTNode[];
}

export interface IdentifierNode extends ASTNode {
    type: typeof ASTNodeType.Identifier;
    name: string;
}

export interface BinaryExpressionNode extends ASTNode {
    type: typeof ASTNodeType.BinaryExpression;
    left: ASTNode;
    operator: string;
    right: ASTNode;
}

export interface FunctionCallNode extends ASTNode {
    type: typeof ASTNodeType.FunctionCall;
    callee: string;
    args: ASTNode[];
}

export interface FuncExpressionNode extends ASTNode {
    type: typeof ASTNodeType.FuncExpression;
    params: string[];
    body: ASTNode;
}

export interface AssignmentNode extends ASTNode {
    type: typeof ASTNodeType.Assignment;
    name: string;
    value: ASTNode;
}

export interface StringLiteralNode extends ASTNode {
    type: typeof ASTNodeType.StringLiteral;
    value: string;
}

export interface ListLiteralNode extends ASTNode {
    type: typeof ASTNodeType.ListLiteral;
    elements: ASTNode[];
}

export interface DictLiteralNode extends ASTNode {
    type: typeof ASTNodeType.DictLiteral;
    pairs: { key: string; value: ASTNode }[];
}

// --- Operator precedence for minimal-paren toString ---
const PRECEDENCE: Record<string, number> = {
    '+': 1, '-': 1,
    '*': 2, '/': 2,
    '^': 3,
};

/**
 * Serialize an AST node back to source code (toString half of the toString/parse contract).
 * Uses minimal parenthesization to preserve operator precedence.
 */
export function astToString(node: ASTNode): string {
    switch (node.type) {
        case ASTNodeType.NumberLiteral:
            return String((node as NumberLiteralNode).value);

        case ASTNodeType.Identifier:
            return (node as IdentifierNode).name;

        case ASTNodeType.BinaryExpression: {
            const bin = node as BinaryExpressionNode;
            const prec = PRECEDENCE[bin.operator] ?? 0;

            const leftStr = needsParens(bin.left, prec, 'left', bin.operator)
                ? `(${astToString(bin.left)})`
                : astToString(bin.left);

            const rightStr = needsParens(bin.right, prec, 'right', bin.operator)
                ? `(${astToString(bin.right)})`
                : astToString(bin.right);

            return `${leftStr} ${bin.operator} ${rightStr}`;
        }

        case ASTNodeType.FunctionCall: {
            const call = node as FunctionCallNode;
            const argsStr = call.args.map(a => astToString(a)).join(', ');
            return `${call.callee}(${argsStr})`;
        }

        case ASTNodeType.TupleLiteral: {
            const tup = node as TupleLiteralNode;
            const elemsStr = tup.elements.map(e => astToString(e)).join(', ');
            return `(${elemsStr})`;
        }

        case ASTNodeType.FuncExpression: {
            const fn = node as FuncExpressionNode;
            return `func(${fn.params.join(', ')}): ${astToString(fn.body)}`;
        }

        case ASTNodeType.StringLiteral:
            return `"${(node as StringLiteralNode).value}"`;

        case ASTNodeType.ListLiteral: {
            const list = node as ListLiteralNode;
            const elemsStr = list.elements.map(e => astToString(e)).join(', ');
            return `[${elemsStr}]`;
        }

        case ASTNodeType.DictLiteral: {
            const dict = node as DictLiteralNode;
            const pairsStr = dict.pairs.map(p => `"${p.key}": ${astToString(p.value)}`).join(', ');
            return `{${pairsStr}}`;
        }

        case ASTNodeType.Assignment: {
            const assign = node as AssignmentNode;
            return `${assign.name} = ${astToString(assign.value)}`;
        }

        default:
            return '<unknown>';
    }
}

/**
 * Determine whether a child node needs parentheses in the context of a parent binary expression.
 */
function needsParens(child: ASTNode, parentPrec: number, side: 'left' | 'right', parentOp: string): boolean {
    if (child.type !== ASTNodeType.BinaryExpression) return false;
    const childPrec = PRECEDENCE[(child as BinaryExpressionNode).operator] ?? 0;

    if (childPrec < parentPrec) return true;

    // Same precedence on the right side needs parens for left-associative ops (not ^)
    if (childPrec === parentPrec && side === 'right' && parentOp !== '^') return true;

    return false;
}

/**
 * Walk an AST tree and rename all Identifier nodes matching oldName to newName.
 * Returns a new tree (immutable).
 */
export function astRenameIdentifier(node: ASTNode, oldName: string, newName: string): ASTNode {
    switch (node.type) {
        case ASTNodeType.NumberLiteral:
            return node;

        case ASTNodeType.Identifier: {
            const id = node as IdentifierNode;
            if (id.name === oldName) {
                return { type: ASTNodeType.Identifier, name: newName } as IdentifierNode;
            }
            return node;
        }

        case ASTNodeType.BinaryExpression: {
            const bin = node as BinaryExpressionNode;
            return {
                type: ASTNodeType.BinaryExpression,
                left: astRenameIdentifier(bin.left, oldName, newName),
                operator: bin.operator,
                right: astRenameIdentifier(bin.right, oldName, newName),
            } as BinaryExpressionNode;
        }

        case ASTNodeType.FunctionCall: {
            const call = node as FunctionCallNode;
            return {
                type: ASTNodeType.FunctionCall,
                callee: call.callee === oldName ? newName : call.callee,
                args: call.args.map(a => astRenameIdentifier(a, oldName, newName)),
            } as FunctionCallNode;
        }

        case ASTNodeType.TupleLiteral: {
            const tup = node as TupleLiteralNode;
            return {
                type: ASTNodeType.TupleLiteral,
                elements: tup.elements.map(e => astRenameIdentifier(e, oldName, newName)),
            } as TupleLiteralNode;
        }

        case ASTNodeType.StringLiteral:
            return node;

        case ASTNodeType.ListLiteral: {
            const list = node as ListLiteralNode;
            return {
                type: ASTNodeType.ListLiteral,
                elements: list.elements.map(e => astRenameIdentifier(e, oldName, newName)),
            } as ListLiteralNode;
        }

        case ASTNodeType.DictLiteral: {
            const dict = node as DictLiteralNode;
            return {
                type: ASTNodeType.DictLiteral,
                pairs: dict.pairs.map(p => ({
                    key: p.key,
                    value: astRenameIdentifier(p.value, oldName, newName)
                })),
            } as DictLiteralNode;
        }

        case ASTNodeType.FuncExpression: {
            const fn = node as FuncExpressionNode;
            // Don't rename inside the body if the func's own params shadow the name
            if (fn.params.includes(oldName)) return node;
            return {
                type: ASTNodeType.FuncExpression,
                params: fn.params,
                body: astRenameIdentifier(fn.body, oldName, newName),
            } as FuncExpressionNode;
        }

        case ASTNodeType.Assignment: {
            const assign = node as AssignmentNode;
            return {
                type: typeof ASTNodeType.Assignment,
                name: assign.name === oldName ? newName : assign.name,
                value: astRenameIdentifier(assign.value, oldName, newName),
            } as AssignmentNode;
        }

        default:
            return node;
    }
}

/**
 * Collect all Identifier names referenced in an AST (for dependency tracking).
 */
export function astCollectIdentifiers(node: ASTNode): Set<string> {
    const result = new Set<string>();
    collectIdentifiersImpl(node, result);
    return result;
}

function collectIdentifiersImpl(node: ASTNode, result: Set<string>): void {
    switch (node.type) {
        case ASTNodeType.NumberLiteral:
            break;

        case ASTNodeType.Identifier:
            result.add((node as IdentifierNode).name);
            break;

        case ASTNodeType.BinaryExpression: {
            const bin = node as BinaryExpressionNode;
            collectIdentifiersImpl(bin.left, result);
            collectIdentifiersImpl(bin.right, result);
            break;
        }

        case ASTNodeType.FunctionCall: {
            const call = node as FunctionCallNode;
            result.add(call.callee);
            call.args.forEach(a => collectIdentifiersImpl(a, result));
            break;
        }

        case ASTNodeType.TupleLiteral: {
            const tup = node as TupleLiteralNode;
            tup.elements.forEach(e => collectIdentifiersImpl(e, result));
            break;
        }

        case ASTNodeType.StringLiteral:
            break;

        case ASTNodeType.ListLiteral: {
            const list = node as ListLiteralNode;
            list.elements.forEach(e => collectIdentifiersImpl(e, result));
            break;
        }

        case ASTNodeType.DictLiteral: {
            const dict = node as DictLiteralNode;
            dict.pairs.forEach(p => collectIdentifiersImpl(p.value, result));
            break;
        }

        case ASTNodeType.FuncExpression: {
            const fn = node as FuncExpressionNode;
            // Collect from body, but exclude the function's own parameter names
            const bodyIds = astCollectIdentifiers(fn.body);
            fn.params.forEach(p => bodyIds.delete(p));
            bodyIds.forEach(id => result.add(id));
            break;
        }

        case ASTNodeType.Assignment: {
            const assign = node as AssignmentNode;
            collectIdentifiersImpl(assign.value, result);
            break;
        }
    }
}
