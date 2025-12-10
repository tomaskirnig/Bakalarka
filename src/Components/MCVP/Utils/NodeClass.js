/**
 * @fileoverview Defines the Node class for representing nodes in an MCVP expression tree.
 */

/**
 * Module-level counter for generating unique Node IDs.
 */
let globalIdCounter = 0;

/**
 * Class representing a node in an MCVP expression tree.
 * Nodes can represent operators (AND/OR) or variables.
 */
export class Node { 
  /**
   * Creates a new Node instance.
   * @param {string} value - The value of the node ('A' for AND, 'O' for OR, or variable name like 'x1')
   * @param {number|null} varValue - For variable nodes, the value (0 or 1)
   * @param {string} type - Node type ('operation' or 'variable')
   * @param {Array<Node>|null} children - The children of the node
   * @param {Array<Node>|null} parents - The parent nodes
   * @param {string|number|null} id - Unique identifier for the node. Auto-generated if null.
   */
  constructor(value, varValue = null, type = "operation", children = null,  parents = null, id = null) {
    // Use provided ID or generate a new incremental one
    this.id = (id !== null && id !== undefined) ? id : globalIdCounter++;
    
    this.value = value;  // Operator ('A' or 'O') or variable name (like 'x1')
    this.varValue = varValue;  // For variable nodes, store the value inside []
    this.type = type; // variable / operation
    this.parents = parents || []; // Ensure arrays are initialized
    this.children = children || [];
  }

  /**
   * Resets the global ID counter to 0.
   * Useful when starting a fresh generation sequence to keep IDs small.
   */
  static resetIdCounter() {
    globalIdCounter = 0;
  }
}
