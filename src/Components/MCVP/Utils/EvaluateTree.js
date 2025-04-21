/**
 * @fileoverview Provides a function to evaluate MCVP expression trees.
 */

/**
 * Evaluates an MCVP expression tree.
 * 
 * @param {Object} node - The root node of the tree to evaluate
 * @param {string} node.value - The node value ('A' for AND, 'O' for OR, or variable name)
 * @param {string} node.type - Type of node ('operation' or 'variable')
 * @param {number|null} node.varValue - For variables, their value (0 or 1)
 * @param {Object|null} node.left - Left child node
 * @param {Object|null} node.right - Right child node
 * @returns {number|null} The result of evaluating the tree (1 or 0), or null if tree is incomplete
 * @throws {Error} If an unknown operator is encountered
 */
export function evaluateTree(node) {  
    if (!node) {
      return null;
    }
  
    // If it's a variable node, return its value directly.
    if (node.type === "variable") {
      return node.varValue !== undefined ? node.varValue : null;
    }
  
    // Evaluate children.
    let leftValue = node.left ? evaluateTree(node.left) : null;
    let rightValue = node.right ? evaluateTree(node.right) : null;
  
    // If exactly one child exists, use that child's value for both operands.
    if (leftValue === null && rightValue !== null) {
      // Only use right value if left node isn't an operation node
      leftValue = (node.left === null || node.left.type !== "operation") ? rightValue : null;
    } else if (rightValue === null && leftValue !== null) {
      // Only use left value if right node isn't an operation node
      rightValue = (node.right === null || node.right.type !== "operation") ? leftValue : null;
    }
  
    // If both operands are still null, the tree is incomplete.
    if (leftValue === null || rightValue === null) {
      return null;
    }
  
    // Apply the operator at this node.
    if (node.value === 'A') {
      // AND operation - correctly convert to binary result
      const result = leftValue && rightValue ? 1 : 0;
      console.log("AND:", leftValue, rightValue, "->", result);
      return result;
    } else if (node.value === 'O') {
      // OR operation - correctly convert to binary result
      const result = leftValue || rightValue ? 1 : 0;
      console.log("OR:", leftValue, rightValue, "->", result);
      return result;
    } else {
      console.error(`Neznámý operátor: ${node.value}`);
      throw new Error(`Neznámý operátor: ${node.value}`);
    }
}