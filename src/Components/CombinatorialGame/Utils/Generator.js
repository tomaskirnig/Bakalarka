/**
 * @fileoverview Provides functionality to generate random combinatorial game graphs.
 */

import { GamePosition, GameGraph } from './NodeClasses';

/**
 * Generates a random combinatorial game graph.
 * 
 * @param {number} numGameFields - Number of positions/nodes to generate
 * @param {number} edgeProbability - Probability (0-100) of creating an edge between unconnected nodes
 * @returns {GameGraph} A randomly generated game graph
 */
export function generateGraph(numGameFields, edgeProbability) {
  // edgeProbability is between 0 and 100
  const positions = {};

  // Create nodes (positions) with ids from "0" to numGameFields - 1.
  for (let i = 0; i < numGameFields; i++) {
    const id = i.toString();
    // Randomly assign player 1 or 2.
    const player = Math.random() < 0.5 ? 1 : 2;
    // Initially, no parents or children and isWinning is set to null.
    positions[id] = new GamePosition(id, player, [], [], null);
  }

  // First, ensure connectivity by building a random spanning tree (DAG).
  // For every node i > 0, connect it to a random predecessor j < i.
  // This ensures 0 can reach everyone (indirectly) and the graph is acyclic.
  for (let i = 1; i < numGameFields; i++) {
    const currentId = i.toString();
    // Pick a random parent index from 0 to i-1
    const parentIndex = Math.floor(Math.random() * i);
    const parentId = parentIndex.toString();
    
    positions[parentId].children.push(currentId);
    positions[currentId].parents.push(parentId);
  }

  // Now, add some extra random edges based on probability.
  // Only add edges from a node with lower index to a node with higher index to avoid cycles.
  const extraEdgeProbability = edgeProbability / 100 
  for (let i = 0; i < numGameFields; i++) {
    for (let j = i + 1; j < numGameFields; j++) {
      if (Math.random() < extraEdgeProbability) {
        const currentId = i.toString();
        const targetId = j.toString();
        
        // Avoid duplicate edges (already added by tree generation or previous loop)
        if (!positions[currentId].children.includes(targetId)) {
          positions[currentId].children.push(targetId);
          positions[targetId].parents.push(currentId);
        }
      }
    }
  }

  return new GameGraph(positions, positions[0]);
}
