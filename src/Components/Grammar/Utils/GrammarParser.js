import { Grammar } from '../Utils/Grammar';

export function parseGrammar(inputText) {
  let grammar = new Grammar();
  grammar.name = 'Parsed Grammar';

  if (inputText && inputText.length > 0) {
    for (let rule of inputText.split('\n')) {
      // Blank lines are not valid — each line must be a grammar rule
      if (!rule.trim())
        throw new Error(
          'Vstup obsahuje prázdný řádek. Každý řádek musí obsahovat pravidlo ve formátu: L → P'
        );

      // Support both ASCII '->' and Unicode '→' arrows; split on the first occurrence only
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

      // Split by | to get alternatives
      const alternatives = rs.split('|').map((r) => r.trim());

      // Add non-terminal if not present
      if (!grammar.nonTerminals.includes(ls)) {
        grammar.nonTerminals.push(ls);
      }

      // Initialize rules for this non-terminal
      if (!grammar.productions[ls]) {
        grammar.productions[ls] = [];
      }

      // Process each alternative
      for (let alt of alternatives) {
        if (alt === '') {
          throw new Error(`Pravidlo pro ${ls} obsahuje prázdnou alternativu.`);
        }
        // Handle epsilon as special case - represent as empty array
        if (alt === 'ε' || alt === 'epsilon') {
          grammar.productions[ls].push([]);
          continue;
        }

        // Normalize whitespace: collapse multiple spaces to single space
        alt = alt.replace(/\s+/g, ' ').trim();

        // Split by spaces - each token is one symbol
        const symbols = alt.split(' ').filter((token) => token.length > 0);

        if (symbols.length === 0) {
          throw new Error(`Pravidlo pro ${ls} neobsahuje žádné symboly.`);
        }

        grammar.productions[ls].push(symbols);

        // Categorize symbols
        for (let sym of symbols) {
          if (sym.match(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/)) {
            // It is a Non-Terminal (starts with uppercase letter)
            if (!grammar.nonTerminals.includes(sym)) {
              grammar.nonTerminals.push(sym);
            }
            // Initialize rules for this new non-terminal if not exists
            if (!grammar.productions[sym]) {
              grammar.productions[sym] = [];
            }
          } else {
            // It is a Terminal (anything else)
            if (!grammar.terminals.includes(sym)) {
              grammar.terminals.push(sym);
            }
          }
        }
      }
    }
  } else {
    console.warn('empty inputText.rules');
    throw new Error('Pravidla gramatiky nejsou definována.');
  }
  return grammar;
}
