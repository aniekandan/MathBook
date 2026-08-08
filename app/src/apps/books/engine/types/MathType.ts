export const MathTypeName = {
    Number: 'Number',
    Tuple: 'Tuple',
    Function: 'Function',
    String: 'String',
    List: 'List',
    Dict: 'Dict',
} as const;

export type MathTypeName = (typeof MathTypeName)[keyof typeof MathTypeName];
export abstract class MathType {
    abstract readonly type: MathTypeName;
    abstract readonly value: any;

    abstract toString(): string;

    // These will throw by default, specific types will override them
    add(_other: MathType): MathType {
        throw new Error(`Addition not supported for type ${this.type}`);
    }

    subtract(_other: MathType): MathType {
        throw new Error(`Subtraction not supported for type ${this.type}`);
    }

    multiply(_other: MathType): MathType {
        throw new Error(`Multiplication not supported for type ${this.type}`);
    }

    divide(_other: MathType): MathType {
        throw new Error(`Division not supported for type ${this.type}`);
    }

    power(_other: MathType): MathType {
        throw new Error(`Power not supported for type ${this.type}`);
    }
}
