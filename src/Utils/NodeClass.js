// Node = operator or variable
export class Node { 
  constructor(type, left = null, right = null, varValue = null) {
    this.value = type;  // Operator ('A' or 'O') or variable name (like 'x1')
    this.left = left;
    this.right = right;
    this.varValue = varValue;  // For variable nodes, store the value inside []
  }
}

