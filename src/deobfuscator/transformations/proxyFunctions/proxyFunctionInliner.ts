import { LogFunction, Transformation, TransformationProperties } from '../transformation';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { findConstantVariable } from '../../helpers/variable';
import { ProxyFunctionExpression, ProxyFunctionVariable, isProxyFunctionExpression } from './proxyFunction';
import { getProperty, setProperty, countNodes } from '../../helpers/misc';

export class ProxyFunctionInliner extends Transformation {
    public static readonly properties: TransformationProperties = {
        key: 'proxyFunctionInlining',
        rebuildScopeTree: true
    };

    private static readonly MAX_CLONED_NODES = 10000;

    /**
     * Executes the transformation.
     * @param log The log function.
     * @returns Whether any changes were made.
     */
    public execute(log: LogFunction): boolean {
        const usages: [NodePath, ProxyFunctionVariable][] = [];
        let skipped = 0;
        let replacements = 0;

        traverse(this.ast, {
            enter(path) {
                const depth = path.getAncestry().length;
                setProperty(path, 'depth', depth);
                const variable = findConstantVariable<ProxyFunctionExpression>(path, isProxyFunctionExpression, true);
                if (!variable) {
                    return;
                }

                const proxyFunction = new ProxyFunctionVariable(variable);
                const calls = proxyFunction.getCalls();

                const expression = t.isExpression(variable.expression.body)
                    ? variable.expression.body
                    : variable.expression.body.body[0].argument || t.identifier('undefined');
                const size = countNodes(expression);

                log(
                    `Found proxy function ${variable.name} with size ${size} nodes and ${calls.length} call${
                        calls.length == 1 ? '' : 's'
                    }`
                );

                if (size * calls.length > ProxyFunctionInliner.MAX_CLONED_NODES) {
                    log(
                        `Skipping ${variable.name} as cloning would create ${size * calls.length} nodes`
                    );
                    skipped += calls.length;
                    return;
                }

                usages.push(...calls.map(p => [p, proxyFunction] as [NodePath, ProxyFunctionVariable]));
            }
        });

        // replace innermost proxy calls first
        usages.sort((a, b) => getProperty(b[0], 'depth') - getProperty(a[0], 'depth'));
        for (const [path, proxyFunction] of usages) {
            if (proxyFunction.replaceCall(path)) {
                this.setChanged();
                replacements++;
            }
        }

        log(
            `Replaced ${replacements} call${replacements == 1 ? '' : 's'}${
                skipped ? `, skipped ${skipped}` : ''
            }`
        );

        return this.hasChanged();
    }
}
