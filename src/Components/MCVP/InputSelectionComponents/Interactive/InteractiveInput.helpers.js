import { Node } from '../../Utils/NodeClass';

/**
 * Converts force-graph data to the internal Node class tree/DAG structure.
 * @param {{nodes: Array, links: Array}} graphData
 * @returns {Node|null}
 */
export function graphDataToNodeClass(graphData) {
  if (!graphData?.nodes?.length) return null;

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
    nodeMap.set(graphNode.id, node);
  }

  for (const link of graphData.links || []) {
    const sourceNode = nodeMap.get(link.source.id);
    const targetNode = nodeMap.get(link.target.id);

    if (sourceNode && targetNode) {
      sourceNode.children.push(targetNode);
      targetNode.parents.push(sourceNode);
    }
  }

  const rootNodes = Array.from(nodeMap.values()).filter(node => node.parents.length === 0);

  // Interactive editor validity: exactly one root is required.
  // Multiple roots mean there are disconnected/free nodes.
  if (rootNodes.length !== 1) {
    if (rootNodes.length === 0) {
      console.warn('No root node found - graph may have cycles');
    }
    return null;
  }

  return rootNodes[0];
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
  return node.value === 'A' ? 'AND' : (node.value === 'O' ? 'OR' : node.value);
}
