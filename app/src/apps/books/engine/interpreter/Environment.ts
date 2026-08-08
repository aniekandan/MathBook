import { MathType } from '../types/MathType';

export class Environment {
    private values: Map<string, MathType> = new Map();
    private parent: Environment | null = null;

    constructor(parent: Environment | null = null) {
        this.parent = parent;
    }

    define(name: string, value: MathType): void {
        this.values.set(name, value);
    }

    get(name: string): MathType {
        if (this.values.has(name)) {
            return this.values.get(name)!;
        }

        if (this.parent) {
            return this.parent.get(name);
        }

        throw new Error(`Undefined variable '${name}'`);
    }

    assign(name: string, value: MathType): void {
        if (this.values.has(name)) {
            this.values.set(name, value);
            return;
        }

        if (this.parent) {
            this.parent.assign(name, value);
            return;
        }

        throw new Error(`Undefined variable '${name}'`);
    }
}
