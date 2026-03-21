import { graphToTree } from './GraphToTree';

/**
 * Converts a flat graph representation (nodes/links) to a recursive Node DAG structure.
 *
 * @param {Object} graphData - The graph data object { nodes: [], links: [], positions?: {} }
 * @returns {Node|null} The root node of the DAG or null if invalid
 */
export function flatGraphToTree(graphData) {
  return graphToTree(graphData, {
    requireSingleRoot: false,
    acceptEdgesOrLinks: true,
    preservePositions: true,
    maxChildrenCheck: true,
    normalizeUnaryOperationNodes: true,
    throwOnInvalid: false,
  });
}

/**
 * Converts a recursive Node DAG structure to a flat graph representation.
 *
 * @param {Node} rootNode - The root node of the DAG
 * @param {boolean} includePositions - Whether to include x, y positions in the export
 * @returns {Object} The graph data object { nodes: [], links: [], positions?: {} }
 */
export function treeToFlatGraph(rootNode, includePositions = false) {
  if (!rootNode) return { nodes: [], links: [] };

  const nodes = new Map();
  const links = [];
  const positions = {};
  const queue = [rootNode];

  while (queue.length > 0) {
    const currentNode = queue.shift();

    if (!nodes.has(currentNode.id)) {
      nodes.set(currentNode.id, {
        id: currentNode.id,
        value: currentNode.value,
        varValue: currentNode.varValue,
        type: currentNode.type,
      });

      // Capture positions if requested and available
      if (
        includePositions &&
        typeof currentNode.x === 'number' &&
        typeof currentNode.y === 'number'
      ) {
        positions[currentNode.id] = {
          x: currentNode.x,
          y: currentNode.y,
        };
      }

      if (currentNode.children) {
        for (const child of currentNode.children) {
          links.push({
            source: currentNode.id,
            target: child.id,
          });
          queue.push(child);
        }
      }
    }
  }

  const result = {
    nodes: Array.from(nodes.values()),
    links: links, // Using 'links' to be consistent with InteractiveInput
  };

  // Only include positions if they are requested and we have at least one position
  if (includePositions && Object.keys(positions).length > 0) {
    result.positions = positions;
  }

  return result;
}
