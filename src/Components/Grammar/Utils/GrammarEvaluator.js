/**
 * Builds a small finite derivation witness for a productive start symbol.
 *
 * The helper chooses productions using a constructive shortest-derivation heuristic
 * and then builds the tree iteratively (non-recursively) for robustness.
 *
 * @param {string} start
 * @param {string[]} nonTerminals
 * @param {string[]} terminals
 * @param {Map<string, string[][]>} allWitnesses Productive rules grouped by nonterminal.
 * @returns {{ derivationTree: Object, derivedWord: string }}
 */
function buildDerivationTree(start, nonTerminals, terminals, allWitnesses) {
  const nonTerminalSet = new Set(nonTerminals);
  const INF = Number.POSITIVE_INFINITY;
  const productiveRules = Array.from(allWitnesses.entries()).flatMap(([left, rights]) =>
    rights.map((right) => ({ left, right }))
  );

  const symbolCost = (sym, distance) => {
    if (sym === 'ε') return 0;
    if (terminals.includes(sym)) return 1;
    if (nonTerminalSet.has(sym)) return distance.get(sym) ?? INF;
    return INF;
  };

  const ruleCost = (right, distance) => {
    if (!Array.isArray(right) || right.length === 0) return 0;

    let total = 0;
    for (const sym of right) {
      const cost = symbolCost(sym, distance);
      if (!Number.isFinite(cost)) return INF;
      total += cost;
    }
    return total;
  };

  // Fixed-point computation of minimum terminal-length derivations for productive NTs.
  const minDistance = new Map(nonTerminals.map((nt) => [nt, INF]));
  let changed = true;
  let iterations = 0;
  const maxIterations = Math.max(1, nonTerminals.length * 3);

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations += 1;

    for (const { left, right } of productiveRules) {
      const candidate = ruleCost(right, minDistance);
      if (candidate < (minDistance.get(left) ?? INF)) {
        minDistance.set(left, candidate);
        changed = true;
      }
    }
  }

  const bestRuleFor = new Map();
  const productiveNonTerminals = Array.from(allWitnesses.keys()).filter((nt) =>
    nonTerminalSet.has(nt)
  );

  for (const nt of productiveNonTerminals) {
    const options = allWitnesses.get(nt) || [];
    if (options.length === 0) continue;

    let best = null;
    let bestCost = INF;
    let bestComplexity = INF;

    for (const right of options) {
      const cost = ruleCost(right, minDistance);
      if (!Number.isFinite(cost)) continue;

      // Prefer fewer RHS symbols as a secondary criterion.
      const complexity = Array.isArray(right) ? right.length : 0;
      if (cost < bestCost || (cost === bestCost && complexity < bestComplexity)) {
        best = right;
        bestCost = cost;
        bestComplexity = complexity;
      }
    }

    if (!best && options.length > 0) {
      // Fallback: first productive option to avoid returning no witness.
      best = options[0];
    }

    if (best) bestRuleFor.set(nt, best);
  }

  let idCounter = 0;
  const makeNode = (name, type) => ({
    name,
    id: `node_${idCounter++}`,
    attributes: { type },
  });

  // Iterative construction avoids deep recursive calls and stack overflows.
  const root = makeNode(start, 'non-terminal');
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const symbol = current.name;

    if (terminals.includes(symbol)) {
      current.attributes.type = 'terminal';
      continue;
    }

    if (symbol === 'ε') {
      current.attributes.type = 'epsilon';
      continue;
    }

    if (!nonTerminalSet.has(symbol)) {
      current.attributes.type = 'terminal';
      continue;
    }

    current.attributes.type = 'non-terminal';
    const rhs = bestRuleFor.get(symbol);

    if (!rhs || rhs.length === 0 || (rhs.length === 1 && rhs[0] === 'ε')) {
      current.children = [makeNode('ε', 'epsilon')];
      continue;
    }

    current.children = rhs.map((sym) => {
      if (sym === 'ε') return makeNode('ε', 'epsilon');
      if (terminals.includes(sym)) return makeNode(sym, 'terminal');
      if (nonTerminalSet.has(sym)) return makeNode(sym, 'non-terminal');
      return makeNode(sym, 'terminal');
    });

    // Push in reverse order to preserve left-to-right expansion.
    for (let i = current.children.length - 1; i >= 0; i -= 1) {
      const child = current.children[i];
      if (child.attributes.type === 'non-terminal') {
        stack.push(child);
      }
    }
  }

  // Extract derived word from leaves in left-to-right order.
  const collect = [root];
  const output = [];

  while (collect.length > 0) {
    const node = collect.pop();
    if (!node) continue;

    if (node.attributes?.type === 'terminal') {
      output.push(node.name);
      continue;
    }

    if (node.attributes?.type === 'epsilon') {
      continue;
    }

    if (node.children && node.children.length > 0) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        collect.push(node.children[i]);
      }
    }
  }

  return {
    derivationTree: root,
    derivedWord: output.join(''),
  };
}

/**
 * Determines whether the grammar defines an empty language.
 *
 * It first computes productive nonterminals via a queue-based fixed-point process.
 * If the start symbol is productive, it also constructs a compact example derivation
 * tree and the corresponding derived terminal word.
 *
 * @param {Grammar} grammar
 * @returns {{
 *   isEmpty: boolean,
 *   productive: string[],
 *   nonproductive: string[],
 *   explanation: string,
 *   derivationTree: Object|null,
 *   derivedWord: string
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
      explanation: 'Gramatika je prázdná: není definován počáteční symbol.',
      derivationTree: null,
    };
  }

  // Normalize rules into a flat list [{ left, right }]
  const rules = Array.isArray(productions)
    ? productions
    : Object.entries(productions).flatMap(([left, rights]) =>
        rights.map((right) => ({ left, right }))
      );

  // Helper: can this right produce terminals given current productive set?
  function rightIsProductive(right) {
    return (
      right.length === 0 ||
      (right.length === 1 && right[0] === 'ε') ||
      right.every((sym) => terminals.includes(sym) || productive.has(sym))
    );
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
        if (!currentWitnesses.some((w) => JSON.stringify(w) === JSON.stringify(right))) {
          currentWitnesses.push(right);
        }
      }
    }
  }

  const isEmpty = !productive.has(start);

  // Construct a small finite witness derivation if the language is non-empty.
  let derivationTree = null;
  let derivedWord = '';

  if (!isEmpty) {
    const witness = buildDerivationTree(start, nonTerminals, terminals, allWitnesses);
    derivationTree = witness.derivationTree;
    derivedWord = witness.derivedWord;
  }

  return {
    isEmpty,
    productive: [...productive],
    nonproductive: nonTerminals.filter((nt) => !productive.has(nt)),
    explanation: isEmpty
      ? `Gramatika definuje prázdný jazyk: počáteční symbol "${start}" nemůže derivovat žádný terminální řetězec.`
      : `Gramatika definuje neprázdný jazyk: počáteční symbol "${start}" může derivovat alespoň jeden terminální řetězec.`,
    derivationTree,
    derivedWord,
  };
}
