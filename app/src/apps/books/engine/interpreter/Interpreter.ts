import { Environment } from './Environment';
import { MathType } from '../types/MathType';
import { MathNumber } from '../types/MathNumber';
import { MathTuple } from '../types/MathTuple';
import { MathFunction } from '../types/MathFunction';
import { MathString } from '../types/MathString';
import { MathList } from '../types/MathList';
import { MathDict } from '../types/MathDict';
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
} from '../parser/ASTNodes';

export class Interpreter {
    private global: Environment;

    constructor(globalEnv: Environment) {
        this.global = globalEnv;
    }

    evaluate(node: ASTNode, env: Environment = this.global): MathType {
        switch (node.type) {
            case ASTNodeType.NumberLiteral:
                return new MathNumber((node as NumberLiteralNode).value);

            case ASTNodeType.StringLiteral:
                return new MathString((node as StringLiteralNode).value);

            case ASTNodeType.ListLiteral:
                return new MathList((node as ListLiteralNode).elements.map(el => this.evaluate(el, env)));

            case ASTNodeType.DictLiteral: {
                const entries = new Map<string, MathType>();
                const dictNode = node as DictLiteralNode;
                for (const pair of dictNode.pairs) {
                    entries.set(pair.key, this.evaluate(pair.value, env));
                }
                return new MathDict(entries);
            }

            case ASTNodeType.TupleLiteral:
                return this.evaluateTupleLiteral(node as TupleLiteralNode, env);

            case ASTNodeType.Identifier:
                return env.get((node as IdentifierNode).name);

            case ASTNodeType.BinaryExpression:
                return this.evaluateBinaryExpression(node as BinaryExpressionNode, env);

            case ASTNodeType.FunctionCall:
                return this.evaluateFunctionCall(node as FunctionCallNode, env);

            case ASTNodeType.FuncExpression:
                return this.evaluateFuncExpression(node as FuncExpressionNode);

            case ASTNodeType.Assignment:
                return this.evaluateAssignment(node as AssignmentNode, env);

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    private evaluateTupleLiteral(node: TupleLiteralNode, env: Environment): MathType {
        const elements = node.elements.map(el => this.evaluate(el, env));
        return new MathTuple(elements);
    }

    private evaluateBinaryExpression(node: BinaryExpressionNode, env: Environment): MathType {
        const left = this.evaluate(node.left, env);
        const right = this.evaluate(node.right, env);

        switch (node.operator) {
            case '+': return this.executeAdd(left, right);
            case '-': return left.subtract(right);
            case '*': return left.multiply(right);
            case '/': return left.divide(right);
            case '^': return left.power(right);
            default:
                throw new Error(`Unknown operator: ${node.operator}`);
        }
    }

    private executeAdd(left: MathType, right: MathType): MathType {
        if (left instanceof MathNumber && right instanceof MathNumber) {
            return left.add(right);
        }
        if (left instanceof MathTuple && right instanceof MathTuple) {
            return left.add(right);
        }
        throw new Error(`Incompatible types for + operator: ${left.type} and ${right.type}`);
    }

    private evaluateFunctionCall(node: FunctionCallNode, env: Environment): MathType {
        const fn = env.get(node.callee);

        if (!(fn instanceof MathFunction)) {
            throw new Error(`'${node.callee}' is not a function`);
        }

        const args = node.args.map(arg => this.evaluate(arg, env));

        if (fn.isNative && fn.callback) {
            return fn.callback(...args);
        }

        if (fn.params.length !== node.args.length) {
            throw new Error(`Function '${node.callee}' expects ${fn.params.length} arguments, but got ${node.args.length}`);
        }

        // Create isolated local scope for the function execution
        const localEnv = new Environment(this.global);
        fn.params.forEach((param, i) => {
            localEnv.define(param, args[i]);
        });

        return this.evaluate(fn.body!, localEnv);
    }

    private evaluateAssignment(node: AssignmentNode, env: Environment): MathType {
        const BUILT_INS = new Set([
            'pi', 'e', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
            'sqrt', 'log', 'exp', 'abs', 'round', 'ceil', 'floor', 
            'pow', 'min', 'max', 'tuple'
        ]);
        if (BUILT_INS.has(node.name)) {
            throw new Error(`Cannot reassign built-in '${node.name}'`);
        }

        const val = this.evaluate(node.value, env);
        env.define(node.name, val);
        return val;
    }

    /**
     * Evaluate a func expression → produces a MathFunction (anonymous).
     * The cell's varName provides the external name.
     */
    private evaluateFuncExpression(node: FuncExpressionNode): MathFunction {
        return new MathFunction(node.params, node.body);
    }
}
