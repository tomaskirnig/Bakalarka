/**
 * @fileoverview Defines the Node class for representing nodes in an MCVP expression tree.
 */

/**
 * Class representing a node in an MCVP expression tree.
 * Nodes can represent operators (AND/OR) or variables.
 */
export class Node { 
  /**
   * Creates a new Node instance.
   * 
   * @param {string} value - The value of the node ('A' for AND, 'O' for OR, or variable name like 'x1')
   * @param {Node|null} left - The left child node
   * @param {Node|null} right - The right child node
   * @param {number|null} varValue - For variable nodes, the value (0 or 1)
   * @param {Node|null} parent - The parent node
   * @param {string} type - Node type ('operation' or 'variable')
   */
  constructor(value, left = null, right = null, varValue = null, parent = null, type = "operation") {
    this.value = value;  // Operator ('A' or 'O') or variable name (like 'x1')
    this.parent = parent;
    this.left = left;
    this.right = right;
    this.varValue = varValue;  // For variable nodes, store the value inside []
    this.type = type; // variable / operation
  }
}
