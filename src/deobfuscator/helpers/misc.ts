import * as t from '@babel/types';
import traverse from '@babel/traverse';

/**
 * Copies an expression.
 * @param expression The expression.
 * @returns The copy.
 */
export const copyExpression = (expression: t.Expression): t.Expression => {
    return t.cloneNode(expression, /* deep */ true);
};

/**
 * Counts the number of nodes contained within a node.
 * @param node The node.
 * @returns The number of nodes.
 */
export const countNodes = (node: t.Node): number => {
    let count = 0;
    traverse(node, {
        enter() {
            count++;
        },
        noScope: true
    });
    return count;
};

/**
 * Sets a property on an object.
 * @param obj The object.
 * @param property The property key.
 * @param value The value.
 */
export const setProperty = (obj: any, property: string, value: any): void => {
    (obj as Record<string, any>)[property] = value;
};

/**
 * Gets the value of a property on an object.
 * @param obj The object.
 * @param property The property key.
 * @returns
 */
export const getProperty = (obj: any, property: string): any => {
    return (obj as Record<string, any>)[property];
};
