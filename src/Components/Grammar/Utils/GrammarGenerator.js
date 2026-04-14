import { Grammar } from './Grammar.js';

const SINGLE_SIDE_RECURSION_PROBABILITY = 0.2;
const CENTRAL_RECURSION_PROBABILITY = 0.2;

/**
 * Grammar generator configuration object
 * @typedef {Object} GrammarConfig
 * @property {number} nonTerminalCount - Number of non-terminal symbols
 * @property {number} terminalCount - Number of terminal symbols
 * @property {number} maxRuleLength - Maximum length of production rule right-hand side
 * @property {number} [minProductionsPerNonTerminal=1] - Minimum productions per non-terminal
 * @property {number} [maxProductionsPerNonTerminal=3] - Maximum productions per non-terminal
 * @property {boolean} allowLeftRecursion - Whether to allow left recursion
 * @property {boolean} allowRightRecursion - Whether to allow right recursion
 * @property {string} epsilonMode - Epsilon generation mode: 'always', 'never', or 'random'
 */

/**
 * Generates a random context-free grammar based on the provided configuration
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {Grammar} Generated grammar instance
 */
export function generateGrammar(config) {
  validateConfig(config);

  const nonTerminals = generateNonTerminals(config.nonTerminalCount);
  const terminals = generateTerminals(config.terminalCount);
  const productions = generateProductions(nonTerminals, terminals, config);

  if (config.epsilonMode === 'always') {
    ensureEpsilonExists(productions, nonTerminals, config);
  }

  ensureReachability(productions, nonTerminals);

  return new Grammar({
    name: 'Generated Context-Free Grammar',
    nonTerminals,
    terminals,
    productions,
  });
}

/**
 * Ensures that at least one epsilon rule exists in the grammar.
 * @param {Object} productions - The grammar productions
 * @param {string[]} nonTerminals - List of all non-terminals
 * @param {GrammarConfig} config - Configuration parameters
 */
function ensureEpsilonExists(productions, nonTerminals, config) {
  let hasEpsilon = false;

  // Check if epsilon already exists
  for (const nt of nonTerminals) {
    if (productions[nt]) {
      for (const rule of productions[nt]) {
        if (rule.length === 0) {
          hasEpsilon = true;
          break;
        }
      }
    }
    if (hasEpsilon) break;
  }

  // If not, add one to a random non-terminal
  if (!hasEpsilon) {
    const randomNt = getRandomElement(nonTerminals);
    if (!productions[randomNt]) productions[randomNt] = [];

    const maxProductions = config.maxProductionsPerNonTerminal || 3;

    // Replace a random rule when the limit is reached.
    if (productions[randomNt].length >= maxProductions) {
      const replaceIndex = getRandomInt(0, productions[randomNt].length - 1);
      productions[randomNt][replaceIndex] = [];
    } else {
      // Otherwise just add it
      productions[randomNt].push([]);
    }
  }
}

/**
 * Ensures that all non-terminals are reachable from the start symbol (first non-terminal).
 * More efficient implementation: runs BFS once and fixes all unreachable symbols in one pass.
 * @param {Object} productions - The grammar productions
 * @param {string[]} nonTerminals - List of all non-terminals
 */
