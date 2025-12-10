/**
 * @fileoverview Provides a function to evaluate MCVP expression trees.
 */
import { toast } from "react-toastify";

/**
 * Evaluates an MCVP expression tree.
 * 
 * @param {Node} node - The root node of the tree to evaluate
 * @returns {number|null} The result of evaluating the tree (1 or 0), or null if tree is incomplete
 * @throws {Error} If an unknown operator is encountered
 */
export function evaluateTree(node, memo = new Map(), visiting = new Set()) {  
    if (!node) {
      return null;
    }

    // Check memoization cache
    if (memo.has(node.id)) {
        return memo.get(node.id);
    }

    // Cycle detection
    if (visiting.has(node.id)) {
        throw new Error(`Detekován cyklus v grafu u uzlu ${node.value} (ID: ${node.id})!`);
    }
    visiting.add(node.id);
  
    // If it's a variable node, return its value directly.
    if (node.type === "variable") {
      const val = node.varValue !== undefined ? node.varValue : null;
      visiting.delete(node.id);
      memo.set(node.id, val);
      return val;
    }
  
    // Check if children array exists
    if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
      visiting.delete(node.id);
      return null;
    }
  
    // Evaluate all children
    const childValues = [];
    for (const child of node.children) {
      if (child) {
        const childValue = evaluateTree(child, memo, visiting);
        childValues.push(childValue);
      }
    }
  
    // Handle special case: if there's only one child
    if (childValues.length === 1) {
      const res = childValues[0];
      visiting.delete(node.id);
      memo.set(node.id, res);
      return res; // For single child, just propagate its value
    }
    
    // If any child couldn't be evaluated or there are no children, the tree is incomplete
    if (childValues.length === 0 || childValues.some(value => value === null)) {
      visiting.delete(node.id);
      return null;
    }
  
    let result = null;

    // Apply the operator at this node.
    if (node.value === 'A' || node.value === 'AND' || node.value === '∧') {
      // AND operation - all children must be true
      result = childValues.every(value => value === 1) ? 1 : 0;
    } else if (node.value === 'O' || node.value === 'OR' || node.value === '∨') {
      // OR operation - at least one child must be true
      result = childValues.some(value => value === 1) ? 1 : 0;
    } else {
      visiting.delete(node.id);
      toast.error(`Neznámý operátor: ${node.value}`);
      throw new Error(`Neznámý operátor: ${node.value}`);
    }

    visiting.delete(node.id);
    memo.set(node.id, result);
    return result;
}

/**
 * Evaluates an MCVP expression tree and returns the evaluation steps.
 * 
 * @param {Node} node - The root node of the tree to evaluate
 * @returns {Object} An object containing the result and the steps array
 */
export function evaluateTreeWithSteps(node) {
    const steps = [];
    const memo = new Map(); // Cache results
    const visiting = new Set();
    
    function evaluate(currentNode) {
        if (!currentNode) return null;

        // Return cached result if available
        if (memo.has(currentNode.id)) {
            return memo.get(currentNode.id);
        }

        if (visiting.has(currentNode.id)) {
            throw new Error("Cyklus detekován during step-by-step evaluation");
        }
        visiting.add(currentNode.id);

        // Variable node
        if (currentNode.type === "variable") {
            const val = currentNode.varValue !== undefined ? currentNode.varValue : null;
            visiting.delete(currentNode.id);
            memo.set(currentNode.id, val);
            return val;
        }

        if (!currentNode.children || !Array.isArray(currentNode.children) || currentNode.children.length === 0) {
            visiting.delete(currentNode.id);
            return null;
        }

        const childValues = [];
        for (const child of currentNode.children) {
            const childVal = evaluate(child);
            if (childVal !== null) childValues.push(childVal);
        }

        if (childValues.length === 0 || childValues.some(v => v === null)) {
            visiting.delete(currentNode.id);
            return null;
        }

        let result;
        if (currentNode.value === 'A' || currentNode.value === 'AND' || currentNode.value === '∧') {
             result = childValues.every(v => v === 1) ? 1 : 0;
        } else if (currentNode.value === 'O' || currentNode.value === 'OR' || currentNode.value === '∨') {
             result = childValues.some(v => v === 1) ? 1 : 0;
        } else {
             visiting.delete(currentNode.id);
             return null;
        }

        // Only add step if we actually computed it (which we did, since we are here)
        steps.push({
            node: currentNode,
            childValues: childValues,
            result: result
        });

        visiting.delete(currentNode.id);
        memo.set(currentNode.id, result);
        return result;
    }

    try {
        const finalResult = evaluate(node);
        return { result: finalResult, steps };
    } catch (e) {
        console.error(e);
        toast.error(e.message);
        return { result: null, steps: [] };
    }
}
