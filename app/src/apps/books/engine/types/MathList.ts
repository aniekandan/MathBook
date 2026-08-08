import { MathType, MathTypeName } from './MathType';

export class MathList extends MathType {
    readonly type = MathTypeName.List;
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
        return `[${formatted.join(', ')}]`;
    }
}
