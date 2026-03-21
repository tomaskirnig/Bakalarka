import { graphToTree } from '../../Utils/GraphToTree';

/**
 * Converts force-graph data to the internal Node class tree/DAG structure.
 * @param {{nodes: Array, links: Array}} graphData
 * @returns {Node|null}
 */
export function graphDataToNodeClass(graphData) {
  return graphToTree(graphData, {
    requireSingleRoot: true,
    acceptEdgesOrLinks: true,
    preservePositions: true,
    maxChildrenCheck: true,
    normalizeUnaryOperationNodes: true,
    throwOnInvalid: false,
  });
}

/**
 * Returns human-readable node label used in interaction UI messages.
 * @param {{type: string, value: string, varValue?: number}} node
 * @returns {string}
 */
export function getNodeDisplayName(node) {
  if (!node) return '';
  if (node.type === 'variable') {
    return `${node.value}[${node.varValue}]`;
  }
  return node.value === 'A' ? 'AND' : node.value === 'O' ? 'OR' : node.value;
}
