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

  ensureReachability(productions, nonTerminals, terminals);

  return new Grammar({
    name: "Generated Context-Free Grammar",
    nonTerminals,
    terminals,
    productions
  });
}

/**
 * Ensures that all non-terminals are reachable from the start symbol (first non-terminal).
 * If a non-terminal is unreachable, it modifies a rule of a reachable non-terminal to include it.
 * @param {Object} productions - The grammar productions
 * @param {string[]} nonTerminals - List of all non-terminals
 */
function ensureReachability(productions, nonTerminals) {
    if (nonTerminals.length === 0) return;
    
    const startSymbol = nonTerminals[0];
    
    // Iteratively fix unreachable symbols
    // Loop limit prevents infinite loops in pathological cases
    let iterations = 0;
    while (iterations < nonTerminals.length * 2) {
        // 1. Compute Reachable Set (BFS)
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
        
        // 2. Identify Unreachable
        const unreachable = nonTerminals.filter(nt => !reachable.has(nt));
        if (unreachable.length === 0) break; // All done!
        
        // 3. Fix one unreachable symbol
        const targetUnreachable = unreachable[0];
        
        // Pick a reachable non-terminal to modify
        const reachableArray = Array.from(reachable);
        const hostSymbol = getRandomElement(reachableArray);
        const hostRules = productions[hostSymbol];
        
        if (hostRules && hostRules.length > 0) {
            // Pick a random rule
            const ruleIndex = getRandomInt(0, hostRules.length - 1);
            const rule = hostRules[ruleIndex];
            
            if (rule.length > 0 && rule[0] !== 'ε') {
                // Replace a random symbol in this rule with the unreachable one
                const replaceIndex = getRandomInt(0, rule.length - 1);
                rule[replaceIndex] = targetUnreachable;
            } else {
                // If rule is empty or epsilon, just append (or replace epsilon)
                // Note: Replacing epsilon with a non-terminal changes the language, but ensures reachability.
                hostRules[ruleIndex] = [targetUnreachable]; 
            }
        } else {
             // Should not happen if generator works, but safety fallback: create new rule
             productions[hostSymbol] = [[targetUnreachable]];
        }
        
        iterations++;
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
  
  // 1. Determine if we WANT recursion
  let useLeft = config.allowLeftRecursion && Math.random() < 0.3;
  let useRight = config.allowRightRecursion && Math.random() < 0.3;
  
  // 2. Check if we have SPACE for recursion
  const recursionCost = (useLeft ? 1 : 0) + (useRight ? 1 : 0);
  let maxBaseLength = config.maxRuleLength - recursionCost;
  
  // If the requested recursion leaves no room for base symbols (or negative room),
  // we must disable recursion to respect the strict maxRuleLength.
  // Exception: If maxRuleLength is large enough but we just hit a random edge case?
  // Here we simplify: if we can't fit minimal base (1) + recursion, drop recursion.
  if (maxBaseLength < 1) {
      useLeft = false;
      useRight = false;
      maxBaseLength = config.maxRuleLength;
  }
  
  // 3. Generate the base rule
  const ruleLength = getRandomInt(1, maxBaseLength);
  const rule = generateRuleSymbols(ruleLength, nonTerminal, nonTerminals, terminals, config);
  
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
 * @param {GrammarConfig} config - Configuration parameters
 * @returns {string[]} Array of symbols for the rule
 */
function generateRuleSymbols(length, currentNonTerminal, nonTerminals, terminals, config) {
  const rule = [];
  
  // Determine which non-terminals can be used
  // We exclude the current non-terminal to prevent accidental direct recursion in the base rule.
  // Direct recursion (Left/Right) is handled explicitly in createProductionRule based on config.
  let availableNonTerminals = nonTerminals.filter(nt => nt !== currentNonTerminal);
  
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