function ensureReachability(productions, nonTerminals) {
  if (nonTerminals.length === 0) return;

  const startSymbol = nonTerminals[0];

  // 1. Compute Reachable Set (BFS) - only once!
  const reachable = new Set([startSymbol]);
  const queue = [startSymbol];

  while (queue.length > 0) {
    const current = queue.shift();
    const rules = productions[current] || [];

    for (const rule of rules) {
      for (const symbol of rule) {
        if (nonTerminals.includes(symbol) && !reachable.has(symbol)) {
          reachable.add(symbol);
          queue.push(symbol);
        }
      }
    }
  }

  // 2. Identify all unreachable symbols
  const unreachable = nonTerminals.filter((nt) => !reachable.has(nt));
  if (unreachable.length === 0) return;

  // 3. Fix all unreachable symbols in one pass
  const reachableArray = Array.from(reachable);

  for (const targetUnreachable of unreachable) {
    // Pick a reachable non-terminal to modify
    const hostSymbol = getRandomElement(reachableArray);
    const hostRules = productions[hostSymbol];

    if (hostRules && hostRules.length > 0) {
      // Pick a random rule
      const ruleIndex = getRandomInt(0, hostRules.length - 1);
      const rule = hostRules[ruleIndex];

      if (rule.length > 0) {
        // Replace a random symbol in this rule with the unreachable one
        const replaceIndex = getRandomInt(0, rule.length - 1);
        rule[replaceIndex] = targetUnreachable;
      } else {
        // If rule is empty or epsilon, replace entire rule
        hostRules[ruleIndex] = [targetUnreachable];
      }
    } else {
      // Should not happen if generator works, but safety fallback: create new rule
      productions[hostSymbol] = [[targetUnreachable]];
    }
  }
}

/**
 * Validates the configuration parameters
 * @param {GrammarConfig} config - Configuration to validate
 */
function validateConfig(config) {
  const {
    nonTerminalCount,
    terminalCount,
    maxRuleLength,
    minProductionsPerNonTerminal,
    maxProductionsPerNonTerminal,
  } = config;

  if (nonTerminalCount <= 0) throw new Error('Počet neterminálů musí být kladný.');
  if (terminalCount <= 0) throw new Error('Počet terminálů musí být kladný.');
  if (maxRuleLength <= 0) throw new Error('Maximální délka pravidla musí být kladná.');

  if (minProductionsPerNonTerminal !== undefined && maxProductionsPerNonTerminal !== undefined) {
    if (minProductionsPerNonTerminal <= 0)
      throw new Error('Minimální počet pravidel musí být kladný.');
    if (minProductionsPerNonTerminal > maxProductionsPerNonTerminal) {
      throw new Error('Minimální počet pravidel nemůže překročit maximální počet pravidel.');
    }
  }
}

/**
 * Generates an array of non-terminal symbols using uppercase letters (A-Z, then AA-ZZ)
 * @param {number} count - Number of non-terminals to generate
 * @returns {string[]} Array of non-terminal symbols
 */
function generateNonTerminals(count) {
  const symbols = ['S'];
  let currentCode = 65; // ASCII for 'A'

  while (symbols.length < count) {
    let symbol;

    if (currentCode <= 90) {
      // A-Z
      symbol = String.fromCharCode(currentCode);
    } else {
      // Generate AA, AB, etc.
      const index = currentCode - 91;
      const firstChar = Math.floor(index / 26);
      const secondChar = index % 26;
      symbol = String.fromCharCode(65 + firstChar) + String.fromCharCode(65 + secondChar);
    }

    if (symbol !== 'S') {
      symbols.push(symbol);
    }
    currentCode++;
  }
  return symbols;
}

/**
 * Generates an array of terminal symbols using lowercase letters
 * @param {number} count - Number of terminals to generate
 * @returns {string[]} Array of terminal symbols
 */
function generateTerminals(count) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(97 + (i % 26)));
}

/**
 * Generates rules for the grammar
 * @param {string[]} nonTerminals - Array of non-terminal symbols
 * @param {string[]} terminals - Array of terminal symbols
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {Object<string, string[][]>} Object mapping non-terminals to their rules
 */
function generateProductions(nonTerminals, terminals, config) {
  const productions = {};

  nonTerminals.forEach((nonTerminal) => {
    // Use config values or default to 1-3
    const min = config.minProductionsPerNonTerminal || 1;
    const max = config.maxProductionsPerNonTerminal || 3;
    const productionCount = getRandomInt(min, max);

    productions[nonTerminal] = [];

    for (let i = 0; i < productionCount; i++) {
      const production = createProductionRule(nonTerminal, nonTerminals, terminals, config);
      productions[nonTerminal].push(production);
    }
  });

  return productions;
}

