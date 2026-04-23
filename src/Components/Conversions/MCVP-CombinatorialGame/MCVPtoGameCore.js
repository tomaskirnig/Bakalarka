/**
 * @fileoverview Core logic for converting MCVP tree to Combinatorial Game graph.
 * This module contains only the pure logic, separated from UI and step generation.
 */

const OR_NODE_VALUES = new Set(['O', 'OR', '∨']);
const AND_NODE_VALUES = new Set(['A', 'AND', '∧']);

/**
 * Core conversion function from MCVP to Combinatorial Game.
 *
 * Rules:
 * - OR nodes -> Player 1 positions (Player 1 chooses move)
 * - AND nodes -> Player 2 positions (Player 2 chooses move)
 * - Variable [1] -> Player 2 position with no moves (Player 2 loses => Player 1 wins)
 * - Variable [0] -> Player 1 position with no moves (Player 1 loses)
 *
 * @param {Object} mcvpTree - The root node of the MCVP tree
 * @returns {Object} The game graph structure { positions, startingPosition }
 */
export function convertMCVPToGameCore(mcvpTree) {
  if (!mcvpTree) return null;

  const positions = {};
  const visited = new Map(); // mcvpNode -> positionId

  function getPositionId(node) {
    if (visited.has(node)) return visited.get(node);
    // Use node.id if available, otherwise fallback to something unique
    const id = node.id || `v_${Math.random().toString(36).substr(2, 9)}`;
    visited.set(node, id);
    return id;
  }

  function traverse(node) {
    const nodeId = getPositionId(node);

    if (positions[nodeId]) return nodeId;

    let player;
    if (node.type === 'variable') {
      player = node.varValue === 1 ? 2 : 1;
    } else {
      if (OR_NODE_VALUES.has(node.value)) {
        player = 1;
      } else if (AND_NODE_VALUES.has(node.value)) {
        player = 2;
      } else {
        player = 1; // Fallback
      }
    }

    const hasValidX = typeof node.x === 'number' && Number.isFinite(node.x);
    const hasValidY = typeof node.y === 'number' && Number.isFinite(node.y);

    positions[nodeId] = {
      id: nodeId,
      player: player,
      children: [],
      parents: [],
      ...(hasValidX && hasValidY ? { x: node.x, y: node.y } : {}),
    };

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (!child) continue;
        const childId = traverse(child);
        positions[nodeId].children.push(childId);
        if (!positions[childId].parents) positions[childId].parents = [];
        positions[childId].parents.push(nodeId);
      }
    }

    return nodeId;
  }

  const startingId = traverse(mcvpTree);

  return {
    positions,
    startingPosition: { id: startingId },
  };
}
