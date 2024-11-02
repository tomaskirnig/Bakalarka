import { Node } from "./NodeClass";

// Helper function to create a random variable node
function createVariableNode(varIndex) {
  const varName = 'x' + varIndex; // Variable name like x1, x2, etc.
  const varValue = Math.floor(Math.random() * 2); // Assign a random binary value (0 or 1)
  return new Node(varName, null, null, varValue); // Variable node with a value
}

// Helper function to create a random operator node (A = AND, O = OR)
function createGateNode(left, right) {
  const operator = Math.random() < 0.5 ? 'A' : 'O'; // Randomly choose between AND (A) and OR (O)
  return new Node(operator, left, right); // Create an operator node
}

// Function to generate the tree structure based on the number of gates and variables
export function generateTree(numGates, numVariables) {
  const nodes = [];

  // Create variable nodes
  for (let i = 1; i <= numVariables; i++) {
    nodes.push(createVariableNode(i));
  }

  // Create gates and combine nodes
  for (let i = 0; i < numGates; i++) {
    if (nodes.length < 2) {
      throw new Error("Not enough nodes to combine!");
    }

    // Randomly pick two nodes and remove them from the available nodes list
    const left = nodes.splice(Math.floor(Math.random() * nodes.length), 1)[0];
    const right = nodes.splice(Math.floor(Math.random() * nodes.length), 1)[0];

    // Create a gate (AND or OR) and push the new node back into the list
    const gateNode = createGateNode(left, right);
    nodes.push(gateNode);
  }

  // The last remaining node is the root of the tree
  if (nodes.length !== 1) {
    throw new Error("Tree generation failed, wrong number of nodes left.");
  }

  return nodes[0]; // Return the root of the tree
}

// // Example usage:
// const numGates = 3;    // Number of gates (AND/OR)
// const numVariables = 4; // Number of variables (x1, x2, x3, x4)

// const tree = generateTree(numGates, numVariables);
// printTree(tree); // Print the generated tree structure
