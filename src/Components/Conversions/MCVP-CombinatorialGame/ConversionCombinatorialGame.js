/**
 * @fileoverview Logic for converting MCVP tree to Combinatorial Game graph.
 */

/**
 * Converts an MCVP expression tree into a Combinatorial Game graph structure.
 * 
 * Rules:
 * - OR nodes -> Player 1 positions (Player 1 chooses move)
 * - AND nodes -> Player 2 positions (Player 2 chooses move)
 * - Variable [1] -> Player 2 position with no moves (Player 2 loses => Player 1 wins)
 * - Variable [0] -> Player 1 position with no moves (Player 1 loses)
 * 
 * @param {Object} mcvpTree - The root node of the MCVP tree
 * @returns {Object} The game graph structure { positions, startingPosition }
 */
export function convertMCVPtoGame(mcvpTree) {
    if (!mcvpTree) return null;

    const positions = {};
    const visited = new Set();
    let idCounter = 0;

    // Helper to ensure unique IDs if they don't exist or collide
    const getUniqueId = (node) => {
        if (node.id === undefined || node.id === null) {
            node.id = `node_${idCounter++}`;
        }
        return node.id;
    };

    function traverse(node) {
        const nodeId = getUniqueId(node);
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        let player;
        let childrenIds = [];

        // Determine Player and Children
        if (node.type === 'variable') {
            // Leaf node logic
            if (node.varValue === 1) {
                // Value 1 => Player 1 should win.
                // Create a Player 2 node with NO children. P2 has no moves -> P2 loses -> P1 wins.
                player = 2;
            } else {
                // Value 0 => Player 1 should lose.
                // Create a Player 1 node with NO children. P1 has no moves -> P1 loses.
                player = 1;
            }
            childrenIds = [];
        } else {
            // Operator logic
            if (node.value === 'O' || node.value === 'OR' || node.value === '∨') {
                player = 1; // OR -> Player 1 chooses
            } else if (node.value === 'A' || node.value === 'AND' || node.value === '∧') {
                player = 2; // AND -> Player 2 chooses
            } else {
                // Default fallback, though parser should prevent this
                player = 1; 
            }

            // Process children
            if (node.children && node.children.length > 0) {
                childrenIds = node.children.map(child => {
                    traverse(child);
                    return getUniqueId(child);
                });
            }
        }

        // Create position object
        positions[nodeId] = {
            id: nodeId,
            player: player,
            children: childrenIds,
            parents: [], // Will be populated if needed, but display graph uses simple links
            // Preserve x,y if they exist for visual continuity
            x: node.x,
            y: node.y
        };
    }

    traverse(mcvpTree);

    // Reconstruct parents for the graph structure (optional but good for completeness)
    Object.values(positions).forEach(pos => {
        pos.children.forEach(childId => {
            if (positions[childId]) {
                if (!positions[childId].parents) positions[childId].parents = [];
                positions[childId].parents.push(pos.id);
            }
        });
    });

    return {
        positions: positions,
        startingPosition: { id: getUniqueId(mcvpTree) }
    };
}
