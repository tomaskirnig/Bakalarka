import { Node } from "./NodeClass";

export function evaluateTree(node) {
    if (!node) {
        throw new Error("Node cannot be null");
    }

    // If it's a variable node, return its value directly
    if (node.varValue !== null) {
        return node.varValue;
    }

    // Evaluate the left and right subtrees
    const leftValue = evaluateTree(node.left);
    const rightValue = evaluateTree(node.right);

    // Apply the operator at this node
    if (node.value === 'A') {
        // AND operation
        return leftValue && rightValue;
    } else if (node.value === 'O') {
        // OR operation
        return leftValue || rightValue;
    } else {
        throw new Error(`Unknown operator: ${node.value}`);
    }
}