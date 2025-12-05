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
  
  return new Node(
    varName,
    varValue,
    'variable',
    [],
    []
  ); 
}

/**
 * Creates a random operator node (AND or OR).
 * 
 * @param {Array<Node>} children - Array of child nodes for this gate
 * @returns {Node} A new operator node (AND or OR)
 */
function createGateNode(children = []) {
  const operator = Math.random() < 0.5 ? 'A' : 'O'; // AND (A) or OR (O)
  
  const node = new Node(
    operator,
    null,
    'operation',
    children,
    []
  );
  
  // Set parent relationship for each child
  children.forEach(child => {
    if (child) {
      // Ensure parents array exists
      if (!child.parents) {
        child.parents = [];
      }
      // Add this node as parent if not already there
      if (!child.parents.includes(node)) {
        child.parents.push(node);
      }
    }
  });
  
  return node;
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
  Node.resetIdCounter(); // Reset IDs for clean numbering
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

      // Decide how many child nodes to use (1 or 2)
      const childCount = Math.min(2, nodes.length);
      const children = [];
      
      // Select random nodes to be children of new gate
      for (let j = 0; j < childCount; j++) {
        const randomIndex = Math.floor(Math.random() * nodes.length);
        children.push(nodes.splice(randomIndex, 1)[0]);
      }

      // Create a gate (AND or OR) with selected children
      const gateNode = createGateNode(children);
      nodes.push(gateNode);
  }

  // The last remaining node is the root of the tree
  if (nodes.length !== 1) {
      toast.error('Generování neuspělo, zbyl špatný počet uzlů.');
      throw new Error("Generování neuspělo, zbyl špatný počet uzlů.");
  }

  return nodes[0]; // Return the root of the tree
}
