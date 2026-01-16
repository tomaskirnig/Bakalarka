import { Grammar } from './Grammar.js';

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

  return new Grammar({
    name: "Generated Context-Free Grammar",
    nonTerminals,
    terminals,
    productions
  });
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
    maxProductionsPerNonTerminal
  } = config;

  if (nonTerminalCount <= 0) throw new Error('Počet neterminálů musí být kladný.');
  if (terminalCount <= 0) throw new Error('Počet terminálů musí být kladný.');
  if (maxRuleLength <= 0) throw new Error('Maximální délka pravidla musí být kladná.');
  
  if (minProductionsPerNonTerminal !== undefined && maxProductionsPerNonTerminal !== undefined) {
    if (minProductionsPerNonTerminal <= 0) throw new Error('Minimální počet pravidel musí být kladný.');
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
  const symbols = [];
  for (let i = 0; i < count; i++) {
    if (i < 26) {
      // Single letters A-Z
      symbols.push(String.fromCharCode(65 + i));
    } else {
      // Double letters AA, AB, ..., ZZ
      const firstChar = Math.floor((i - 26) / 26);
      const secondChar = (i - 26) % 26;
      symbols.push(String.fromCharCode(65 + firstChar) + String.fromCharCode(65 + secondChar));
    }
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
  
  nonTerminals.forEach(nonTerminal => {
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
    return ['ε'];
  } else if (epsilonMode === 'random' && Math.random() < 0.08) {
    return ['ε'];
  }
  
  // Create regular rule
  const ruleLength = getRandomInt(1, config.maxRuleLength);
  let rule = generateRuleSymbols(ruleLength, nonTerminal, nonTerminals, terminals, config);
  
  // Apply additional recursion at start/end if configured
  rule = applyRecursion(rule, nonTerminal, config);
  
  return rule;
}

/**
 * Generates the symbols for a rule's right-hand side
 * @param {number} length - Number of symbols to generate
 * @param {string} currentNonTerminal - The non-terminal being defined (to avoid unwanted recursion)
 * @param {string[]} nonTerminals - Available non-terminals
 * @param {string[]} terminals - Available terminals
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {string[]} Array of symbols for the rule
 */
function generateRuleSymbols(length, currentNonTerminal, nonTerminals, terminals, config) {
  const rule = [];
  
  // Determine which non-terminals can be used
  let availableNonTerminals = nonTerminals;
  
  // If both recursions are completely disabled, use terminals only (no nonterminals at all)
  if (!config.allowLeftRecursion && !config.allowRightRecursion) {
    availableNonTerminals = [];
  }
  
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
 * Applies recursion to a rule based on configuration
 * @param {string[]} rule - The rule to potentially make recursive
 * @param {string} nonTerminal - The non-terminal for creating recursion
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {string[]} Potentially modified rule with recursion
 */
function applyRecursion(rule, nonTerminal, config) {
  let result = [...rule];
  
  // Only apply recursion if explicitly allowed
  if (config.allowLeftRecursion === true && Math.random() < 0.3) {
    result.unshift(nonTerminal); // Add left recursion
  }
  
  if (config.allowRightRecursion === true && Math.random() < 0.3) {
    result.push(nonTerminal); // Add right recursion
  }
  
  return result;
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