/**
 * Creates a single rule
 * @param {string} nonTerminal - Left-hand side non-terminal
 * @param {string[]} nonTerminals - All available non-terminals
 * @param {string[]} terminals - All available terminals
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {string[]} Rule right-hand side
 */
function createProductionRule(nonTerminal, nonTerminals, terminals, config) {
  // Handle epsilon rule based on mode
  const epsilonMode = config.epsilonMode || 'never';

  if (epsilonMode === 'always' && Math.random() < 0.15) {
    return [];
  } else if (epsilonMode === 'random' && Math.random() < 0.08) {
    return [];
  }

  // 1. Decide whether recursion is used.
  let useLeft = false;
  let useRight = false;

  if (config.allowLeftRecursion && config.allowRightRecursion) {
    // Keep central recursion explicit and bounded to about 20% when both toggles are enabled.
    if (Math.random() < CENTRAL_RECURSION_PROBABILITY) {
      useLeft = true;
      useRight = true;
    } else if (Math.random() < SINGLE_SIDE_RECURSION_PROBABILITY) {
      if (Math.random() < 0.5) {
        useLeft = true;
      } else {
        useRight = true;
      }
    }
  } else if (config.allowLeftRecursion) {
    useLeft = Math.random() < SINGLE_SIDE_RECURSION_PROBABILITY;
  } else if (config.allowRightRecursion) {
    useRight = Math.random() < SINGLE_SIDE_RECURSION_PROBABILITY;
  }

  // 2. Validate length budget for recursion.
  const recursionCost = (useLeft ? 1 : 0) + (useRight ? 1 : 0);
  let maxBaseLength = config.maxRuleLength - recursionCost;

  // Drop recursion if it doesn't fit within maxRuleLength with at least one base symbol.
  if (maxBaseLength < 1) {
    useLeft = false;
    useRight = false;
    maxBaseLength = config.maxRuleLength;
  }

  // 3. Generate the base rule
  const ruleLength = getRandomInt(1, maxBaseLength);
  const rule = generateRuleSymbols(ruleLength, nonTerminal, nonTerminals, terminals);

  // 4. Apply Recursion
  if (useLeft) {
    rule.unshift(nonTerminal);
  }
  if (useRight) {
    rule.push(nonTerminal);
  }

  return rule;
}

/**
 * Generates the symbols for a rule's right-hand side
 * @param {number} length - Number of symbols to generate
 * @param {string} currentNonTerminal - The non-terminal being defined (to avoid unwanted recursion)
 * @param {string[]} nonTerminals - Available non-terminals
 * @param {string[]} terminals - Available terminals
 * @returns {string[]} Array of symbols for the rule
 */
function generateRuleSymbols(length, currentNonTerminal, nonTerminals, terminals) {
  const rule = [];

  // Determine which non-terminals can be used
  // Exclude current non-terminal from base rule symbols.
  // Direct recursion (Left/Right) is handled explicitly in createProductionRule based on config.
  let availableNonTerminals = nonTerminals.filter((nt) => nt !== currentNonTerminal);

  for (let j = 0; j < length; j++) {
    // If no non-terminals are available, always use terminal
    if (availableNonTerminals.length === 0) {
      rule.push(getRandomElement(terminals));
    } else if (Math.random() < 0.5) {
      // Add a terminal
      rule.push(getRandomElement(terminals));
    } else {
      // Add a non-terminal
      rule.push(getRandomElement(availableNonTerminals));
    }
  }

  return rule;
}

/**
 * Gets a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets a random element from an array
 * @param {Array} array - The array to select from
 * @returns {*} Random element from the array
 */
function getRandomElement(array) {
  return array[getRandomInt(0, array.length - 1)];
}
