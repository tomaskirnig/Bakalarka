// Parser expects format:
// "nodes: 1:1, 2:2, 3:1; edges: 1->2, 1->3"
// Each node "id:player", both id and player are numeric.
// The parser outputs an object with a `positions` property (mapping node ids to node objects)
// and a `startingPosition` (the first node's id as a number).

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
    // Each node is defined as "id:player" (both numeric).
    const [idStr, playerStr] = nodeDef.split(":").map(s => s.trim());
    const id = Number(idStr);
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
    // Each edge is defined as "source->target" (both numeric).
    const [sourceStr, targetStr] = edgeDef.split("->").map(s => s.trim());
    const source = Number(sourceStr);
    const target = Number(targetStr);
    if (positions[source] && positions[target]) {
      positions[source].children.push(target);
      positions[target].parents.push(source);
    }
  });

  // Use the provided starting position.
  // const startingPositionNode = startingPosition ? startingPosition : nodesArr.length > 0 ? Number(nodesArr[0].split(":")[0].trim()) : null;
  
  return {
    positions,
    startingPosition: positions[startingPosition] // startingPositionNode
  };
}

  