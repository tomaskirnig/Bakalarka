// Node = operator or variable
export class Node { 
  constructor(value, left = null, right = null, varValue = null) {
    this.value = value;  // Operator ('A' or 'O') or variable name (like 'x1')
    this.left = left;
    this.right = right;
    this.varValue = varValue;  // For variable nodes, store the value inside []
  }
}

