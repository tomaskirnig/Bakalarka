import { Grammar } from './Grammar';

/**
 * Determines if the grammar's language is empty.
 * @param {Grammar} grammar
 * @returns {{
 *   isEmpty: boolean,
 *   productive: string[],
 *   nonproductive: string[],
 *   explanation: string,
 *   derivationTree: Object|null
 * }}
 */
export function isEmptyLanguage(grammar) {
  const productive = new Set();
  const allWitnesses = new Map(); // Stores ALL productive rules: NonTerminal -> [Symbol[][]]
  const { nonTerminals, terminals, productions } = grammar;
  
  // Determine the start symbol (first non-terminal if not explicitly defined)
  const start = nonTerminals.length > 0 ? nonTerminals[0] : null;
  
  if (!start) {
    return {
      isEmpty: true,
      productive: [],
      nonproductive: nonTerminals,
      explanation: "Gramatika je prázdná: není definován počáteční symbol.",
      derivationTree: null
    };
  }
  
  // Normalize rules into a flat list [{ left, right }]
  const rules = Array.isArray(productions)
    ? productions
    : Object.entries(productions).flatMap(([left, rights]) =>
        rights.map(right => ({ left, right }))
      );

  // Helper: can this right produce terminals given current productive set?
  function rightIsProductive(right) {
    return right.length === 0 || right.every(sym => terminals.includes(sym) || productive.has(sym));
  }

  // 1) Seed the queue with any nonterminal that has a terminal-only (or ε) rule
  const queue = [];
  for (const { left, right } of rules) {
    if (!productive.has(left) && rightIsProductive(right)) {
      productive.add(left);
      allWitnesses.set(left, [right]);
      queue.push(left);
    } else if (productive.has(left) && rightIsProductive(right)) {
      // Add additional productive rules for already productive nonterminals
      allWitnesses.get(left).push(right);
    }
  }

  // 2) Process the work-list: whenever a new NT becomes productive,
  //    re-examine any rules whose right include that NT.
  while (queue.length > 0) {
    const newlyProd = queue.shift();

    for (const { left, right } of rules) {
      if (!productive.has(left) && right.includes(newlyProd) && rightIsProductive(right)) {
        productive.add(left);
        allWitnesses.set(left, [right]);
        queue.push(left);
      } else if (productive.has(left) && right.includes(newlyProd) && rightIsProductive(right)) {
        // Add additional productive rules
        const currentWitnesses = allWitnesses.get(left) || [];
        if (!currentWitnesses.some(w => JSON.stringify(w) === JSON.stringify(right))) {
          currentWitnesses.push(right);
        }
      }
    }
  }

  const isEmpty = !productive.has(start);
  
  // Construct Derivation Tree if not empty
  let derivationTree = null;
  let derivedWord = '';
  
  if (!isEmpty) {
      let idCounter = 0;
      const MAX_DEPTH = 30; // Prevent infinite recursion and visualization stack overflow
      
      // Helper to randomly select one production from available options
      const selectRandomProduction = (symbol, depth) => {
          const availableProductions = allWitnesses.get(symbol);
          if (!availableProductions || availableProductions.length === 0) return null;
          
          // If depth is getting high, prefer non-recursive productions
          if (depth > 20) {
              // Filter for productions that don't contain the symbol itself (non-recursive)
              const nonRecursive = availableProductions.filter(prod => 
                  !prod.some(sym => sym === symbol)
              );
              
              if (nonRecursive.length > 0) {
                  // Strongly prefer non-recursive rules when deep
                  const randomIndex = Math.floor(Math.random() * nonRecursive.length);
                  return nonRecursive[randomIndex];
              }
          }
          
          // Normal random selection with equal probability
          const randomIndex = Math.floor(Math.random() * availableProductions.length);
          return availableProductions[randomIndex];
      };
      
      const buildNode = (symbol, depth = 0) => {
          // Prevent infinite recursion
          if (depth > MAX_DEPTH) {
              throw new Error(`Překročena maximální hloubka derivace (${MAX_DEPTH}). Gramatika pravděpodobně obsahuje nekonečnou rekurzi.`);
          }
          
          const node = { 
              name: symbol,
              id: `node_${idCounter++}`, // Unique ID for visualization
              attributes: {}
          };
          
          if (terminals.includes(symbol)) {
              node.attributes.type = 'terminal';
          } else if (symbol === 'ε') {
              node.attributes.type = 'epsilon';
          } else if (allWitnesses.has(symbol)) {
              node.attributes.type = 'non-terminal';
              const rhs = selectRandomProduction(symbol, depth);
              if (!rhs) {
                  // Shouldn't happen if witnesses are properly set
                  node.attributes.type = 'terminal';
              } else if (rhs.length === 0) {
                  // Implicit epsilon
                  node.children = [{ 
                      name: 'ε', 
                      id: `node_${idCounter++}`, 
                      attributes: { type: 'epsilon' } 
                  }];
              } else {
                  node.children = rhs.map(s => buildNode(s, depth + 1));
              }
          } else {
              // Fallback for symbols that might be in RHS but not in terminals list explicitly?
              // Or if logic is slightly off. Assume terminal or error.
              node.attributes.type = 'terminal'; 
          }
          return node;
      };
      
      try {
          derivationTree = buildNode(start);
      } catch (error) {
          // If we hit recursion limit, return error info
          return {
              isEmpty: false,
              productive: [...productive],
              nonproductive: nonTerminals.filter(nt => !productive.has(nt)),
              explanation: `Gramatika definuje neprázdný jazyk, ale nepodařilo se vygenerovat ukázkový strom: ${error.message}`,
              derivationTree: null,
              derivedWord: ''
          };
      }
      
      // Extract the derived word (terminal symbols from left to right)
      const extractTerminals = (node) => {
          if (!node) return '';
          
          if (node.attributes?.type === 'terminal') {
              return node.name;
          } else if (node.attributes?.type === 'epsilon') {
              return ''; // Epsilon contributes nothing to the word
          } else if (node.children && node.children.length > 0) {
              return node.children.map(child => extractTerminals(child)).join('');
          }
          return '';
      };
      
      derivedWord = extractTerminals(derivationTree);
  }

  return {
    isEmpty,
    productive: [...productive],
    nonproductive: nonTerminals.filter(nt => !productive.has(nt)),
    explanation: isEmpty
      ? `Gramatika definuje prázdný jazyk: počáteční symbol "${start}" nemůže derivovat žádný terminální řetězec.`
      : `Gramatika definuje neprázdný jazyk: počáteční symbol "${start}" může derivovat alespoň jeden terminální řetězec.`,
    derivationTree,
    derivedWord
  };
}

