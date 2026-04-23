import { describe, expect, it } from 'vitest';
import { parseExpressionToTree } from '../src/Components/MCVP/Utils/Parser.js';
import { convertMCVPToGameCore } from '../src/Components/Conversions/MCVP-CombinatorialGame/MCVPtoGameCore.js';
import { convertMCVPToGrammarCore } from '../src/Components/Conversions/MCVP-Grammar/MCVPtoGrammarCore.js';
import { computeWinner } from '../src/Components/CombinatorialGame/Utils/ComputeWinner.js';

describe('Core Conversions', () => {
  describe('MCVP to Game Core', () => {
    it('converts a simple MCVP AND to a Game graph where P2 chooses', () => {
      const tree = parseExpressionToTree('(x1[1] A x2[1])');
      const game = convertMCVPToGameCore(tree);

      expect(game).not.toBeNull();
      const startPosId = game.startingPosition.id;
      const startPos = game.positions[startPosId];

      expect(startPos.player).toBe(2); // AND -> P2
      expect(startPos.children).toHaveLength(2);

      // Evaluate the game - it should be a win for P1 (since 1 A 1 = 1)
      const result = computeWinner(game);
      expect(result.hasWinningStrategy).toBe(true);
    });

    it('converts a simple MCVP OR to a Game graph where P1 chooses', () => {
        const tree = parseExpressionToTree('(x1[0] O x2[0])');
        const game = convertMCVPToGameCore(tree);

        expect(game).not.toBeNull();
        const startPosId = game.startingPosition.id;
        const startPos = game.positions[startPosId];

        expect(startPos.player).toBe(1); // OR -> P1
        expect(startPos.children).toHaveLength(2);

        // Evaluate the game - it should be a loss for P1 (since 0 O 0 = 0)
        const result = computeWinner(game);
        expect(result.hasWinningStrategy).toBe(false);
      });
  });

  describe('MCVP to Grammar Core', () => {
    it('converts a simple MCVP OR to a Grammar with productions', () => {
      const tree = parseExpressionToTree('(x1[1] O x2[1])');
      const grammar = convertMCVPToGrammarCore(tree, { epsilonChance: 0 }); // No epsilon for simpler test

      expect(grammar).not.toBeNull();
      expect(grammar.nonTerminals).toContain('S');
      expect(grammar.productions['S']).toBeDefined();
      expect(grammar.productions['S']).toHaveLength(2);
      expect(grammar.terminals).toHaveLength(2); // x1 and x2 should be terminals
    });

    it('converts a simple MCVP AND to a Grammar with concatenation', () => {
        const tree = parseExpressionToTree('(x1[1] A x2[1])');
        const grammar = convertMCVPToGrammarCore(tree, { epsilonChance: 0 });

        expect(grammar).not.toBeNull();
        expect(grammar.nonTerminals).toContain('S');
        expect(grammar.productions['S']).toHaveLength(1);
        expect(grammar.productions['S'][0]).toHaveLength(2); // concatenated
      });

    it('handles false variables with self-loops', () => {
        const tree = parseExpressionToTree('x1[0]');
        const grammar = convertMCVPToGrammarCore(tree);

        expect(grammar).not.toBeNull();
        expect(grammar.nonTerminals).toContain('S');
        expect(grammar.productions['S']).toEqual([['S']]); // Self loop
    });
  });
});
