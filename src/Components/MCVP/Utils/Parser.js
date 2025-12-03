/**
 * @fileoverview Provides utilities for parsing MCVP expressions into tree structures.
 */

import { toast } from "react-toastify";
import { Node } from "./NodeClass";

/**
 * Converts an input string into tokens for parsing.
 * 
 * @param {string} s - The expression string to tokenize
 * @returns {Array<Array<string>>} Array of tokens, each a [kind, value] pair
 * @throws {SyntaxError} If an unexpected character is encountered
 */
function tokenize(s) {
  s = s.replace(/\s+/g, ''); // Remove whitespace characters 

  // Define token patterns
  const tokenSpecification = [
    ['LPAREN', /\(/],
    ['RPAREN', /\)/],
    ['OPERATOR', /A|O/],
    ['VARIABLE', /x\d+\[\d+\]/],  // Matches x followed by digits
  ];

  const tokens = [];
  let pos = 0;

  while (pos < s.length) {
    let match = null;
    for (let [kind, regex] of tokenSpecification) {
      const matched = s.slice(pos).match(regex);
      if (matched && matched.index === 0) {
        match = { kind, value: matched[0] };
        break;
      }
    }

    if (match) {
      tokens.push([match.kind, match.value]);
      pos += match.value.length;
    } else {
      // toast.error('Neočekávaný znak ' + s[pos] + ' na pozici ' + pos);
      throw new SyntaxError(`Neočekávaný znak "${s[pos]}" na pozici ${pos}`);
    }
  }
  
  return tokens;
}

/**
 * Parser class for converting tokens into an MCVP expression tree.
 */
class Parser {
  /**
   * Creates a new Parser instance.
   * 
   * @param {Array<Array<string>>} tokens - Array of tokens to parse
   */
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  /**
   * Parses the tokens into an MCVP expression tree.
   * 
   * @returns {Node} The root node of the parsed expression tree
   * @throws {SyntaxError} If the syntax is invalid
   */
  parse() {
    const node = this.parseExpression();
    if (this.pos !== this.tokens.length) {
      throw new SyntaxError('Neočekávané tokeny na konci vstupu.');
    }
    return node;
  }

  /**
   * Parses an expression.
   * 
   * @returns {Node} The root node of the parsed expression
   */
  parseExpression() {
    return this.parseOrExpr();
  }

  /**
   * Parses an OR expression.
   * 
   * @returns {Node} The root node of the parsed OR expression
   */
  parseOrExpr() {
    let node = this.parseAndExpr();
    while (this.currentTokenIs('OPERATOR', 'O')) {
      this.consume('OPERATOR', 'O');
      const right = this.parseAndExpr();
      
      // Create new node with children array
      const newNode = new Node(
        'O',             // value
        null,            // varValue
        'operation',     // type
        [node, right],   // children
        null             // parents
      );
      
      // Update parent references
      if (node) {
        node.parents = node.parents || [];
        node.parents.push(newNode);
      }
      
      if (right) {
        right.parents = right.parents || [];
        right.parents.push(newNode);
      }
      
      node = newNode;
    }
    return node;
  }

  /**
   * Parses an AND expression.
   * 
   * @returns {Node} The root node of the parsed AND expression
   */
  parseAndExpr() {
    let node = this.parseFactor();
    while (this.currentTokenIs('OPERATOR', 'A')) {
      this.consume('OPERATOR', 'A');
      const right = this.parseFactor();
      
      // Create new node with children array
      const newNode = new Node(
        'A',             // value
        null,            // varValue
        'operation',     // type
        [node, right],   // children
        null             // parents
      );
      
      // Update parent references
      if (node) {
        node.parents = node.parents || [];
        node.parents.push(newNode);
      }
      
      if (right) {
        right.parents = right.parents || [];
        right.parents.push(newNode);
      }
      
      node = newNode;
    }
    return node;
  }

  /**
   * Parses a factor (variable or parenthesized expression).
   * 
   * @returns {Node} The node representing the factor
   * @throws {SyntaxError} If an unexpected token is encountered
   */
  parseFactor() {
    if (this.currentTokenIs('VARIABLE')) {
      const varToken = this.consume('VARIABLE');
      const [varName, varValue] = this.parseVariable(varToken[1]);
      
      // Create variable node with new constructor signature
      return new Node(
        varName,         // value
        varValue,        // varValue
        'variable',      // type
        [],              // children (empty for variables)
        []               // parents (will be updated by parent node)
      );
    } 
    else if (this.currentTokenIs('LPAREN')) {
      this.consume('LPAREN');
      const node = this.parseExpression();
      this.consume('RPAREN');
      return node;
    } 
    else {
      // toast.error('Očekávala se proměnná nebo levá závorka, místo ' + this.currentToken()[0]);
      throw new SyntaxError(`Očekávala se PROMĚNNÁ nebo "(", místo toho ${this.currentToken()[0] == 'EOF' ? 'KONEC VSTUPU' : `"${this.currentToken()[1]}"`}`);
    }
  }

