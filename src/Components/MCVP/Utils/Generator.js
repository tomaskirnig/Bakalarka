/**
 * @fileoverview Provides utility functions for generating random MCVP expression trees.
 */

import { toast } from "react-toastify";
import { Node } from "./NodeClass";

/**
 * Creates a random variable node with a specified index.
 * 
 * @param {number} varIndex - The index to use for the variable name (e.g., x1, x2)
 * @returns {Node} A new variable node with random value (0 or 1)
 */
function createVariableNode(varIndex) {
  const varName = 'x' + varIndex; // Variable name 
  const varValue = Math.floor(Math.random() * 2); // Random binary value (0 or 1)
  return new Node(varName, null, null, varValue, null, 'variable'); 
}

/**
 * Creates a random operator node (AND or OR).
 * 
 * @param {Node} left - The left child of the gate
 * @param {Node|null} right - The right child of the gate, can be null
 * @returns {Node} A new operator node (AND or OR)
 */
function createGateNode(left, right = null) {
  const operator = Math.random() < 0.5 ? 'A' : 'O'; // AND (A) or OR (O)
  return new Node(operator, left, right, null, null, 'operation');
}

/**
 * Generates a random MCVP expression tree.
 * 
 * @param {number} numGates - Number of logical gates (AND/OR) to include
 * @param {number} numVariables - Number of variables to include
 * @returns {Node} The root node of the generated tree
 * @throws {Error} If there are not enough nodes or if generation fails
 */
export function generateTree(numGates, numVariables) {
  const nodes = [];

  // Create variable nodes
  for (let i = 1; i <= numVariables; i++) {
      nodes.push(createVariableNode(i));
  }

  // Create gates and combine nodes
  for (let i = 0; i < numGates; i++) {
      if (nodes.length < 1) {
        toast.error('Nedostatek uzlů!');
        throw new Error("Nedostatek uzlů!");
      }

      // Pick one or two nodes randomly
      const left = nodes.splice(Math.floor(Math.random() * nodes.length), 1)[0];
      const right = nodes.length > 0 
          ? nodes.splice(Math.floor(Math.random() * nodes.length), 1)[0] 
          : null;

      // Create a gate (AND or OR) and push the new node back into the list
      const gateNode = createGateNode(left, right);
      nodes.push(gateNode);
  }

  // The last remaining node is the root of the tree
  if (nodes.length !== 1) {
      toast.error('Generování neuspělo, zbyl špatný počet uzlů.');
      throw new Error("Generování neuspělo, zbyl špatný počet uzlů.");
  }

  return nodes[0]; // Return the root of the tree
}
