import { Node } from "./NodeClass";

// Convert input string to tokens - [kind, value] (like ['VARIABLE', 'x1'] or ['OPERATOR', 'A']).
function tokenize(s) {
  // Remove spaces
  s = s.replace(/\s+/g, '');

  // Define token patterns
  const tokenSpecification = [
    ['LPAREN', /\(/],
    ['RPAREN', /\)/],
    ['OPERATOR', /A|O/],
    ['VARIABLE', /x\d+(?:\[\d\])?/],  // Matches x followed by digits, optional [digit]
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
      alert('Neočekávaný znak ' + s[pos] + ' na pozici ' + pos);
      throw new SyntaxError(`Unexpected character ${s[pos]} at position ${pos}`);
    }
  }
  
  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse() {
    const node = this.parseExpression();
    if (this.pos !== this.tokens.length) {
      alert('Chybná syntaxe vstupu!');
      throw new SyntaxError('Unexpected tokens at end of input');
    }
    return node;
  }

  parseExpression() {
    return this.parseOrExpr();
  }

  parseOrExpr() {
    let node = this.parseAndExpr();
    while (this.currentTokenIs('OPERATOR', 'O')) {
      this.consume('OPERATOR', 'O');
      const right = this.parseAndExpr();
      node = new Node('O', node, right, null, null, 'operation');
    }
    return node;
  }

  parseAndExpr() {
    let node = this.parseFactor();
    while (this.currentTokenIs('OPERATOR', 'A')) {
      this.consume('OPERATOR', 'A');
      const right = this.parseFactor();
      node = new Node('A', node, right, null, null, 'operation');
    }
    return node;
  }

  parseFactor() {
    if (this.currentTokenIs('VARIABLE')) {
      const varToken = this.consume('VARIABLE');
      const [varName, varValue] = this.parseVariable(varToken[1]);
      return new Node(varName, null, null, varValue, null, 'variable');
    } 
    else if (this.currentTokenIs('LPAREN')) {
      this.consume('LPAREN');
      const node = this.parseExpression();
      this.consume('RPAREN');
      return node;
    } 
    else {
      throw new SyntaxError(`Expected VARIABLE or LPAREN, got ${this.currentToken()[0]}`);
    }
  }

  parseVariable(varStr) {
    const match = varStr.match(/(x\d+)(?:\[(\d)\])?/);
    if (match) {
      const varName = match[1];
      const varValue = match[2] !== undefined ? Number(match[2]) : null;
      return [varName, varValue];
    } else {
      throw new SyntaxError(`Invalid variable ${varStr}`);
    }
  }

  currentToken() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    } else {
      return ['EOF', ''];
    }
  }

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

  consume(kind, value = null) {
    const tok = this.currentToken();
    if (tok[0] !== kind) {
      throw new SyntaxError(`Expected token ${kind}, got ${tok[0]}`);
    }
    if (value !== null && tok[1] !== value) {
      throw new SyntaxError(`Expected token value ${value}, got ${tok[1]}`);
    }
    this.pos += 1;
    return tok;
  }
}

export function printTree(node, indent = 0) {
  if (node !== null) {
    console.log(' '.repeat(indent) + node.value + (node.varValue !== null ? `[${node.varValue}]` : ''));
    if (node.left || node.right) {
      if (node.left) printTree(node.left, indent + 2);
      if (node.right) printTree(node.right, indent + 2);
    }
  }
}

export function parseExpressionToTree(exprStr) {
  const tokens = tokenize(exprStr);
  const parser = new Parser(tokens);
  const tree = parser.parse();
  return tree;
}

//   // Example usage
//   const expr = '(x1[0] O x2[1]) A (x3[1] A x4[1])';
//   const tree = parseExpressionToTree(expr);
//   printTree(tree);
