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
  const witnesses = new Map(); // Stores the production body used to prove productivity: NonTerminal -> Symbol[]
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
  
  // Normalize productions into a flat list [{ left, right }]
  const rules = Array.isArray(productions)
    ? productions
    : Object.entries(productions).flatMap(([left, rights]) =>
        rights.map(right => ({ left, right }))
      );

  // Helper: can this right produce terminals given current productive set?
  function rightIsProductive(right) {
    return right.length === 0 || right.every(sym => terminals.includes(sym) || productive.has(sym));
  }

  // 1) Seed the queue with any nonterminal that has a terminal-only (or ε) production
  const queue = [];
  for (const { left, right } of rules) {
    if (!productive.has(left) && rightIsProductive(right)) {
      productive.add(left);
      witnesses.set(left, right);
      queue.push(left);
    }
  }

  // 2) Process the work-list: whenever a new NT becomes productive,
  //    re-examine any rules whose right include that NT.
  while (queue.length > 0) {
    const newlyProd = queue.shift();
    // Early exit if we've made the start productive
    if (newlyProd === start) break;

    for (const { left, right } of rules) {
      if (!productive.has(left) && right.includes(newlyProd) && rightIsProductive(right)) {
        productive.add(left);
        witnesses.set(left, right);
        queue.push(left);
        // Also exit early if it's the start symbol
        if (left === start) { queue.length = 0; break; }
      }
    }
  }

  const isEmpty = !productive.has(start);
  
  // Construct Derivation Tree if not empty
  let derivationTree = null;
  if (!isEmpty) {
      let idCounter = 0;
      const buildNode = (symbol) => {
          const node = { 
              name: symbol,
              id: `node_${idCounter++}`, // Unique ID for visualization
              attributes: {}
          };
          
          if (terminals.includes(symbol)) {
              node.attributes.type = 'terminal';
          } else if (symbol === 'ε') {
              node.attributes.type = 'epsilon';
          } else if (witnesses.has(symbol)) {
              node.attributes.type = 'non-terminal';
              const rhs = witnesses.get(symbol);
              if (rhs.length === 0) {
                  // Implicit epsilon
                  node.children = [{ 
                      name: 'ε', 
                      id: `node_${idCounter++}`, 
                      attributes: { type: 'epsilon' } 
                  }];
              } else {
                  node.children = rhs.map(s => buildNode(s));
              }
          } else {
              // Fallback for symbols that might be in RHS but not in terminals list explicitly?
              // Or if logic is slightly off. Assume terminal or error.
              node.attributes.type = 'terminal'; 
          }
          return node;
      };
      derivationTree = buildNode(start);
  }

  return {
    isEmpty,
    productive: [...productive],
    nonproductive: nonTerminals.filter(nt => !productive.has(nt)),
    explanation: isEmpty
      ? `Gramatika definuje prázdný jazyk: počáteční symbol "${start}" nemůže derivovat žádný terminální řetězec.`
      : `Gramatika definuje neprázdný jazyk: počáteční symbol "${start}" může derivovat alespoň jeden terminální řetězec.`,
    derivationTree
  };
}

