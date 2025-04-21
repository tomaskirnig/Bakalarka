/**
 * Grammar generator configuration object
 * @typedef {Object} GrammarConfig
 * @property {number} nonTerminalCount - Number of non-terminal symbols
 * @property {number} terminalCount - Number of terminal symbols
 * @property {number} maxRuleLength - Maximum length of production rule right-hand side
 * @property {number} minProductionsPerNonTerminal - Minimum productions per non-terminal
 * @property {number} maxProductionsPerNonTerminal - Maximum productions per non-terminal
 * @property {boolean} allowLeftRecursion - Whether to allow left recursion
 * @property {boolean} allowRightRecursion - Whether to allow right recursion
 * @property {boolean} allowEpsilonRules - Whether to allow empty productions
 */

/**
 * Generates a random context-free grammar based on the provided configuration
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {Object} Generated grammar object
 */
export function generateGrammar(config) {
  validateConfig(config);

  const nonTerminals = generateNonTerminals(config.nonTerminalCount);
  const terminals = generateTerminals(config.terminalCount);
  const productions = generateProductions(nonTerminals, terminals, config);

  return formatGrammarOutput(nonTerminals, terminals, productions);
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

  if (nonTerminalCount <= 0) throw new Error('Non-terminal count must be positive');
  if (terminalCount <= 0) throw new Error('Terminal count must be positive');
  if (maxRuleLength <= 0) throw new Error('Max rule length must be positive');
  if (minProductionsPerNonTerminal <= 0) throw new Error('Min productions must be positive');
  if (minProductionsPerNonTerminal > maxProductionsPerNonTerminal) {
    throw new Error('Min productions cannot exceed max productions');
  }
}

/**
 * Generates an array of non-terminal symbols
 * @param {number} count - Number of non-terminals to generate
 * @returns {string[]} Array of non-terminal symbols
 */
function generateNonTerminals(count) {
  return Array.from({ length: count }, (_, i) => `N${i + 1}`);
}

/**
 * Generates an array of terminal symbols
 * @param {number} count - Number of terminals to generate
 * @returns {string[]} Array of terminal symbols
 */
function generateTerminals(count) {
  return Array.from({ length: count }, (_, i) => `t${i + 1}`);
}

/**
 * Generates production rules for the grammar
 * @param {string[]} nonTerminals - Array of non-terminal symbols
 * @param {string[]} terminals - Array of terminal symbols
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {Object[]} Array of production rule objects
 */
function generateProductions(nonTerminals, terminals, config) {
  const productions = [];
  
  nonTerminals.forEach(nonTerminal => {
    const productionCount = getRandomInt(
      config.minProductionsPerNonTerminal, 
      config.maxProductionsPerNonTerminal
    );

    for (let i = 0; i < productionCount; i++) {
      const production = createProduction(nonTerminal, nonTerminals, terminals, config);
      productions.push(production);
    }
  });
  
  return productions; 
}

/**
 * Creates a single production rule
 * @param {string} nonTerminal - Left-hand side non-terminal
 * @param {string[]} nonTerminals - All available non-terminals
 * @param {string[]} terminals - All available terminals
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {Object} Production rule object with left and right properties
 */
function createProduction(nonTerminal, nonTerminals, terminals, config) {
  // Handle epsilon rule case
  if (config.allowEpsilonRules && Math.random() < 0.1) {
    return { left: nonTerminal, right: [] };
  }

  // Create regular rule
  const ruleLength = getRandomInt(1, config.maxRuleLength);
  let rule = generateRuleSymbols(ruleLength, nonTerminals, terminals);
  
  // Apply recursion if configured
  rule = applyRecursion(rule, nonTerminal, config);
  
  return { left: nonTerminal, right: rule };
}

/**
 * Generates the symbols for a rule's right-hand side
 * @param {number} length - Number of symbols to generate
 * @param {string[]} nonTerminals - Available non-terminals
 * @param {string[]} terminals - Available terminals
 * @returns {string[]} Array of symbols for the rule
 */
function generateRuleSymbols(length, nonTerminals, terminals) {
  const rule = [];
  
  for (let j = 0; j < length; j++) {
    if (Math.random() < 0.5) {
      // Add a terminal
      rule.push(getRandomElement(terminals));
    } else {
      // Add a non-terminal
      rule.push(getRandomElement(nonTerminals));
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
  
  if (config.allowLeftRecursion && Math.random() < 0.3) {
    result.unshift(nonTerminal); // Add left recursion
  }
  
  if (config.allowRightRecursion && Math.random() < 0.3) {
    result.push(nonTerminal); // Add right recursion
  }
  
  return result;
}

/**
 * Formats the final grammar output object
 * @param {string[]} nonTerminals - Non-terminal symbols
 * @param {string[]} terminals - Terminal symbols
 * @param {Object[]} productions - Production rules
 * @returns {Object} Formatted grammar object
 */
function formatGrammarOutput(nonTerminals, terminals, productions) {
  return {
    name: "Generated Context-Free Grammar",
    description: "A randomly generated context-free grammar",
    startSymbol: nonTerminals[0],
    nonTerminals,
    terminals,
    productions
  };
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