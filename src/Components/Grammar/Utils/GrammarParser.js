import { Grammar } from '../Utils/Grammar';

const throwMissingRulesError = () => {
  throw new Error('Pravidla gramatiky nejsou definována.');
};

/**
 * Parses textual grammar rules into the internal `Grammar` model.
 * Supports both Unicode arrow (`→`) and ASCII arrow (`->`).
 *
 * @param {string} inputText - Multiline grammar definition where each line has `LHS -> RHS`.
 * @returns {Grammar} Parsed grammar instance.
 * @throws {Error} When input is empty or contains an invalid rule.
 */
export function parseGrammar(inputText) {
  const grammar = new Grammar();
  grammar.name = 'Parsed Grammar';
  let hasAtLeastOneRule = false;

  if (!inputText || inputText.length === 0) {
    throwMissingRulesError();
  }

  for (const rawRule of inputText.split('\n')) {
    const rule = rawRule.trim();
    // Ignore empty lines so users can format input with spacing.
    if (!rule) {
      continue;
    }

    hasAtLeastOneRule = true;

    // Support both ASCII '->' and Unicode '→'; split on first occurrence only.
    const arrowIndex = rule.search(/→|->/);
    if (arrowIndex === -1) {
      console.warn(`Invalid rule format: ${rule}`);
      throw new Error(`Neplatný formát pravidla: ${rule}`);
    }
    const arrowLen = rule.slice(arrowIndex, arrowIndex + 2) === '->' ? 2 : 1;
    const ls = rule.slice(0, arrowIndex).trim();
    const rs = rule.slice(arrowIndex + arrowLen).trim();

    if (!ls || !rs) {
      console.warn(`Invalid rule format: ${rule}`);
      throw new Error(`Neplatný formát pravidla: ${rule}`);
    }

    if (!ls.match(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/)) {
      console.warn(`Invalid non-terminal symbol: ${ls}`);
      throw new Error(`Neplatný neterminál: ${ls} (musí začínat velkým písmenem)`);
    }

    // Split by `|` to produce rule alternatives.
    const alternatives = rs.split('|').map((r) => r.trim());

    // Register left-hand non-terminal.
    if (!grammar.nonTerminals.includes(ls)) {
      grammar.nonTerminals.push(ls);
    }

    // Ensure production bucket exists.
    if (!grammar.productions[ls]) {
      grammar.productions[ls] = [];
    }

    // Parse and classify every alternative.
    for (const altRaw of alternatives) {
      if (altRaw === '') {
        throw new Error(`Pravidlo pro ${ls} obsahuje prázdnou alternativu.`);
      }
      // Represent epsilon alternative as an empty symbol array.
      if (altRaw === 'ε' || altRaw === 'epsilon') {
        grammar.productions[ls].push([]);
        continue;
      }

      // Normalize whitespace to keep parser behavior stable.
      const normalizedAlt = altRaw.replace(/\s+/g, ' ').trim();

      // Tokenize by spaces; each token is a grammar symbol.
      const symbols = normalizedAlt.split(' ').filter((token) => token.length > 0);

      if (symbols.length === 0) {
        throw new Error(`Pravidlo pro ${ls} neobsahuje žádné symboly.`);
      }

      grammar.productions[ls].push(symbols);

      // Classify tokens as non-terminals or terminals.
      for (const sym of symbols) {
        if (sym.match(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/)) {
          // Non-terminal: starts with uppercase letter.
          if (!grammar.nonTerminals.includes(sym)) {
            grammar.nonTerminals.push(sym);
          }
          // Ensure bucket exists for discovered non-terminal.
          if (!grammar.productions[sym]) {
            grammar.productions[sym] = [];
          }
        } else {
          // Terminal: every other token category.
          if (!grammar.terminals.includes(sym)) {
            grammar.terminals.push(sym);
          }
        }
      }
    }
  }

  if (!hasAtLeastOneRule) {
    throwMissingRulesError();
  }

  // Validation: Check for non-terminals that are used but have no productions defined.
  const undefinedNonTerminals = Object.entries(grammar.productions)
    .filter(([, prods]) => prods.length === 0)
    .map(([nt]) => nt);

  if (undefinedNonTerminals.length > 0) {
    const list = undefinedNonTerminals.join(', ');
    throw new Error(
      `Následující neterminály nejsou definovány (chybí na levé straně jakéhokoliv pravidla): ${list}`
    );
  }

  return grammar;
}
