import { GamePosition, GameGraph } from './NodeClasses';

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

  // First, connect all nodes in a chain to ensure connectivity.
  // This guarantees that every node (except the first) has at least one parent.
  for (let i = 0; i < numGameFields - 1; i++) {
    const currentId = i.toString();
    const nextId = (i + 1).toString();
    positions[currentId].children.push(nextId);
    positions[nextId].parents.push(currentId);
  }

  // Now, add some extra random edges.
  // We only add edges from a node with lower index to a node with higher index to avoid cycles.
  const extraEdgeProbability = edgeProbability / 100 
  for (let i = 0; i < numGameFields; i++) {
    for (let j = i + 2; j < numGameFields; j++) {
      if (Math.random() < extraEdgeProbability) {
        const currentId = i.toString();
        const targetId = j.toString();
        // Avoid duplicate edges
        if (!positions[currentId].children.includes(targetId)) {
          positions[currentId].children.push(targetId);
          positions[targetId].parents.push(currentId);
        }
      }
    }
  }

  // Define the starting position as the first node ("0").
  // const startingPosition = "0";

  // Create and return the graph instance.
  return new GameGraph(positions, positions[0]);
}
