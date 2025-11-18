import { Grammar } from '../../Grammar/Utils/Grammar';

/**
 * Helper class for managing Grammar with conversion-specific methods
 */
export default class ConversionGrammar extends Grammar {
  constructor(startSymbol = "S") {
    super({
      name: 'MCVP Conversion',
      nonTerminals: [startSymbol],
      terminals: [],
      productions: {}
    });
    this.startSymbol = startSymbol;
  }

  addNonTerminal(symbol) {
    if (!this.nonTerminals.includes(symbol)) {
      this.nonTerminals.push(symbol);
    }
  }

  addTerminal(symbol) {
    if (!this.terminals.includes(symbol)) {
      this.terminals.push(symbol);
    }
  }

  addProduction(nonTerminal, production) {
    if (!this.productions[nonTerminal]) {
      this.productions[nonTerminal] = [];
    }
    this.productions[nonTerminal].push(production);
  }

  setProductions(nonTerminal, productions) {
    this.productions[nonTerminal] = productions;
  }

  // Create a serializable copy for state storage
  serialize() {
    return {
      nonTerminals: [...this.nonTerminals],
      terminals: [...this.terminals],
      productions: { ...this.productions },
      startSymbol: this.startSymbol
    };
  }

  // Create a deep copy
  clone() {
    const newGrammar = new ConversionGrammar(this.startSymbol);
    newGrammar.nonTerminals = [...this.nonTerminals];
    newGrammar.terminals = [...this.terminals];
    newGrammar.productions = JSON.parse(JSON.stringify(this.productions));
    return newGrammar;
  }
}