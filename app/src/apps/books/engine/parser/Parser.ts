import { Lexer, type Token, TokenType } from '../lexer/Lexer';
import {
    type ASTNode,
    ASTNodeType,
    type NumberLiteralNode,
    type IdentifierNode,
    type BinaryExpressionNode,
    type FunctionCallNode,
    type TupleLiteralNode,
    type FuncExpressionNode,
    type AssignmentNode,
    type StringLiteralNode,
    type ListLiteralNode,
    type DictLiteralNode,
} from './ASTNodes';

export class Parser {
    private tokens: Token[];
    private current = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new Error(message);
    }

    parse(): ASTNode {
        const expr = this.assignment();
        if (!this.isAtEnd()) {
            throw new Error(`Unexpected token '${this.peek().value}'. Only single expressions are allowed.`);
        }
        return expr;
    }

    /**
     * Static convenience method: string → AST (the parse half of the toString/parse contract).
     */
    static parse(code: string): ASTNode {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        return parser.parse();
    }

    private assignment(): ASTNode {
        // Lookahead to check if this is an assignment
        if (this.check(TokenType.Identifier)) {
            // Case 1: var = expression
            if (this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === TokenType.Equal) {
                const nameToken = this.advance(); // consume Identifier
                this.advance(); // consume Equal
                const value = this.expression();
                return {
                    type: ASTNodeType.Assignment,
                    name: nameToken.value,
                    value
                } as AssignmentNode;
            }
        }

        return this.expression();
    }

    private expression(): ASTNode {
        return this.addition();
    }

    private addition(): ASTNode {
        let expr = this.multiplication();

        while (this.match(TokenType.Plus, TokenType.Minus)) {
            const operator = this.previous().value;
            const right = this.multiplication();
            expr = {
                type: ASTNodeType.BinaryExpression,
                left: expr,
                operator,
                right,
            } as BinaryExpressionNode;
        }

        return expr;
    }

    private multiplication(): ASTNode {
        let expr = this.power();

        while (this.match(TokenType.Star, TokenType.Slash)) {
            const operator = this.previous().value;
            const right = this.power();
            expr = {
                type: ASTNodeType.BinaryExpression,
                left: expr,
                operator,
                right,
            } as BinaryExpressionNode;
        }

        return expr;
    }

    private power(): ASTNode {
        let expr = this.unary();

        while (this.match(TokenType.Caret)) {
            const operator = '^';
            const right = this.power(); // Right associative
            expr = {
                type: ASTNodeType.BinaryExpression,
                left: expr,
                operator,
                right,
            } as BinaryExpressionNode;
        }

        return expr;
    }

    private unary(): ASTNode {
        if (this.match(TokenType.Minus)) {
            const operator = this.previous().value;
            const right = this.unary();
            return {
                type: ASTNodeType.BinaryExpression,
                left: { type: ASTNodeType.NumberLiteral, value: 0 } as NumberLiteralNode,
                operator,
                right,
            } as BinaryExpressionNode;
        }

        return this.primary();
    }

    private primary(): ASTNode {
        // Number literal
        if (this.match(TokenType.Number)) {
            return {
                type: ASTNodeType.NumberLiteral,
                value: parseFloat(this.previous().value),
            } as NumberLiteralNode;
        }

        // String literal
        if (this.match(TokenType.String)) {
            return {
                type: ASTNodeType.StringLiteral,
                value: this.previous().value,
            } as StringLiteralNode;
        }

        // func(x, y): body
        if (this.match(TokenType.Func)) {
            return this.parseFuncExpression();
        }

        // List literal: [1, 2, 3]
        if (this.match(TokenType.LBracket)) {
            const elements: ASTNode[] = [];
            if (!this.check(TokenType.RBracket)) {
                do {
                    elements.push(this.expression());
                } while (this.match(TokenType.Comma));
            }
            this.consume(TokenType.RBracket, "Expect ']' after list elements");
            return {
                type: ASTNodeType.ListLiteral,
                elements
            } as ListLiteralNode;
        }

        // Dict literal: { "key": 1, "key2": 2 } or { key: 1 }
        if (this.match(TokenType.LBrace)) {
            const pairs: { key: string; value: ASTNode }[] = [];
            if (!this.check(TokenType.RBrace)) {
                do {
                    let key = '';
                    if (this.match(TokenType.String)) {
                        key = this.previous().value;
                    } else if (this.match(TokenType.Identifier)) {
                        key = this.previous().value;
                    } else {
                        throw new Error(`Expect string or identifier as dictionary key at position ${this.peek().position}`);
                    }
                    this.consume(TokenType.Colon, "Expect ':' after key");
                    const value = this.expression();
                    pairs.push({ key, value });
                } while (this.match(TokenType.Comma));
            }
            this.consume(TokenType.RBrace, "Expect '}' after dictionary entries");
            return {
                type: ASTNodeType.DictLiteral,
                pairs
            } as DictLiteralNode;
        }

        // Identifier or function call
        if (this.match(TokenType.Identifier)) {
            const name = this.previous().value;

            if (this.match(TokenType.LParen)) {
                const args: ASTNode[] = [];
                if (!this.check(TokenType.RParen)) {
                    do {
                        args.push(this.expression());
                    } while (this.match(TokenType.Comma));
                }
                this.consume(TokenType.RParen, "Expect ')' after arguments");

                // Built-in tuple(1, 2) handling
                if (name === 'tuple') {
                    return {
                        type: ASTNodeType.TupleLiteral,
                        elements: args,
                    } as TupleLiteralNode;
                }

                return {
                    type: ASTNodeType.FunctionCall,
                    callee: name,
                    args,
                } as FunctionCallNode;
            }

            return {
                type: ASTNodeType.Identifier,
                name,
            } as IdentifierNode;
        }

        // Grouped expression or Tuple literal
        if (this.match(TokenType.LParen)) {
            if (this.match(TokenType.RParen)) {
                return {
                    type: ASTNodeType.TupleLiteral,
                    elements: []
                } as TupleLiteralNode;
            }
            const first = this.expression();
            if (this.match(TokenType.Comma)) {
                const elements = [first];
                if (!this.check(TokenType.RParen)) {
                    do {
                        elements.push(this.expression());
                    } while (this.match(TokenType.Comma));
                }
                this.consume(TokenType.RParen, "Expect ')' after tuple elements");
                return {
                    type: ASTNodeType.TupleLiteral,
                    elements
                } as TupleLiteralNode;
            } else {
                this.consume(TokenType.RParen, "Expect ')' after expression");
                return first;
            }
        }

        throw new Error(`Unexpected token '${this.peek().value}' at position ${this.peek().position}`);
    }

    /**
     * Parse: func(param1, param2, ...): body_expression
     * Called after the 'func' keyword has been consumed.
     */
    private parseFuncExpression(): ASTNode {
        this.consume(TokenType.LParen, "Expect '(' after 'func'");

        const params: string[] = [];
        if (!this.check(TokenType.RParen)) {
            do {
                const paramToken = this.consume(TokenType.Identifier, 'Expect parameter name');
                params.push(paramToken.value);
            } while (this.match(TokenType.Comma));
        }

        this.consume(TokenType.RParen, "Expect ')' after parameters");
        this.consume(TokenType.Colon, "Expect ':' after parameter list");

        const body = this.expression();

        return {
            type: ASTNodeType.FuncExpression,
            params,
            body,
        } as FuncExpressionNode;
    }
}
