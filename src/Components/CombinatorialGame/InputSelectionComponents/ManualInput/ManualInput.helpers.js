export function resolveNodeId(nodeOrId) {
  return typeof nodeOrId === 'object' && nodeOrId !== null ? nodeOrId.id : nodeOrId;
}

export function buildNodeMap(nodes) {
  const map = {};
  nodes.forEach((node) => {
    map[node.id] = node;
  });
  return map;
}

export function toFormattedGraph(graph, startingNodeId) {
  if (!graph || graph.nodes.length === 0 || !startingNodeId) return null;

  const startNode = graph.nodes.find((node) => node.id === startingNodeId);
  if (!startNode) return null;

  return {
    positions: graph.nodes.reduce((acc, node) => {
      acc[node.id] = {
        id: node.id,
        player: node.player,
        x: node.x,
        y: node.y,
        children: graph.links
          .filter((link) => resolveNodeId(link.source) === node.id)
          .map((link) => resolveNodeId(link.target)),
        parents: graph.links
          .filter((link) => resolveNodeId(link.target) === node.id)
          .map((link) => resolveNodeId(link.source)),
      };
      return acc;
    }, {}),
    startingPosition: startNode,
  };
}

export function mapInitialGraphToState(initialGraph) {
  if (!initialGraph) return null;

  if (initialGraph.positions) {
    const newNodes = [];
    const newLinks = [];

    Object.values(initialGraph.positions).forEach((pos) => {
      newNodes.push({
        id: String(pos.id),
        player: pos.player,
        x: pos.x,
        y: pos.y,
        neighbors: [],
      });
    });

    Object.values(initialGraph.positions).forEach((pos) => {
      if (pos.children) {
        pos.children.forEach((childId) => {
          if (initialGraph.positions[childId]) {
            newLinks.push({
              source: String(pos.id),
              target: String(childId),
            });
          }
        });
      }
    });

    return {
      graph: { nodes: newNodes, links: newLinks },
      startingNodeId: initialGraph.startingPosition
        ? String(initialGraph.startingPosition.id || initialGraph.startingPosition)
        : null,
    };
  }

  if (initialGraph.nodes || initialGraph.edges || initialGraph.links) {
    const nodePositions = initialGraph.nodePositions || {};

    const newNodes = (initialGraph.nodes || []).map((n) => {
      const nodeData = {
        ...n,
        id: String(n.id),
        player: n.player !== undefined ? n.player : 1,
        neighbors: [],
      };

      if (nodePositions[n.id]) {
        nodeData.x = nodePositions[n.id].x;
        nodeData.y = nodePositions[n.id].y;
        nodeData.fx = nodePositions[n.id].x;
        nodeData.fy = nodePositions[n.id].y;
      }

      return nodeData;
    });

    const edges = initialGraph.edges || initialGraph.links || [];
    const newLinks = edges.map((l) => ({
      source: String(resolveNodeId(l.source)),
      target: String(resolveNodeId(l.target)),
    }));

    return {
      graph: { nodes: newNodes, links: newLinks },
      startingNodeId: initialGraph.startingPosition
        ? String(initialGraph.startingPosition.id || initialGraph.startingPosition)
        : null,
    };
  }

  return null;
}

export function getConnectedLinks(links, selectedNodeId) {
  return links.filter((link) => {
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);
    return sourceId === selectedNodeId || targetId === selectedNodeId;
  });
}
