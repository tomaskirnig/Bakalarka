/**
 * Generates a sequence of steps describing the iterative evaluation of grammar emptiness.
 * @param {Object} grammar - The grammar object with nonTerminals, terminals, productions.
 * @returns {Array} Array of step objects.
 */
export function generateGrammarSteps(grammar) {
  const steps = [];
  const productive = new Set();
  const { nonTerminals, terminals, productions } = grammar;
  const terminalSet = new Set(terminals);

  const formatRule = (left, right) => `${left} → ${right.length === 0 ? 'ε' : right.join(' ')}`;

  const start = nonTerminals.length > 0 ? nonTerminals[0] : null;

  if (!start) {
    steps.push({
      type: 'ERROR',
      description: 'Gramatika nemá definovaný žádný neterminál (a tedy ani počáteční symbol).',
      productive: [],
      currentRule: null,
    });
    return steps;
  }

  // Normalize rules
  const rules = Array.isArray(productions)
    ? productions
    : Object.entries(productions).flatMap(([left, rights]) =>
        rights.map((right) => ({ left, right }))
      );

  // Initial State
  steps.push({
    type: 'INIT',
    description: 'Inicializace: Množina produktivních neterminálů je prázdná.',
    productive: [],
    currentRule: null,
  });

  // Queue-based work-list algorithm.
  const queue = [];

  // 1. Initial Scan
  steps.push({
    type: 'SCAN_START',
    description: 'Fáze 1: Hledání pravidel, která obsahují pouze terminály.',
    productive: [],
    currentRule: null,
  });

  for (const rule of rules) {
    const { left, right } = rule;
    const ruleStr = formatRule(left, right);

    // Check if right side consists purely of terminals (or is epsilon)
    const isTerminalOnly =
      right.length === 0 ||
      (right.length === 1 && right[0] === 'ε') ||
      right.every((sym) => terminalSet.has(sym));

    if (isTerminalOnly) {
      if (!productive.has(left)) {
        productive.add(left);
        queue.push(left);
        steps.push({
          type: 'FOUND_TERMINAL_RULE',
          description: `Pravidlo "${ruleStr}" obsahuje pouze terminály. "${left}" je produktivní.`,
          productive: [...productive],
          currentRule: ruleStr,
          highlight: 'success',
        });
      } else {
        // Already productive, but another terminal-only rule was found.
        steps.push({
          type: 'CHECK_RULE',
          description: `Pravidlo "${ruleStr}" obsahuje pouze terminály ( "${left}" je již produktivní).`,
          productive: [...productive],
          currentRule: ruleStr,
          highlight: 'neutral',
        });
      }
    } else {
      steps.push({
        type: 'CHECK_RULE',
        description: `Pravidlo "${ruleStr}" obsahuje neterminály. Zatím nelze rozhodnout.`,
        productive: [...productive],
        currentRule: ruleStr,
        highlight: 'neutral',
      });
    }
  }

  // Check if all non-terminals are already productive after the first scan
  const allProductive = nonTerminals.every((nt) => productive.has(nt));

  if (allProductive) {
    // Early termination: all non-terminals are productive
    const isEmpty = !productive.has(start);
    steps.push({
      type: 'FINISHED',
      description: isEmpty
        ? `Hotovo. Počáteční symbol "${start}" není v množině produktivních symbolů. Jazyk je PRÁZDNÝ.`
        : `Hotovo. Všechny neterminály jsou produktivní již po první fázi. Počáteční symbol "${start}" je produktivní. Jazyk je NEPRÁZDNÝ.`,
      productive: [...productive],
      currentRule: null,
      result: !isEmpty,
    });
    return steps;
  }

  // 2. Iterative Fixed-Point Phase
  let changed = true;
  let iteration = 1;

  while (changed) {
    changed = false;
    let foundInThisIteration = false;

    // Optimization: if all non-terminals are already productive, we can stop early
    if (productive.size === nonTerminals.length) {
      break;
    }

    steps.push({
      type: 'ITERATION_START',
      description: `Probíhá ${iteration}. průchod pravidly. Vyhledávání neterminálů, které jsou nově produktivní.`,
      productive: [...productive],
      currentRule: null,
    });

    for (const rule of rules) {
      const { left, right } = rule;
      if (productive.has(left)) continue; // Already productive, skip

      const ruleStr = formatRule(left, right);

      // Check if this rule is NOW fully productive
      const isProductive =
        right.length === 0 ||
        (right.length === 1 && right[0] === 'ε') ||
        right.every((sym) => terminalSet.has(sym) || productive.has(sym));

      if (isProductive) {
        productive.add(left);
        changed = true;
        foundInThisIteration = true;
        steps.push({
          type: 'NEW_PRODUCTIVE',
          description: `Pravidlo "${ruleStr}" je nově produktivní. Neterminál "${left}" byl přidán do množiny produktivních symbolů P.`,
          productive: [...productive],
          currentRule: ruleStr,
          highlight: 'success',
        });
      }
    }

    if (!foundInThisIteration && changed === false) {
      steps.push({
        type: 'ITERATION_END',
        description: `V tomto průchodu nebyl nalezen žádný nový produktivní neterminál. Algoritmus končí.`,
        productive: [...productive],
        currentRule: null,
      });
    } else {
      iteration++;
    }
  }

  // Final Result
  const isEmpty = !productive.has(start);
  steps.push({
    type: 'FINISHED',
    description: isEmpty
      ? `Hotovo. Počáteční symbol "${start}" není v množině produktivních symbolů. Jazyk je PRÁZDNÝ.`
      : `Hotovo. Počáteční symbol "${start}" je produktivní. Jazyk je NEPRÁZDNÝ.`,
    productive: [...productive],
    currentRule: null,
    result: !isEmpty,
  });

  return steps;
}
