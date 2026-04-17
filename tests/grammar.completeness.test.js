import { describe, expect, it } from 'vitest';

import { Grammar } from '../src/Components/Grammar/Utils/Grammar.js';
import { isEmptyLanguage } from '../src/Components/Grammar/Utils/GrammarEvaluator.js';
import { generateGrammar } from '../src/Components/Grammar/Utils/GrammarGenerator.js';
import { parseGrammar } from '../src/Components/Grammar/Utils/GrammarParser.js';

describe('Grammar completeness checks', () => {
  it('parses unicode arrow and uppercase Czech non-terminals', () => {
    const grammar = parseGrammar('S → Č\nČ → a');

    expect(grammar.nonTerminals).toEqual(expect.arrayContaining(['S', 'Č']));
    expect(grammar.terminals).toContain('a');
  });

  it('rejects malformed grammar rules', () => {
    expect(() => parseGrammar('S A')).toThrow(/Neplatný formát pravidla/);
    expect(() => parseGrammar('s -> a')).toThrow(/Neplatný neterminál/);
    expect(() => parseGrammar('S -> a |')).toThrow(/prázdnou alternativu/);
    expect(() => parseGrammar('')).toThrow(/Pravidla gramatiky nejsou definována/);
  });

  it('handles grammar with no start symbol', () => {
    const grammar = new Grammar({
      nonTerminals: [],
      terminals: ['a'],
      productions: {},
    });

    const result = isEmptyLanguage(grammar);
    expect(result.isEmpty).toBe(true);
    expect(result.explanation).toContain('není definován počáteční symbol');
  });

  it('supports array-based productions input in evaluator', () => {
    const grammar = new Grammar({
      nonTerminals: ['S', 'A'],
      terminals: ['a'],
      productions: [
        { left: 'S', right: ['A'] },
        { left: 'A', right: ['a'] },
      ],
    });

    const result = isEmptyLanguage(grammar);
    expect(result.isEmpty).toBe(false);
    expect(result.derivedWord).toBe('a');
  });

  it('ensures epsilon exists in always mode', () => {
    const grammar = generateGrammar({
      nonTerminalCount: 5,
      terminalCount: 3,
      maxRuleLength: 3,
      minProductionsPerNonTerminal: 1,
      maxProductionsPerNonTerminal: 3,
      allowLeftRecursion: false,
      allowRightRecursion: false,
      epsilonMode: 'always',
    });

    const hasEpsilonRule = Object.values(grammar.productions)
      .flat()
      .some((rule) => Array.isArray(rule) && rule.length === 0);

    expect(hasEpsilonRule).toBe(true);
  });

  it('keeps generated rule lengths within maxRuleLength', () => {
    const grammar = generateGrammar({
      nonTerminalCount: 6,
      terminalCount: 4,
      maxRuleLength: 2,
      minProductionsPerNonTerminal: 1,
      maxProductionsPerNonTerminal: 3,
      allowLeftRecursion: true,
      allowRightRecursion: true,
      epsilonMode: 'random',
    });

    const allRules = Object.values(grammar.productions).flat();
    for (const rule of allRules) {
      expect(rule.length).toBeLessThanOrEqual(2);
    }
  });

  it('rejects invalid production range config', () => {
    expect(() =>
      generateGrammar({
        nonTerminalCount: 3,
        terminalCount: 2,
        maxRuleLength: 2,
        minProductionsPerNonTerminal: 4,
        maxProductionsPerNonTerminal: 2,
        allowLeftRecursion: false,
        allowRightRecursion: false,
        epsilonMode: 'never',
      })
    ).toThrow(/Minimální počet pravidel nemůže překročit maximální počet pravidel/);
  });
});
