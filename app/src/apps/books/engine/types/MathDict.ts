import { MathType, MathTypeName } from './MathType';

export class MathDict extends MathType {
    readonly type = MathTypeName.Dict;
    readonly entries: Map<string, MathType>;

    constructor(entries: Map<string, MathType>) {
        super();
        this.entries = entries;
    }

    get value(): Map<string, MathType> {
        return this.entries;
    }

    toString(): string {
        const pairs: string[] = [];
        this.entries.forEach((val, key) => {
            pairs.push(`"${key}": ${val.toString()}`);
        });
        return `{${pairs.join(', ')}}`;
    }
}
