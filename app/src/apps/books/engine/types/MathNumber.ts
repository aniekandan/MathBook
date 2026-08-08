import { MathType, MathTypeName } from './MathType';

export class MathNumber extends MathType {
    readonly value: number;
    readonly type = MathTypeName.Number;

    constructor(value: number) {
        super();
        this.value = value;
        if (!Number.isFinite(value)) {
            throw new Error('MathNumber must be a finite number');
        }
    }

    toString(): string {
        // Format to handle floating point inaccuracies as discussed
        return (Math.round(this.value * 1e10) / 1e10).toString();
    }

    add(other: MathType): MathType {
        if (other instanceof MathNumber) {
            return new MathNumber(this.value + other.value);
        }
        throw new Error(`Cannot add ${other.type} to Number`);
    }

    subtract(other: MathType): MathType {
        if (other instanceof MathNumber) {
            return new MathNumber(this.value - other.value);
        }
        throw new Error(`Cannot subtract ${other.type} from Number`);
    }

    multiply(other: MathType): MathType {
        if (other instanceof MathNumber) {
            return new MathNumber(this.value * other.value);
        }
        throw new Error(`Cannot multiply Number by ${other.type}`);
    }

    divide(other: MathType): MathType {
        if (other instanceof MathNumber) {
            if (other.value === 0) throw new Error('Division by zero');
            return new MathNumber(this.value / other.value);
        }
        throw new Error(`Cannot divide Number by ${other.type}`);
    }

    power(other: MathType): MathType {
        if (other instanceof MathNumber) {
            return new MathNumber(Math.pow(this.value, other.value));
        }
        throw new Error(`Cannot raise Number to power of ${other.type}`);
    }

    /**
     * Parse a numeric string back into a MathNumber.
     */
    static parse(str: string): MathNumber {
        const value = parseFloat(str);
        if (!Number.isFinite(value)) {
            throw new Error(`Cannot parse '${str}' as a number`);
        }
        return new MathNumber(value);
    }
}
