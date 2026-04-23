/**
 * @fileoverview Core logic for converting MCVP tree to Context-Free Grammar.
 * This module contains only the pure logic, separated from UI and step generation.
 */

import ConversionGrammar from './ConversionGrammar';

/**
 * Generates non-terminal symbols deterministically.
 */
export class NonTerminalGenerator {
  constructor() {
    this.currentCode = 65; // ASCII for 'A'
    this.nodeMap = new Map();
    this.generatedSymbols = new Set(['S']); // S is reserved for start
  }

  generateNextSymbol() {
    let symbol;
    do {
      if (this.currentCode <= 90) {
        symbol = String.fromCharCode(this.currentCode);
      } else {
        const index = this.currentCode - 91;
        const firstChar = Math.floor(index / 26);
        const secondChar = index % 26;
        symbol = String.fromCharCode(65 + firstChar) + String.fromCharCode(65 + secondChar);
      }
      this.currentCode++;
    } while (this.generatedSymbols.has(symbol) || symbol === 'S');

    this.generatedSymbols.add(symbol);
    return symbol;
  }

  getSymbolForNode(node, startSymbol = null) {
    if (this.nodeMap.has(node)) {
      return this.nodeMap.get(node);
    }

    let symbol;
    if (startSymbol) {
      symbol = startSymbol;
      this.generatedSymbols.add(symbol);
    } else {
      symbol = this.generateNextSymbol();
    }

    this.nodeMap.set(node, symbol);
    return symbol;
  }

  getSymbol(node) {
    return this.nodeMap.get(node);
  }

  getAllSymbols() {
    return Array.from(this.nodeMap.entries()).map(([node, symbol]) => ({
      node,
      result: symbol,
    }));
  }
}

/**
 * Generates terminal symbols deterministically.
 */
export class TerminalGenerator {
  constructor() {
    this.terminals = 'abcdefghijklmnopqrstuvwxyz+-=*#@$%&!?<>[]{}()'.split('');
    this.currentIndex = 0;
    this.variableMap = new Map();
  }

  getTerminalForVariable(variable) {
    if (this.variableMap.has(variable)) {
      return this.variableMap.get(variable);
    }

    if (this.currentIndex >= this.terminals.length) {
      const terminal = `t${this.currentIndex - this.terminals.length + 1}`;
      this.variableMap.set(variable, terminal);
      this.currentIndex++;
      return terminal;
    }

    const terminal = this.terminals[this.currentIndex];
    this.variableMap.set(variable, terminal);
    this.currentIndex++;
    return terminal;
  }

  getAllSymbols() {
    return Array.from(this.variableMap.entries()).map(([node, symbol]) => ({
      node,
      result: symbol,
    }));
  }
}

/**
 * Core conversion function from MCVP to Grammar.
 *
 * @param {Object} mcvpTree - The root node of the MCVP tree
 * @param {Object} options - Conversion options
 * @returns {Object} The grammar object
 */
export function convertMCVPToGrammarCore(mcvpTree, options = {}) {
  if (!mcvpTree) return null;

  const grammar = new ConversionGrammar();
  const symbolGenerator = new NonTerminalGenerator();
  const terminalGenerator = new TerminalGenerator();
  const epsilonChance = options.epsilonChance !== undefined ? options.epsilonChance : 0.15;

  const trueVariableResolution = new Map();

  function resolveTrueVariable(node) {
    if (trueVariableResolution.has(node)) return trueVariableResolution.get(node);

    let resolution;
    // For core, we can use a deterministic "random" based on ID if we want to be truly deterministic
    // but for now let's just use 0 (disable epsilon) or a simple rule to keep it stable.
    // The plan says "deterministicky", so let's use node.id or just disable it if not requested.
    const shouldBeEpsilon = epsilonChance > 0 && (node.id ? hashString(node.id) % 100 < epsilonChance * 100 : false);

    if (shouldBeEpsilon) {
      resolution = { type: 'epsilon' };
    } else {
      const terminal = terminalGenerator.getTerminalForVariable(node);
      grammar.addTerminal(terminal);
      resolution = { type: 'terminal', terminal };
    }

    trueVariableResolution.set(node, resolution);
    return resolution;
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getProductionSymbolsForTrueVariable(node) {
    const resolution = resolveTrueVariable(node);
    return resolution.type === 'epsilon' ? [] : [resolution.terminal];
  }

  function processNodes(node, forcedSymbol = null) {
    if (!node) return;

    const isOperationNode = node.type === 'operation';
    const isFalseVariableNode = node.type === 'variable' && node.varValue === 0;

    if (isOperationNode || isFalseVariableNode) {
      const nodeSymbol = symbolGenerator.getSymbolForNode(node, forcedSymbol);
      grammar.addNonTerminal(nodeSymbol);
    }

    if (node.children) {
      node.children.forEach((child) => processNodes(child));
    }
  }

  function createProductions(node) {
    if (!node) return;

    const nodeSymbol = symbolGenerator.getSymbol(node);
    const isRootTrueVariable = node === mcvpTree && node.type === 'variable' && node.varValue === 1;

    if (node.type === 'variable') {
      if (node.varValue === 1) {
        if (isRootTrueVariable) {
          const rootProduction = getProductionSymbolsForTrueVariable(node);
          grammar.setProductions(grammar.startSymbol, [rootProduction]);
        }
      } else {
        grammar.setProductions(nodeSymbol, [[nodeSymbol]]);
      }
    } else {
      // Operation node
      const nodeSymbol = symbolGenerator.getSymbol(node);
      if (node.value === 'A' || node.value === 'AND' || node.value === '∧') {
        const childSymbols = node.children
          .filter((c) => c != null)
          .flatMap((child) => {
            if (child.type === 'variable' && child.varValue === 1) {
              return getProductionSymbolsForTrueVariable(child);
            }
            return [symbolGenerator.getSymbol(child)];
          });
        grammar.setProductions(nodeSymbol, [childSymbols]);
      } else {
        // OR node
        const productions = node.children
          .filter((c) => c != null)
          .map((child) => {
            if (child.type === 'variable' && child.varValue === 1) {
              return getProductionSymbolsForTrueVariable(child);
            }
            return [symbolGenerator.getSymbol(child)];
          });
        grammar.setProductions(nodeSymbol, productions);
      }
    }

    if (node.children) {
      node.children.forEach((child) => createProductions(child));
    }
  }

  processNodes(mcvpTree, 'S');
  createProductions(mcvpTree);

  return grammar;
}
