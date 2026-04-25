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
 * @returns {{ derivationTree: Object, derivedWord: string, wasTruncated: boolean, nodeCount: number, truncationReason: string|null }}
 */
function buildDerivationTree(start, nonTerminals, terminals, allWitnesses) {
  const MAX_TREE_NODES = 1200;
  const MAX_TREE_DEPTH = 80;
  const MAX_SYMBOL_REPEATS_IN_PATH = 4;

  const nonTerminalSet = new Set(nonTerminals);
  const terminalSet = new Set(terminals);
  const INF = Number.POSITIVE_INFINITY;
  const productiveRules = Array.from(allWitnesses.entries()).flatMap(([left, rights]) =>
    rights.map((right) => ({ left, right }))
  );

  const symbolCost = (sym, distance) => {
    if (sym === 'ε') return 0;
    if (terminalSet.has(sym)) return 1;
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

  const orderedRulesFor = new Map();
  const productiveNonTerminals = Array.from(allWitnesses.keys()).filter((nt) =>
    nonTerminalSet.has(nt)
  );

  for (const nt of productiveNonTerminals) {
    const options = allWitnesses.get(nt) || [];
    if (options.length === 0) continue;

    // Prefer shortest terminal derivations and then fewer non-terminals to avoid cycles.
    const sorted = [...options].sort((a, b) => {
      const costA = ruleCost(a, minDistance);
      const costB = ruleCost(b, minDistance);

      const finiteA = Number.isFinite(costA);
      const finiteB = Number.isFinite(costB);
      if (finiteA !== finiteB) return finiteA ? -1 : 1;
      if (costA !== costB) return costA - costB;

      const ntCountA = a.filter((sym) => nonTerminalSet.has(sym)).length;
      const ntCountB = b.filter((sym) => nonTerminalSet.has(sym)).length;
      if (ntCountA !== ntCountB) return ntCountA - ntCountB;

      return a.length - b.length;
    });

    orderedRulesFor.set(nt, sorted);
  }

  let idCounter = 0;
  let wasTruncated = false;
  let truncationReason = null;

  const noteTruncation = (reason) => {
    if (!wasTruncated) {
      wasTruncated = true;
      truncationReason = reason;
    }
  };

  const makeNode = (name, type) => ({
    name,
    id: `node_${idCounter++}`,
    attributes: { type },
  });

  const selectRhsForNode = (symbol, pathCounts, depth) => {
    const options = orderedRulesFor.get(symbol) || [];
    if (options.length === 0) return null;

    const terminalOnlyRule = options.find((rhs) => rhs.every((sym) => !nonTerminalSet.has(sym)));

    // Near depth limit, prefer terminal-only expansion to force termination.
    if (depth >= MAX_TREE_DEPTH - 1 && terminalOnlyRule) {
      noteTruncation('max-depth');
      return terminalOnlyRule;
    }

    const safeRule = options.find((rhs) =>
      rhs.every((sym) => {
        if (!nonTerminalSet.has(sym)) return true;
        return (pathCounts.get(sym) || 0) < MAX_SYMBOL_REPEATS_IN_PATH;
      })
    );

    if (safeRule) return safeRule;

    if (terminalOnlyRule) {
      noteTruncation('cycle-avoidance');
      return terminalOnlyRule;
    }

    noteTruncation('cycle-avoidance');
    return options[0];
  };

  // Iterative construction avoids deep recursive calls and stack overflows.
  const root = makeNode(start, 'non-terminal');
  const stack = [
    {
      node: root,
      depth: 0,
      pathCounts: new Map([[start, 1]]),
    },
  ];

  while (stack.length > 0) {
    const { node: current, depth, pathCounts } = stack.pop();
    const symbol = current.name;

    if (terminalSet.has(symbol)) {
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

    if (idCounter >= MAX_TREE_NODES) {
      noteTruncation('max-nodes');
      current.children = [makeNode('ε', 'epsilon')];
      continue;
    }

    const rhs = selectRhsForNode(symbol, pathCounts, depth);

    if (!rhs || rhs.length === 0 || (rhs.length === 1 && rhs[0] === 'ε')) {
      current.children = [makeNode('ε', 'epsilon')];
      continue;
    }

    if (depth >= MAX_TREE_DEPTH) {
      noteTruncation('max-depth');
      current.children = [makeNode('ε', 'epsilon')];
      continue;
    }

    current.children = rhs.map((sym) => {
      if (sym === 'ε') return makeNode('ε', 'epsilon');
      if (terminalSet.has(sym)) return makeNode(sym, 'terminal');
      if (nonTerminalSet.has(sym)) return makeNode(sym, 'non-terminal');
      return makeNode(sym, 'terminal');
    });

    if (idCounter >= MAX_TREE_NODES) {
      noteTruncation('max-nodes');
      current.children = current.children.map((child) => {
        if (child.attributes.type === 'non-terminal') {
          child.attributes.type = 'epsilon';
          child.name = 'ε';
          delete child.children;
        }
        return child;
      });
      continue;
    }

    // Push in reverse order to preserve left-to-right expansion.
    for (let i = current.children.length - 1; i >= 0; i -= 1) {
      const child = current.children[i];
      if (child.attributes.type === 'non-terminal') {
        const nextPathCounts = new Map(pathCounts);
        nextPathCounts.set(child.name, (nextPathCounts.get(child.name) || 0) + 1);
        stack.push({
          node: child,
          depth: depth + 1,
          pathCounts: nextPathCounts,
        });
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
    wasTruncated,
    nodeCount: idCounter,
    truncationReason,
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
 *   derivedWord: string,
 *   witnessTruncated: boolean,
 *   witnessNodeCount: number,
 *   witnessTruncationReason: string|null
 * }}
 */
export function isEmptyLanguage(grammar) {
  const productive = new Set();
  const allWitnesses = new Map(); // Stores ALL productive rules: NonTerminal -> [Symbol[][]]
  const { nonTerminals, terminals, productions } = grammar;
  const terminalSet = new Set(terminals); // Stored in set for quick lookup O(1)

  // Determine the start symbol (first non-terminal if not explicitly defined)
  const start = nonTerminals.length > 0 ? nonTerminals[0] : null;

  if (!start) {
    return {
      isEmpty: true,
      productive: [],
      nonproductive: nonTerminals,
      explanation: 'Gramatika je prázdná: není definován počáteční symbol.',
      derivationTree: null,
      derivedWord: '',
      witnessTruncated: false,
      witnessNodeCount: 0,
      witnessTruncationReason: null,
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
      right.every((sym) => terminalSet.has(sym) || productive.has(sym))
    );
  }

  // 1) Initial Scan: identify NTs that produce terminals directly (or ε)
  for (const { left, right } of rules) {
    if (!productive.has(left) && rightIsProductive(right)) {
      productive.add(left);
      allWitnesses.set(left, [right]);
    } else if (productive.has(left) && rightIsProductive(right)) {
      // Add additional productive rules for already productive nonterminals
      allWitnesses.get(left).push(right);
    }
  }

  // 2) Iterative Phase: propagate productivity until no more changes occur
  let changed = true;
  while (changed) {
    changed = false;
    
    // Optimization: if all non-terminals are already productive, we can stop
    if (productive.size === nonTerminals.length) {
      break;
    }

    for (const { left, right } of rules) {
      if (!productive.has(left) && rightIsProductive(right)) {
        productive.add(left);
        allWitnesses.set(left, [right]);
        changed = true;
      } else if (productive.has(left) && rightIsProductive(right)) {
        // Add additional productive rules if not already present
        const currentWitnesses = allWitnesses.get(left) || [];
        if (!currentWitnesses.some((w) => JSON.stringify(w) === JSON.stringify(right))) {
          currentWitnesses.push(right);
          changed = true;
        }
      }
    }
  }

  const isEmpty = !productive.has(start);

  // Construct a small finite witness derivation if the language is non-empty.
  let derivationTree = null;
  let derivedWord = '';
  let witnessTruncated = false;
  let witnessNodeCount = 0;
  let witnessTruncationReason = null;

  if (!isEmpty) {
    const witness = buildDerivationTree(start, nonTerminals, terminals, allWitnesses);
    derivationTree = witness.derivationTree;
    derivedWord = witness.derivedWord;
    witnessTruncated = witness.wasTruncated;
    witnessNodeCount = witness.nodeCount;
    witnessTruncationReason = witness.truncationReason;
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
    witnessTruncated,
    witnessNodeCount,
    witnessTruncationReason,
  };
}
