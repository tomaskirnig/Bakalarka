import { graphToTree } from './GraphToTree';

/**
 * Converts a flat graph representation (nodes/links) to a recursive Node DAG structure.
 *
 * @param {Object} graphData - The graph data object { nodes: [], links: [], positions?: {} }
 * @returns {Node|null} The root node of the DAG or null if invalid
 */
export function flatGraphToTree(graphData) {
  return graphToTree(graphData, {
    acceptEdgesOrLinks: true,
    preservePositions: true,
    requireBinaryOperationNodes: true,
    normalizeUnaryOperationNodes: false,
    throwOnInvalid: false,
  });
}

/**
 * Converts a recursive Node DAG structure to a flat graph representation.
 *
 * @param {Node} rootNode - The root node of the DAG
 * @param {boolean} includePositions - Whether to include x, y positions in the export
 * @param {Object<string|number, {x:number, y:number}>} [positionSnapshot] - Optional live snapshot by node id taken at export time.
 * @returns {Object} The graph data object { nodes: [], links: [], positions?: {} }
 */
export function treeToFlatGraph(rootNode, includePositions = false, positionSnapshot = null) {
  if (!rootNode) return { nodes: [], links: [] };

  const getSnapshotPosition = (nodeId) => {
    if (!positionSnapshot || typeof positionSnapshot !== 'object') {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(positionSnapshot, nodeId)) {
      return positionSnapshot[nodeId];
    }

    const stringId = String(nodeId);
    if (Object.prototype.hasOwnProperty.call(positionSnapshot, stringId)) {
      return positionSnapshot[stringId];
    }

    return null;
  };

  const nodes = new Map();
  const links = [];
  const positions = {};
  const queue = [rootNode];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const currentNode = queue[queueIndex++];

    if (!nodes.has(currentNode.id)) {
      nodes.set(currentNode.id, {
        id: currentNode.id,
        value: currentNode.value,
        varValue: currentNode.varValue,
        type: currentNode.type,
      });

      // Capture positions if requested and available.
      // Prefer export-time live snapshot from the active graph engine,
      // then fallback to model coordinates.
      const snapshotPosition = getSnapshotPosition(currentNode.id);
      const positionX =
        typeof snapshotPosition?.x === 'number'
          ? snapshotPosition.x
          : typeof currentNode.x === 'number'
            ? currentNode.x
            : currentNode.fx;
      const positionY =
        typeof snapshotPosition?.y === 'number'
          ? snapshotPosition.y
          : typeof currentNode.y === 'number'
            ? currentNode.y
            : currentNode.fy;

      if (includePositions && typeof positionX === 'number' && typeof positionY === 'number') {
        positions[currentNode.id] = {
          x: positionX,
          y: positionY,
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
    links, // Using 'links' to be consistent with InteractiveInput
  };

  // Include positions only when requested and available.
  if (includePositions && Object.keys(positions).length > 0) {
    result.positions = positions;
  }

  return result;
}
