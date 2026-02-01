/**
 * Represents a formal grammar with productions and symbols.
 * @class
 */
export class Grammar {
  /**
   * Creates a new Grammar instance
   * @param {Object} data - Initial data
   * @param {string} [data.name=''] - Name of the grammar
   * @param {string[]} [data.nonTerminals=[]] - Array of non-terminal symbols
   * @param {string[]} [data.terminals=[]] - Array of terminal symbols
   * @param {Object<string, string[][]>} [data.productions={}] - Production rules
   */
  constructor(data = {}) {
    this.name = data.name || '';
    this.nonTerminals = data.nonTerminals || [];
    this.terminals = data.terminals || [];
    this.productions = data.productions || {};
    // Note: startSymbol is derived as the first nonTerminal, not stored separately
  }
  
  // Method to initialize from JSON data
  static fromJSON(jsonData) {
    // For a single record
    if (!Array.isArray(jsonData)) {
      return new Grammar(jsonData);
    }
    
    // For an array of records
    return jsonData.map(item => new Grammar(item));
  }
  
  // Example method working with the grammar
  getProductionsFor(nonTerminal) {
    return this.productions[nonTerminal] || [];
  }
  
  // Additional methods for working with the grammar
  getAllSymbols() {
    return [...this.terminals, ...this.nonTerminals];
  }
  
  isTerminal(symbol) {
    return this.terminals.includes(symbol);
  }
  
  isNonTerminal(symbol) {
    return this.nonTerminals.includes(symbol);
  }

  toText() {
    let text = '';
    for (const [nonTerminal, productions] of Object.entries(this.productions)) {
      const rightSides = productions.map(production => 
        production.length > 0 ? production.join(' ') : 'ε'
      );
      text += `${nonTerminal} → ${rightSides.join(' | ')}\n`;
    }
    return text.trim();
  }
}