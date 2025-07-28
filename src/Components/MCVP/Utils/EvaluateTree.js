/**
 * @fileoverview Provides a function to evaluate MCVP expression trees.
 */
import { toast } from "react-toastify";
import { Node } from "./NodeClass";

/**
 * Evaluates an MCVP expression tree.
 * 
 * @param {Node} node - The root node of the tree to evaluate
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
  
    // Check if children array exists
    if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
      return null;
    }
  
    // Evaluate all children
    const childValues = [];
    for (const child of node.children) {
      if (child) {
        const childValue = evaluateTree(child);
        childValues.push(childValue);
      }
    }
  
    // Handle special case: if there's only one child
    if (childValues.length === 1) {
      return childValues[0]; // For single child, just propagate its value
    }
    
    // If any child couldn't be evaluated or there are no children, the tree is incomplete
    if (childValues.length === 0 || childValues.some(value => value === null)) {
      return null;
    }
  
    // Apply the operator at this node.
    if (node.value === 'A') {
      // AND operation - all children must be true
      const result = childValues.every(value => value === 1) ? 1 : 0;
      console.log(`AND: [${childValues.join(', ')}] -> ${result}`);
      return result;
    } else if (node.value === 'O') {
      // OR operation - at least one child must be true
      const result = childValues.some(value => value === 1) ? 1 : 0;
      console.log(`OR: [${childValues.join(', ')}] -> ${result}`);
      return result;
    } else {
      toast.error(`Neznámý operátor: ${node.value}`);
      throw new Error(`Neznámý operátor: ${node.value}`);
    }
}