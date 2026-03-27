import { Node } from './NodeClass';

/**
 * Converts flat graph data into internal Node DAG structure.
 *
 * @param {Object} graphData
 * @param {Object} options
 * @param {boolean} [options.acceptEdgesOrLinks=true] - Accepts either `links` or `edges` arrays.
 * @param {boolean} [options.preservePositions=true] - Copies x/y positions into created nodes.
 * @param {boolean} [options.requireBinaryOperationNodes=false] - Requires exactly 2 children for every operation node.
 * @param {boolean} [options.normalizeUnaryOperationNodes=false] - Duplicates a single child for operation nodes so they behave as binary gates.
 * @param {boolean} [options.throwOnInvalid=false] - Throws on invalid input instead of returning null.
 * @returns {Node|null}
 */
export function graphToTree(
  graphData,
  {
    acceptEdgesOrLinks = true,
    preservePositions = true,
    requireBinaryOperationNodes = false,
    normalizeUnaryOperationNodes = false,
    throwOnInvalid = false,
  } = {}
) {
  if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
    return null;
  }

  const fail = (message) => {
    if (throwOnInvalid) {
      throw new Error(message);
    }
    console.warn(message);
    return null;
  };

  const nodeMap = new Map();

  for (const graphNode of graphData.nodes) {
    const node = new Node(
      graphNode.value,
      graphNode.varValue,
      graphNode.type,
      [],
      [],
      graphNode.id
    );

    if (preservePositions) {
      if (typeof graphNode.x === 'number' && typeof graphNode.y === 'number') {
        node.x = graphNode.x;
        node.y = graphNode.y;
        node.fx = graphNode.x;
        node.fy = graphNode.y;
      } else if (graphData.positions && graphData.positions[graphNode.id]) {
        const pos = graphData.positions[graphNode.id];
        node.x = pos.x;
        node.y = pos.y;
        node.fx = pos.x;
        node.fy = pos.y;
      }
    }

    nodeMap.set(graphNode.id, node);
  }

  const links = acceptEdgesOrLinks
    ? graphData.links || graphData.edges || []
    : graphData.edges || [];

  for (const link of links) {
    const sourceId = typeof link.source === 'object' ? link.source?.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target?.id : link.target;

    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);
    if (!sourceNode || !targetNode) continue;

    if (sourceNode.type === 'operation' && sourceNode.children.length >= 2) {
      return fail(`Uzel operace ${sourceNode.id} má více než 2 potomky.`);
    }

    sourceNode.children.push(targetNode);
    targetNode.parents.push(sourceNode);
  }

  for (const node of nodeMap.values()) {
    if (node.type !== 'operation') {
      continue;
    }

    if (node.children.length > 2) {
      return fail(`Uzel operace ${node.id} má více než 2 potomky.`);
    }

    if (normalizeUnaryOperationNodes && node.children.length === 1) {
      // Unary operation behaves as f(x, x) in all downstream algorithms.
      node.children.push(node.children[0]);
    }

    if (requireBinaryOperationNodes && node.children.length !== 2) {
      return fail(`Uzel operace ${node.id} musí mít přesně 2 potomky.`);
    }
  }

  const rootNodes = Array.from(nodeMap.values()).filter((node) => node.parents.length === 0);

  if (rootNodes.length === 0) {
    return fail('Nenalezen kořenový uzel - graf může obsahovat cykly.');
  }

  if (rootNodes.length !== 1) {
    return fail(`Byl nalezen neplatný počet kořenů: ${rootNodes.length}.`);
  }

  return rootNodes[0];
}