  /**
   * Parses a variable token into name and value.
   * 
   * @param {string} varStr - The variable string to parse (e.g., "x1[0]")
   * @returns {Array} A pair of [variableName, variableValue]
   * @throws {SyntaxError} If the variable format is invalid
   */
  parseVariable(varStr) {
    const match = varStr.match(/(x\d+)(?:\[(\d)\])?/);
    if (match) {
      const varName = match[1];
      const varValue = Number(match[2]) !== 0 ? 1 : 0;
      return [varName, varValue];
    } else {
      // toast.error('Neplatný formát proměnné: ' + varStr);
      throw new SyntaxError(`Neplatná proměnná ${varStr}`);
    }
  }

  /**
   * Gets the current token.
   * 
   * @returns {Array<string>} The current token as [kind, value] or ['EOF', ''] if at end
   */
  currentToken() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    } else {
      return ['EOF', ''];
    }
  }

  /**
   * Checks if the current token matches the specified kind and optional value.
   * 
   * @param {string} kind - The token kind to check for
   * @param {string|null} value - The token value to check for (or null to check only kind)
   * @returns {boolean} True if the current token matches, false otherwise
   */
  currentTokenIs(kind, value = null) {
    const tok = this.currentToken();
    if (tok[0] !== kind) {
      return false;
    }
    if (value !== null && tok[1] !== value) {
      return false;
    }
    return true;
  }

  /**
   * Converts a token kind to a string representation.
   * 
   * @param {string} kind - The token kind to convert
   * @returns {string} The string representation of the token kind
   */
  convertToString(kind) {
    switch (kind) {
      case 'LPAREN':
        return '"("';
      case 'RPAREN':
        return '")"';
      case 'EOF':
        return 'KONEC VSTUPU';
      case 'OPERATOR':
        return 'A|O';
      case 'VARIABLE':
        return 'x';
      default:
        return kind;
    }
  }

  /**
   * Consumes the current token if it matches the specified kind and optional value.
   * 
   * @param {string} kind - The expected token kind
   * @param {string|null} value - The expected token value (or null to check only kind)
   * @returns {Array<string>} The consumed token
   * @throws {SyntaxError} If the current token doesn't match the expected kind or value
   */
  consume(kind, value = null) {
    const tok = this.currentToken();
    if (tok[0] !== kind) {
      throw new SyntaxError(`Očekával se ${this.convertToString(kind)}, místo ${this.convertToString(tok[0])}`);
    }
    if (value !== null && tok[1] !== value) {
      throw new SyntaxError(`Očekávaná hodnota ${value}, místo ${tok[1]}`);
    }
    this.pos += 1;
    return tok;
  }

  
}

/**
 * Prints a tree to the console with indentation.
 * 
 * @param {Node} node - The root node of the tree to print
 * @param {number} indent - The indentation level (default: 0)
 */
export function printTree(node, indent = 0) {
  if (node !== null) {
    console.log(' '.repeat(indent) + node.value + (node.varValue !== null ? `[${node.varValue}]` : ''));
    
    // Use children array instead of left/right
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        if (child) printTree(child, indent + 2);
      });
    }
  }
}

/**
 * Parses an expression string into an MCVP expression tree.
 * 
 * @param {string} exprStr - The expression string to parse
 * @returns {Node} The root node of the parsed expression tree
 */
export function parseExpressionToTree(exprStr) {
  try {
    if (exprStr === '') {
      toast.error('Vstupní výraz je prázdný.');
      return null;
    }
    const tokens = tokenize(exprStr);
    const parser = new Parser(tokens);
    const tree = parser.parse();
    console.log("Parsed tree:");
    //printTree(tree); 
    return tree;
  } 
  catch (error) {
    if (error instanceof SyntaxError) {
      toast.error('Chyba při parsování: ' + error.message);
    } else {
      toast.error('Neočekávaná chyba: ' + error.message);
    }
    return null;
  }
  
}
