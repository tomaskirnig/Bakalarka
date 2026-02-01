/**
 * @fileoverview Provides functionality to generate random combinatorial game graphs.
 */

import { GamePosition, GameGraph } from './NodeClasses';

/**
 * Generates a random combinatorial game graph with potential cycles.
 * The graph is guaranteed to be connected with node 0 as the starting position.
 * 
 * @param {number} numGameFields - Number of positions/nodes to generate
 * @param {number} edgeProbability - Probability (0-100) of creating an edge between any pair of nodes
 * @returns {GameGraph} A randomly generated game graph that may contain cycles
 */
export function generateGraph(numGameFields, edgeProbability) {
  const positions = {};

  // Create all positions with sequential IDs
  for (let i = 0; i < numGameFields; i++) {
    const id = i.toString();
    const player = Math.random() < 0.5 ? 1 : 2;
    positions[id] = new GamePosition(id, player, [], []);
  }

  // Build spanning tree to guarantee connectivity from node 0
  for (let i = 1; i < numGameFields; i++) {
    const currentId = i.toString();
    const parentIndex = Math.floor(Math.random() * i);
    const parentId = parentIndex.toString();
    
    positions[parentId].children.push(currentId);
    positions[currentId].parents.push(parentId);
  }

  // Add extra edges based on probability (may create cycles)
  const extraEdgeProbability = edgeProbability / 100 
  for (let i = 0; i < numGameFields; i++) {
    for (let j = 0; j < numGameFields; j++) {
      if (i === j) continue; // Skip self-loops

      if (Math.random() < extraEdgeProbability) {
        const currentId = i.toString();
        const targetId = j.toString();
        
        // Check if edge already exists
        if (!positions[currentId].children.includes(targetId)) {
          positions[currentId].children.push(targetId);
          positions[targetId].parents.push(currentId);
        }
      }
    }
  }

  return new GameGraph(positions, positions[0]);
}
