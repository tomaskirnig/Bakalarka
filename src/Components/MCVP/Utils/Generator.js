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

  // With arity <= 2 and all variables connected, we need at least N-1 gates.
  if (numVariables > numGates + 1) {
    toast.error('Pro binární obvod musí platit: počet hradel >= počet proměnných - 1.');
    throw new Error('Nedostatek hradel pro binární strukturu obvodu.');
  }

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

  // Create gates and allow reuse while enforcing max 2 children per operation node.
  for (let i = 0; i < numGates; i++) {
    if (rootNodeIds.size < 1) {
      toast.error('Nedostatek uzlů!');
      throw new Error('Nedostatek uzlů!');
    }

    const remainingGates = numGates - i;
    const rootNodes = Array.from(rootNodeIds)
      .map(id => nodeById.get(id))
      .filter(Boolean);
    const selectedChildren = [];

    // Feasibility guard: after this gate, roots must stay low enough
    // so remaining gates can still reduce to one root.
    const minRequiredRootChildren = rootNodes.length - remainingGates + 1;
    if (minRequiredRootChildren > 2) {
      toast.error('Nelze dokončit binární strukturu: příliš mnoho kořenů vzhledem ke zbývajícím hradlům.');
      throw new Error('Generování neuspělo: nelze dosáhnout jediného kořene s aritou <= 2.');
    }

    const forcedRootChildren = Math.max(1, minRequiredRootChildren);
    let rootChildCount = forcedRootChildren;

    // Prefer binary gates when it does not break feasibility.
    if (rootNodes.length >= 2 && forcedRootChildren < 2) {
      rootChildCount = Math.random() < 0.75 ? 2 : 1;
    }

    selectedChildren.push(...pickDistinctNodes(rootNodes, rootChildCount));

    // If unary so far, try to reuse one non-root input to keep gate binary.
    if (selectedChildren.length < 2) {
      const alreadySelected = new Set(selectedChildren.map(node => node.id));
      const nonRootNodes = nodes.filter(node => !rootNodeIds.has(node.id));
      const reused = pickDistinctNodes(nonRootNodes, 1, alreadySelected);

      if (reused.length === 1) {
        selectedChildren.push(reused[0]);
      } else if (rootNodes.length >= 2) {
        const extraRoot = pickDistinctNodes(rootNodes, 1, alreadySelected);
        if (extraRoot.length === 1) {
          selectedChildren.push(extraRoot[0]);
        }
      }
    }

    if (selectedChildren.length < 1 || selectedChildren.length > 2) {
      toast.error('Generování DAG selhalo: neplatný počet potomků pro nové hradlo.');
      throw new Error('Generování DAG selhalo: neplatný počet potomků pro nové hradlo.');
    }

    const gateNode = createGateNode(selectedChildren);
    nodes.push(gateNode);
    nodeById.set(gateNode.id, gateNode);

    // Selected root children lose root status; new gate becomes root.
    selectedChildren.forEach(child => {
      rootNodeIds.delete(child.id);
    });
    rootNodeIds.add(gateNode.id);
  }

  if (rootNodeIds.size !== 1) {
    toast.error('Generování neuspělo, zbyl špatný počet kořenových uzlů.');
    throw new Error('Generování neuspělo, zbyl špatný počet kořenových uzlů.');
  }

  const [rootId] = Array.from(rootNodeIds);
  return nodeById.get(rootId); // Return the root of the DAG
}
