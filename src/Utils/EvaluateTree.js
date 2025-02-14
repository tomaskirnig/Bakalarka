import { Node } from "./NodeClass";

export function evaluateTree(node) {  
    if (!node) {
      return null;
    }
  
    // If it's a variable node, return its value directly.
    if (node.type === "variable") {
      return node.varValue;
    }
  
    // Evaluate children.
    let leftValue = node.left ? evaluateTree(node.left) : null;
    let rightValue = node.right ? evaluateTree(node.right) : null;
  
    // If exactly one child exists, use that child's value for both operands.
    if (leftValue === null && rightValue !== null) {
      if (node.left === null && node.left.type === "operation") leftValue = null;
      else leftValue = rightValue;
    } else if (rightValue === null && leftValue !== null) {
      if (node.right === null && node.left.type === "operation") rightValue = null;
      else rightValue = leftValue;
    }
  
    // If both operands are still null, the tree is incomplete.
    if (leftValue === null || rightValue === null) {
      return null;
    }
  
    // Apply the operator at this node.
    if (node.value === 'A') {
      // AND operation.
      const result = leftValue && rightValue;
      // console.log("AND:", leftValue, rightValue, "->", result);
      return result;
    } else if (node.value === 'O') {
      // OR operation.
      const result = leftValue || rightValue;
      // console.log("OR:", leftValue, rightValue, "->", result);
      return result;
    } else {
      throw new Error(`Unknown operator: ${node.value}`);
    }
  }