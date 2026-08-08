import { MathType, MathTypeName } from './MathType';

export class MathString extends MathType {
    readonly type = MathTypeName.String;
    readonly val: string;

    constructor(val: string) {
        super();
        this.val = val;
    }

    get value(): string {
        return this.val;
    }

    toString(): string {
        return `"${this.val}"`;
    }
}
