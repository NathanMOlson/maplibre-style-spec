import {NumberType} from '../types';

import {findStopLessThanOrEqualTo} from '../stops';

import type {Stops} from '../stops';
import type {Expression} from '../expression';
import type {ParsingContext} from '../parsing_context';
import type {EvaluationContext} from '../evaluation_context';
import type {Type} from '../types';

export class Step implements Expression {
    type: Type;

    input: Expression;
    labels: Array<number>;
    outputs: Array<Expression>;

    constructor(type: Type, input: Expression, stops: Stops) {
        this.type = type;
        this.input = input;

        this.labels = [];
        this.outputs = [];
        for (const [label, expression] of stops) {
            this.labels.push(label);
            this.outputs.push(expression);
        }
    }

    static parse(args: ReadonlyArray<unknown>, context: ParsingContext): Expression {
        if (args.length - 1 < 4) {
            return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`) as null;
        }

        if ((args.length - 1) % 2 !== 0) {
            return context.error('Expected an even number of arguments.') as null;
        }

        const input = context.parse(args[1], 1, NumberType);
        if (!input) return null;

        const stops: Stops = [];

        let outputType: Type = null;
        if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }

        for (let i = 1; i < args.length; i += 2) {
            const label = i === 1 ? -Infinity : args[i];
            const value = args[i + 1];

            const labelKey = i;
            const valueKey = i + 1;

            if (typeof label !== 'number') {
                return context.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey) as null;
            }

            if (stops.length && stops[stops.length - 1][0] >= label) {
                return context.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.', labelKey) as null;
            }

            const parsed = context.parse(value, valueKey, outputType);
            if (!parsed) return null;
            outputType = outputType || parsed.type;
            stops.push([label, parsed]);
        }

        return new Step(outputType, input, stops);
    }

    evaluate(ctx: EvaluationContext) {
        const labels = this.labels;
        const outputs = this.outputs;

        if (labels.length === 1) {
            return outputs[0].evaluate(ctx);
        }

        const value = (this.input.evaluate(ctx) as any as number);
        if (value <= labels[0]) {
            return outputs[0].evaluate(ctx);
        }

        const stopCount = labels.length;
        if (value >= labels[stopCount - 1]) {
            return outputs[stopCount - 1].evaluate(ctx);
        }

        const index = findStopLessThanOrEqualTo(labels, value);
        return outputs[index].evaluate(ctx);
    }

    eachChild(fn: (_: Expression) => void) {
        fn(this.input);
        for (const expression of this.outputs) {
            fn(expression);
        }
    }

    outputDefined(): boolean {
        return this.outputs.every(out => out.outputDefined());
    }
}

