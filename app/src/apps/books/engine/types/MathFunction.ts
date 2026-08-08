import { MathType, MathTypeName } from './MathType';
import type { ASTNode } from '../parser/ASTNodes';
import { astToString } from '../parser/ASTNodes';
import { Parser } from '../parser/Parser';

export class MathFunction extends MathType {
    readonly type = MathTypeName.Function;
    readonly value: null = null;
    readonly params: string[];
    readonly body: ASTNode | null;
    readonly isNative: boolean;
    readonly callback?: (...args: MathType[]) => MathType;

    constructor(params: string[], bodyOrCallback: ASTNode | ((...args: MathType[]) => MathType)) {
        super();
        this.params = params;
        if (typeof bodyOrCallback === 'function') {
            this.body = null;
            this.isNative = true;
            this.callback = bodyOrCallback;
        } else {
            this.body = bodyOrCallback;
            this.isNative = false;
        }
    }

    toString(): string {
        if (this.isNative) {
            return `lambda(${this.params.join(', ')}): <native>`;
        }
        return `lambda(${this.params.join(', ')}): ${this.body ? astToString(this.body) : ''}`;
    }

    /**
     * Parse a func expression string back into a MathFunction.
     * Expects the full "func(x, y): body" string.
     */
    static parse(code: string): MathFunction {
        const ast = Parser.parse(code);
        if (ast.type !== 'FuncExpression') {
            throw new Error('Expected a func expression');
        }
        const fn = ast as unknown as { params: string[]; body: ASTNode };
        return new MathFunction(fn.params, fn.body);
    }
}
