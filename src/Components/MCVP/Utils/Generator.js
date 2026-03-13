/**
 * @fileoverview Provides utility functions for generating random MCVP circuits (DAGs).
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
 * Generates a random MCVP circuit (DAG).
 * 
 * @param {number} numGates - Number of logical gates (AND/OR) to include
 * @param {number} numVariables - Number of variables to include
 * @returns {Node} The root node of the generated circuit
 * @throws {Error} If there are not enough nodes or if generation fails
 */
export function generateTree(numGates, numVariables) {
  Node.resetIdCounter(); // Reset IDs for clean numbering
  const nodes = [];
  const nodeById = new Map();
  const rootNodeIds = new Set(); // Nodes without parents (candidates for current roots)

  // Create variable nodes
  for (let i = 1; i <= numVariables; i++) {
      const variableNode = createVariableNode(i);
      nodes.push(variableNode);
      nodeById.set(variableNode.id, variableNode);
      rootNodeIds.add(variableNode.id);
  }

  // Helper to pick unique random nodes from a pool
  const pickDistinctNodes = (pool, count, excluded = new Set()) => {
    const available = pool.filter(node => node && !excluded.has(node.id));
    const picked = [];

    while (picked.length < count && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      picked.push(available.splice(randomIndex, 1)[0]);
    }

    return picked;
  };

  // Create gates and allow reusing existing nodes as shared inputs (DAG)
  for (let i = 0; i < numGates; i++) {
      if (rootNodeIds.size < 1) {
        toast.error('Nedostatek uzlů!');
        throw new Error("Nedostatek uzlů!");
      }

      const remainingGates = numGates - i;
      const rootNodes = Array.from(rootNodeIds)
        .map(id => nodeById.get(id))
        .filter(Boolean);
      const selectedChildren = [];
      
      // Last gate consumes all current roots so the result has one root.
      if (remainingGates === 1) {
          selectedChildren.push(...rootNodes);
      } else {
          // Pick children from current roots to keep the graph connected.
          const targetRootChildren = Math.ceil(rootNodes.length / remainingGates);
          const variance = Math.max(1, Math.floor(targetRootChildren * 0.2));
          const randomVariance = Math.floor(Math.random() * (2 * variance + 1)) - variance;
          const minRootChildren = rootNodes.length < 2 ? 1 : 2;
          const rootChildCount = Math.max(
            minRootChildren,
            Math.min(rootNodes.length, targetRootChildren + randomVariance)
          );

          selectedChildren.push(...pickDistinctNodes(rootNodes, rootChildCount));

          // Reuse non-root nodes as additional inputs to produce true DAGs.
          const nonRootNodes = nodes.filter(node => !rootNodeIds.has(node.id));
          if (nonRootNodes.length > 0 && Math.random() < 0.65) {
            const maxExtraReuse = Math.min(nonRootNodes.length, Math.max(1, Math.floor(rootChildCount / 2)));
            const extraReuseCount = Math.floor(Math.random() * (maxExtraReuse + 1));
            if (extraReuseCount > 0) {
              const alreadySelected = new Set(selectedChildren.map(node => node.id));
              selectedChildren.push(...pickDistinctNodes(nonRootNodes, extraReuseCount, alreadySelected));
            }
          }
      }

      if (selectedChildren.length < 1) {
        toast.error('Generování DAG selhalo: chybí potomci pro nové hradlo.');
        throw new Error('Generování DAG selhalo: chybí potomci pro nové hradlo.');
      }

      // Create a gate (AND or OR) with selected children.
      const gateNode = createGateNode(selectedChildren);
      nodes.push(gateNode);
      nodeById.set(gateNode.id, gateNode);

      // Children that were roots now have a parent; the new gate becomes a new root.
      selectedChildren.forEach(child => {
        rootNodeIds.delete(child.id);
      });
      rootNodeIds.add(gateNode.id);
  }

  // Exactly one root is expected at the end.
  if (rootNodeIds.size !== 1) {
      toast.error('Generování neuspělo, zbyl špatný počet kořenových uzlů.');
      throw new Error("Generování neuspělo, zbyl špatný počet kořenových uzlů.");
  }

  const [rootId] = Array.from(rootNodeIds);
  return nodeById.get(rootId); // Return the root of the DAG
}
