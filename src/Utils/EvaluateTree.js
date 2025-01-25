import { Node } from "./NodeClass";

export function evaluateTree(node) {
    console.log("Evaluating tree");
    if (!node) {
        throw new Error("Node cannot be null");
    }

    // If it's a variable node, return its value directly
    if (node.varValue !== null) {
        return node.varValue;
    }

    // Handle cases where the node has only one child
    const leftValue = node.left ? evaluateTree(node.left) : null;
    const rightValue = node.right ? evaluateTree(node.right) : leftValue; // Use left value if right is null

    // Apply the operator at this node
    if (node.value === 'A') {
        // AND operation
        return (Boolean)(leftValue && rightValue); // Ensure boolean evaluation
    } else if (node.value === 'O') {
        // OR operation
        return (Boolean)(leftValue || rightValue); // Ensure boolean evaluation
    } else {
        throw new Error(`Unknown operator: ${node.value}`);
    }
}
