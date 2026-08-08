export const TokenType = {
    Number: 'Number',
    Identifier: 'Identifier',
    String: 'String',
    Plus: 'Plus',
    Minus: 'Minus',
    Star: 'Star',
    Slash: 'Slash',
    Caret: 'Caret',
    LParen: 'LParen',
    RParen: 'RParen',
    LBracket: 'LBracket',
    RBracket: 'RBracket',
    LBrace: 'LBrace',
    RBrace: 'RBrace',
    Comma: 'Comma',
    Colon: 'Colon',
    Equal: 'Equal',
    ColonEqual: 'ColonEqual',
    Func: 'Func',
    EOF: 'EOF',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

export class Lexer {
    private pos = 0;
    private input: string;

    constructor(input: string) {
        this.input = input;
    }

    private peek(): string | null {
        return this.pos < this.input.length ? this.input[this.pos] : null;
    }

    private advance(): string | null {
        return this.pos < this.input.length ? this.input[this.pos++] : null;
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.pos < this.input.length) {
            const char = this.peek();

            if (char === null) break;

            if (/\s/.test(char)) {
                this.advance();
                continue;
            }

            if (/[0-9]/.test(char)) {
                tokens.push(this.readNumber());
                continue;
            }

            if (/[a-zA-Z_]/.test(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            if (char === '"' || char === "'") {
                tokens.push(this.readString(char));
                continue;
            }

            switch (char) {
                case '+': tokens.push({ type: TokenType.Plus, value: this.advance()!, position: this.pos - 1 }); break;
                case '-': tokens.push({ type: TokenType.Minus, value: this.advance()!, position: this.pos - 1 }); break;
                case '*': tokens.push({ type: TokenType.Star, value: this.advance()!, position: this.pos - 1 }); break;
                case '/': tokens.push({ type: TokenType.Slash, value: this.advance()!, position: this.pos - 1 }); break;
                case '^': tokens.push({ type: TokenType.Caret, value: this.advance()!, position: this.pos - 1 }); break;
                case '(': tokens.push({ type: TokenType.LParen, value: this.advance()!, position: this.pos - 1 }); break;
                case ')': tokens.push({ type: TokenType.RParen, value: this.advance()!, position: this.pos - 1 }); break;
                case '[': tokens.push({ type: TokenType.LBracket, value: this.advance()!, position: this.pos - 1 }); break;
                case ']': tokens.push({ type: TokenType.RBracket, value: this.advance()!, position: this.pos - 1 }); break;
                case '{': tokens.push({ type: TokenType.LBrace, value: this.advance()!, position: this.pos - 1 }); break;
                case '}': tokens.push({ type: TokenType.RBrace, value: this.advance()!, position: this.pos - 1 }); break;
                case ',': tokens.push({ type: TokenType.Comma, value: this.advance()!, position: this.pos - 1 }); break;
                case ':': {
                    const start = this.pos;
                    this.advance(); // consume ':'
                    if (this.peek() === '=') {
                        this.advance(); // consume '='
                        tokens.push({ type: TokenType.ColonEqual, value: ':=', position: start });
                    } else {
                        tokens.push({ type: TokenType.Colon, value: ':', position: start });
                    }
                    break;
                }
                case '=': tokens.push({ type: TokenType.Equal, value: this.advance()!, position: this.pos - 1 }); break;
                default:
                    throw new Error(`Unexpected character '${char}' at position ${this.pos}`);
            }
        }

        tokens.push({ type: TokenType.EOF, value: '', position: this.pos });
        return tokens;
    }

    private readNumber(): Token {
        const start = this.pos;
        let value = '';
        while (this.peek() !== null && /[0-9.]/.test(this.peek()!)) {
            value += this.advance();
        }
        return { type: TokenType.Number, value, position: start };
    }

    private readIdentifier(): Token {
        const start = this.pos;
        let value = '';
        while (this.peek() !== null && /[a-zA-Z0-9_]/.test(this.peek()!)) {
            value += this.advance();
        }

        // Only 'func' is a keyword, not an identifier
        if (value === 'func') {
            return { type: TokenType.Func, value, position: start };
        }

        return { type: TokenType.Identifier, value, position: start };
    }

    private readString(quote: string): Token {
        const start = this.pos;
        this.advance(); // consume the opening quote
        let value = '';
        while (this.peek() !== null && this.peek() !== quote) {
            value += this.advance();
        }
        if (this.peek() === quote) {
            this.advance(); // consume the closing quote
        } else {
            throw new Error(`Unterminated string literal starting at position ${start}`);
        }
        return { type: TokenType.String, value, position: start };
    }
}
