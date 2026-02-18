import { Node } from './NodeClass';

/**
 * Converts a flat graph representation (nodes/links) to a recursive Node tree structure.
 *
 * @param {Object} graphData - The graph data object { nodes: [], links: [], positions?: {} }
 * @returns {Node|null} The root node of the tree or null if invalid
 */
export function flatGraphToTree(graphData) {
    if (!graphData || !graphData.nodes || !graphData.nodes.length) return null;

    // Create a map of Node instances
    const nodeMap = new Map();

    // First pass: Create all Node instances
    for (const graphNode of graphData.nodes) {
        const node = new Node(
            graphNode.value,
            graphNode.varValue,
            graphNode.type,
            [], // Initialize empty children array
            [],  // Initialize empty parents array
            graphNode.id // Pass the ID explicitly
        );

        // Apply positions if available
        if (graphData.positions && graphData.positions[graphNode.id]) {
            const pos = graphData.positions[graphNode.id];
            node.x = pos.x;
            node.y = pos.y;
            node.fx = pos.x;  // Fix position
            node.fy = pos.y;  // Fix position
        }

        nodeMap.set(graphNode.id, node);
    }

    // Second pass: Build parent-child relationships
    // Handle both 'links' (interactive) and 'edges' (stored sets) formats
    const edges = graphData.links || graphData.edges || [];

    for (const link of edges) {
        // Link might be object {source: id, target: id} or {source: object, target: object}
        // Handle both ID references and direct object references
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);

        if (sourceNode && targetNode) {
            // Add target as child of source
            sourceNode.children.push(targetNode);
            // Add source as parent of target
            targetNode.parents.push(sourceNode);
        }
    }

    // Find the root node (node with no parents)
    const rootNodes = Array.from(nodeMap.values()).filter(node =>
        node.parents.length === 0
    );

    if (rootNodes.length === 0) {
        console.warn("Nenalezen kořenový uzel - graf může obsahovat cykly");
        return null;
    }

    // If multiple roots, typically pick the first one or the logic depends on context.
    // For MCVP evaluation, we expect a single output (root).
    return rootNodes[0];
}

/**
 * Converts a recursive Node tree structure to a flat graph representation.
 *
 * @param {Node} rootNode - The root node of the tree
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
                type: currentNode.type
            });

            // Capture positions if requested and available
            if (includePositions && typeof currentNode.x === 'number' && typeof currentNode.y === 'number') {
                positions[currentNode.id] = {
                    x: currentNode.x,
                    y: currentNode.y
                };
            }

            if (currentNode.children) {
                for (const child of currentNode.children) {
                    links.push({
                        source: currentNode.id,
                        target: child.id
                    });
                    queue.push(child);
                }
            }
        }
    }

    const result = {
        nodes: Array.from(nodes.values()),
        links: links // Using 'links' to be consistent with InteractiveInput
    };

    // Only include positions if they are requested and we have at least one position
    if (includePositions && Object.keys(positions).length > 0) {
        result.positions = positions;
    }

    return result;
}
