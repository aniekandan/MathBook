import { Lexer } from './lexer/Lexer';
import { Parser } from './parser/Parser';
import { Interpreter } from './interpreter/Interpreter';
import { Environment } from './interpreter/Environment';
import { MathNumber } from './types/MathNumber';
import { MathTuple } from './types/MathTuple';
import { MathFunction } from './types/MathFunction';
import type { MathType } from './types/MathType';

/**
 * Binding from the UI store: represents another cell's evaluated result.
 */
interface CellBinding {
    varName: string;
    value: string;  // toString() representation
    type: string;   // 'Number' | 'Tuple' | 'Function'
}

/**
 * Deserialize a binding back into a MathType instance.
 */
function deserializeBinding(binding: CellBinding): MathType {
    switch (binding.type) {
        case 'Number':
            return MathNumber.parse(binding.value);
        case 'Tuple':
            return MathTuple.parse(binding.value);
        case 'Function':
            return MathFunction.parse(binding.value);
        default:
            throw new Error(`Unknown binding type: ${binding.type}`);
    }
}

function createVectorizedFunction(name: string, fn: (...args: number[]) => number, expectedArgCount: number = 1): MathFunction {
    const params = Array.from({ length: expectedArgCount }, (_, i) => `x${i}`);
    return new MathFunction(params, (...args: MathType[]): MathType => {
        if (args.length !== expectedArgCount) {
            throw new Error(`Function '${name}' expects ${expectedArgCount} arguments, but got ${args.length}`);
        }

        // Check if any argument is a Tuple
        const hasTuple = args.some(arg => arg instanceof MathTuple);
        if (hasTuple) {
            // Find the maximum length among any Tuple arguments
            let maxLen = 1;
            for (const arg of args) {
                if (arg instanceof MathTuple) {
                    maxLen = Math.max(maxLen, arg.elements.length);
                }
            }

            const resultElements: number[] = [];
            for (let i = 0; i < maxLen; i++) {
                const currentNumArgs: number[] = [];
                for (const arg of args) {
                    if (arg instanceof MathTuple) {
                        currentNumArgs.push(arg.elements[i % arg.elements.length]);
                    } else if (arg instanceof MathNumber) {
                        currentNumArgs.push(arg.value);
                    } else {
                        throw new Error(`Arguments to '${name}' must be Number or Tuple`);
                    }
                }
                resultElements.push(fn(...currentNumArgs));
            }
            return new MathTuple(resultElements);
        } else {
            // All arguments must be Numbers
            const numArgs: number[] = [];
            for (const arg of args) {
                if (arg instanceof MathNumber) {
                    numArgs.push(arg.value);
                } else {
                    throw new Error(`Arguments to '${name}' must be Number or Tuple`);
                }
            }
            return new MathNumber(fn(...numArgs));
        }
    });
}

function registerBuiltIns(env: Environment): void {
    // Constants
    env.define('pi', new MathNumber(Math.PI));
    env.define('e', new MathNumber(Math.E));

    // Functions
    const unaryFunctions: Record<string, (v: number) => number> = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        sqrt: Math.sqrt,
        log: Math.log,
        exp: Math.exp,
        abs: Math.abs,
        round: Math.round,
        ceil: Math.ceil,
        floor: Math.floor,
    };

    const binaryFunctions: Record<string, (a: number, b: number) => number> = {
        pow: Math.pow,
        min: Math.min,
        max: Math.max,
    };

    for (const [name, fn] of Object.entries(unaryFunctions)) {
        env.define(name, createVectorizedFunction(name, fn, 1));
    }

    for (const [name, fn] of Object.entries(binaryFunctions)) {
        env.define(name, createVectorizedFunction(name, fn, 2));
    }
}

self.onmessage = (event: MessageEvent) => {
    const { id, text, bindings } = event.data as {
        id: string;
        text: string;
        bindings: CellBinding[];
    };

    try {
        // Build a fresh environment from the provided bindings
        const env = new Environment();
        registerBuiltIns(env);
        for (const binding of bindings) {
            try {
                const value = deserializeBinding(binding);
                env.define(binding.varName, value);
            } catch {
                // Skip bindings that fail to deserialize
            }
        }

        // Lex → Parse → Interpret
        const lexer = new Lexer(text);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const interpreter = new Interpreter(env);
        const result = interpreter.evaluate(ast);

        let assignedName: string | undefined = undefined;
        if (ast.type === 'Assignment') {
            assignedName = (ast as any).name;
        }

        self.postMessage({
            id,
            success: true,
            result: result.toString(),
            type: result.type,
            assignedName
        });
    } catch (error: any) {
        self.postMessage({
            id,
            success: false,
            error: error.message
        });
    }
};
