/**
 * @fileoverview Provides parsing functionality to convert text representation of combinatorial games into structured graph objects.
 */

/**
 * Parses a text expression into a game graph structure.
 * 
 * @param {string} expression - The expression to parse, expected format: "nodes: 1:1, 2:2; edges: 1->2"
 * @param {number} startingPosition - The ID of the starting position node
 * @returns {Object} An object with positions and startingPosition properties
 * @throws {Error} If the expression format is invalid
 */
export function parseExpressionToTree(expression, startingPosition) {
  // Split the expression into nodes and edges parts.
  const parts = expression.split(";");
  let nodesPart = "";
  let edgesPart = "";

  parts.forEach(part => {
    part = part.trim();
    if (part.startsWith("nodes:")) {
      nodesPart = part.slice("nodes:".length).trim();
    } else if (part.startsWith("edges:")) {
      edgesPart = part.slice("edges:".length).trim();
    }
  });

  // Split and trim each list.
  const nodesArr = nodesPart.split(",").map(s => s.trim()).filter(Boolean);
  const edgesArr = edgesPart.split(",").map(s => s.trim()).filter(Boolean);

  // Build the positions object.
  const positions = {};
  nodesArr.forEach((nodeDef) => {
    // Each node is defined as "id:player".
    const [idStr, playerStr] = nodeDef.split(":").map(s => s.trim());
    const id = idStr;
    const player = Number(playerStr);
    positions[id] = {
      id,
      player,
      isWinning: false,  
      parents: [],
      children: []
    };
  });

  // Process the edges and fill in the children/parents arrays.
  edgesArr.forEach(edgeDef => {
    // Each edge is defined as "source->target".
    const [sourceStr, targetStr] = edgeDef.split("->").map(s => s.trim());
    const source = sourceStr;
    const target = targetStr;
    if (positions[source] && positions[target]) {
      positions[source].children.push(target);
      positions[target].parents.push(source);
    }
  });
  
  return {
    positions,
    startingPosition: positions[startingPosition]
  };
}

