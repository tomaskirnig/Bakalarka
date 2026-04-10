import { describe, expect, it } from 'vitest';

import {
  computeWinner,
  getOptimalMoves,
} from '../src/Components/CombinatorialGame/Utils/ComputeWinner.js';

describe('Combinatorial Game algorithms', () => {
  it('detects a winning strategy for Player 1 on a simple acyclic graph', () => {
    const graph = {
      positions: {
        1: { id: '1', player: 1, children: ['2'], parents: [] },
        2: { id: '2', player: 2, children: [], parents: ['1'] },
      },
      startingPosition: { id: '1' },
    };

    const result = computeWinner(graph);
    expect(result.hasWinningStrategy).toBe(true);
    expect(result.winningPositions['1']).toBe(1);

    const optimal = getOptimalMoves(graph, result);
    expect(optimal.has('1-2')).toBe(true);
  });

  it('marks pure cycles without terminals as draw', () => {
    const graph = {
      positions: {
        1: { id: '1', player: 1, children: ['2'], parents: ['2'] },
        2: { id: '2', player: 2, children: ['1'], parents: ['1'] },
      },
      startingPosition: { id: '1' },
    };

    const result = computeWinner(graph);
    expect(result.hasWinningStrategy).toBe(false);
    expect(result.nodeStatusRaw['1']).toBe('DRAW');
    expect(result.nodeStatusRaw['2']).toBe('DRAW');
    expect(result.message).toContain('remízou');
  });

  it('returns empty optimal move set on invalid graph input', () => {
    const optimal = getOptimalMoves(null);
    expect(optimal.size).toBe(0);
  });
});
