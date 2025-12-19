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

    const generator = new MCVPToGameStepGenerator(mcvpTree);
    const steps = generator.generate();
    // Return the graph from the last step
    return steps[steps.length - 1].graph;
}

/**
 * Generates step-by-step conversion for visualization.
 */
export class MCVPToGameStepGenerator {
    constructor(tree) {
        this.tree = tree;
        this.steps = [];
        this.positions = {}; // Accumulate positions here
        this.visited = new Set();
        this.idCounter = 0;
    }

    getUniqueId(node) {
        if (node.id === undefined || node.id === null) {
            node.id = `node_${this.idCounter++}`;
        }
        return node.id;
    }

    generate() {
        this.steps = [];
        this.positions = {};
        this.visited = new Set();

        if (!this.tree) return [];

        // Initial step
        this.addStep("Zahájení konverze", null, "Graf je prázdný");

        // Start traversal
        this.traverse(this.tree);

        // Final step
        const startId = this.getUniqueId(this.tree);
        this.addStep("Konverze dokončena", null, "Výsledný graf hry", { id: startId });

        return this.steps;
    }

    addStep(description, highlightNode, note, startingPositionOverride = null) {
        // Deep copy positions to snapshot the state
        const positionsCopy = JSON.parse(JSON.stringify(this.positions));
        
        // Determine starting position if not set
        let startingPos = startingPositionOverride;
        if (!startingPos && this.tree) {
             // If root exists in positions, use it, otherwise null
             const rootId = this.getUniqueId(this.tree);
             if (positionsCopy[rootId]) {
                 startingPos = { id: rootId };
             }
        }

        this.steps.push({
            description,
            highlightNode,
            graph: {
                positions: positionsCopy,
                startingPosition: startingPos
            },
            visualNote: note
        });
    }

    traverse(node) {
        const nodeId = this.getUniqueId(node);
        if (this.visited.has(nodeId)) return;
        this.visited.add(nodeId);

        let player;
        let description = "";
        let typeDesc = "";

        // Determine Player
        if (node.type === 'variable') {
            if (node.varValue === 1) {
                player = 2; // P2 loses -> P1 wins
                typeDesc = "Variable [1]";
                description = `Uzel "${node.value}" má hodnotu 1. Vytvoříme pozici pro Hráče 2 bez možných tahů (Hráč 2 prohrává).`;
            } else {
                player = 1; // P1 loses
                typeDesc = "Variable [0]";
                description = `Uzel "${node.value}" má hodnotu 0. Vytvoříme pozici pro Hráče 1 bez možných tahů (Hráč 1 prohrává).`;
            }
        } else {
            if (node.value === 'O' || node.value === 'OR' || node.value === '∨') {
                player = 1;
                typeDesc = "OR Gate";
                description = `Uzel "${node.value}" je OR. Vytvoříme pozici pro Hráče 1 (volí tah).`;
            } else if (node.value === 'A' || node.value === 'AND' || node.value === '∧') {
                player = 2;
                typeDesc = "AND Gate";
                description = `Uzel "${node.value}" je AND. Vytvoříme pozici pro Hráče 2 (volí tah).`;
            } else {
                player = 1; // Fallback
                description = `Neznámý uzel "${node.value}", fallback na Hráče 1.`;
            }
        }

        // Create node in graph
        this.positions[nodeId] = {
            id: nodeId,
            player: player,
            children: [],
            parents: []
        };

        this.addStep(description, node, `${typeDesc} -> Player ${player}`);

        // Process children
        if (node.children && node.children.length > 0) {
            const childIds = [];
            
            for (const child of node.children) {
                this.traverse(child); // Recursively build children first
                const childId = this.getUniqueId(child);
                childIds.push(childId);
                
                // Add link in graph state
                // We need to update both parent (current node) and child
                if (this.positions[nodeId]) {
                    if (!this.positions[nodeId].children.includes(childId)) {
                        this.positions[nodeId].children.push(childId);
                    }
                }
                
                if (this.positions[childId]) {
                    if (!this.positions[childId].parents) this.positions[childId].parents = [];
                    if (!this.positions[childId].parents.includes(nodeId)) {
                        this.positions[childId].parents.push(nodeId);
                    }
                }
                
                this.addStep(
                    `Propojení uzlu ${node.value} s potomkem ${child.value}`,
                    node,
                    `Přidána hrana z ${node.value} do ${child.value}`
                );
            }
        }
    }
}