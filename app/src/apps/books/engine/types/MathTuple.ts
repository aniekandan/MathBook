import { MathType, MathTypeName } from './MathType';
import { MathNumber } from './MathNumber';

export class MathTuple extends MathType {
    readonly type = MathTypeName.Tuple;
    readonly elements: MathType[];

    constructor(elements: MathType[]) {
        super();
        this.elements = elements;
    }

    get value(): MathType[] {
        return this.elements;
    }

    toString(): string {
        const formatted = this.elements.map(v => v.toString());
        return `(${formatted.join(', ')})`;
    }

    add(other: MathType): MathType {
        if (other instanceof MathTuple) {
            // Concatenation: tuple(1, 2) + tuple(3, 4) -> tuple(1, 2, 3, 4)
            return new MathTuple([...this.elements, ...other.elements]);
        }

        throw new Error(`Cannot add ${other.type} to Tuple.Only Tuple + Tuple concatenation is supported.`);
    }

    // subtract, multiply, divide, power are already inherited from MathType and will throw

    /**
     * Parse a tuple string like "(1, 2, 3)" back into a MathTuple.
     */
    static parse(str: string): MathTuple {
        // Strip outer parens: "(1, 2, 3)" → "1, 2, 3"
        const inner = str.replace(/^\(/, '').replace(/\)$/, '').trim();
        if (inner.length === 0) {
            return new MathTuple([]);
        }
        const elements = inner.split(',').map(s => {
            const v = parseFloat(s.trim());
            if (!Number.isFinite(v)) {
                throw new Error(`Cannot parse tuple element '${s.trim()}' as a number`);
            }
            return new MathNumber(v);
        });
        return new MathTuple(elements);
    }
}
