import { describe, expect, it } from 'vitest';

import { isEmptyLanguage } from '../src/Components/Grammar/Utils/GrammarEvaluator.js';
import { generateGrammar } from '../src/Components/Grammar/Utils/GrammarGenerator.js';
import { parseGrammar } from '../src/Components/Grammar/Utils/GrammarParser.js';

describe('Grammar algorithms', () => {
  it('parses grammar input with ASCII arrow and epsilon', () => {
    const grammar = parseGrammar('S -> A | epsilon\nA -> a');

    expect(grammar.nonTerminals).toEqual(expect.arrayContaining(['S', 'A']));
    expect(grammar.terminals).toContain('a');
    expect(grammar.productions.S).toEqual([['A'], []]);
  });

  it('detects non-empty language and returns a witness', () => {
    const grammar = parseGrammar('S -> a');
    const result = isEmptyLanguage(grammar);

    expect(result.isEmpty).toBe(false);
    expect(result.productive).toContain('S');
    expect(result.derivationTree).not.toBeNull();
    expect(result.derivedWord).toBe('a');
  });

  it('detects empty language when no terminal derivation exists', () => {
    const grammar = parseGrammar('S -> A\nA -> A');
    const result = isEmptyLanguage(grammar);

    expect(result.isEmpty).toBe(true);
    expect(result.derivationTree).toBeNull();
  });

  it('generates a valid grammar shape', () => {
    const grammar = generateGrammar({
      nonTerminalCount: 4,
      terminalCount: 3,
      maxRuleLength: 3,
      minProductionsPerNonTerminal: 1,
      maxProductionsPerNonTerminal: 2,
      allowLeftRecursion: false,
      allowRightRecursion: false,
      epsilonMode: 'never',
    });

    expect(grammar.nonTerminals).toHaveLength(4);
    expect(grammar.terminals).toHaveLength(3);
    expect(grammar.nonTerminals[0]).toBe('S');

    for (const nt of grammar.nonTerminals) {
      expect(Array.isArray(grammar.productions[nt])).toBe(true);
      expect(grammar.productions[nt].length).toBeGreaterThanOrEqual(1);
      expect(grammar.productions[nt].length).toBeLessThanOrEqual(2);
    }

    expect(grammar.nonTerminals).toContain('S');

    const knownSymbols = new Set([...grammar.nonTerminals, ...grammar.terminals]);
    const allRules = Object.values(grammar.productions).flat();

    for (const rule of allRules) {
      for (const symbol of rule) {
        expect(knownSymbols.has(symbol)).toBe(true);
      }
    }
  });

  it('rejects invalid generator config', () => {
    expect(() =>
      generateGrammar({
        nonTerminalCount: 0,
        terminalCount: 2,
        maxRuleLength: 2,
        minProductionsPerNonTerminal: 1,
        maxProductionsPerNonTerminal: 2,
        allowLeftRecursion: false,
        allowRightRecursion: false,
        epsilonMode: 'never',
      })
    ).toThrow();
  });
});
