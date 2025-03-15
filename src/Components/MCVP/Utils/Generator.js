import { Node } from "./NodeClass";

// Function to create a random variable node
function createVariableNode(varIndex) {
  const varName = 'x' + varIndex; // Variable name 
  const varValue = Math.floor(Math.random() * 2); // Random binary value (0 or 1)
  return new Node(varName, null, null, varValue, null, 'variable'); 
}

// Function to create a random operator node (A = AND, O = OR)
function createGateNode(left, right = null) {
  const operator = Math.random() < 0.5 ? 'A' : 'O'; // AND (A) or OR (O)
  return new Node(operator, left, right, null, null, 'operation');
}

// Function to generate the tree  
export function generateTree(numGates, numVariables) {
  const nodes = [];

  // Create variable nodes
  for (let i = 1; i <= numVariables; i++) {
      nodes.push(createVariableNode(i));
  }

  // Create gates and combine nodes
  for (let i = 0; i < numGates; i++) {
      if (nodes.length < 1) {
        alert('Nedostatek uzlů!');
          throw new Error("Nedostatek uzlů!");
      }

      // Pick one or two nodes randomly
      const left = nodes.splice(Math.floor(Math.random() * nodes.length), 1)[0];
      const right = nodes.length > 0 
          ? nodes.splice(Math.floor(Math.random() * nodes.length), 1)[0] 
          : null;

      // Create a gate (AND or OR) and push the new node back into the list
      const gateNode = createGateNode(left, right);
      nodes.push(gateNode);
  }

  // The last remaining node is the root of the tree
  if (nodes.length !== 1) {
      alert('Generování neuspělo, zbyl špatný počet uzlů.');
      throw new Error("Generování neuspělo, zbyl špatný počet uzlů.");
  }

  return nodes[0]; // Return the root of the tree
}
