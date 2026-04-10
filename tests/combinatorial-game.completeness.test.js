import { describe, expect, it } from 'vitest';

import {
  computeWinner,
  getOptimalMoves,
} from '../src/Components/CombinatorialGame/Utils/ComputeWinner.js';
import { generateGraph } from '../src/Components/CombinatorialGame/Utils/Generator.js';

function buildTwoNodeGraph(player0, player1, edge01, edge10) {
  const positions = {
    0: { id: '0', player: player0, children: [], parents: [] },
    1: { id: '1', player: player1, children: [], parents: [] },
  };

  if (edge01) {
    positions['0'].children.push('1');
    positions['1'].parents.push('0');
  }
  if (edge10) {
    positions['1'].children.push('0');
    positions['0'].parents.push('1');
  }

  return { positions, startingPosition: { id: '0' } };
}

describe('Combinatorial Game completeness checks', () => {
  it('handles invalid graph input defensively', () => {
    const result = computeWinner(null);
    expect(result.hasWinningStrategy).toBe(false);
    expect(result.error).toBe('Invalid graph data');
  });

  it('covers start-player=2 result branches (WIN and LOSE at start)', () => {
    const startLose = {
      positions: {
        1: { id: '1', player: 2, children: [], parents: [] },
      },
      startingPosition: { id: '1' },
    };

    const loseResult = computeWinner(startLose);
    expect(loseResult.hasWinningStrategy).toBe(true);
    expect(loseResult.message).toContain('Hráč 1 má výherní strategii');

    const startWin = {
      positions: {
        1: { id: '1', player: 2, children: ['2'], parents: [] },
        2: { id: '2', player: 1, children: [], parents: ['1'] },
      },
      startingPosition: { id: '1' },
    };

    const winResult = computeWinner(startWin);
    expect(winResult.hasWinningStrategy).toBe(false);
    expect(winResult.message).toContain('Hráč 2 vyhrává');
  });

  it('checks algorithm stability across exhaustive two-node graph combinations', () => {
    const players = [1, 2];
    const edges = [false, true];

    for (const p0 of players) {
      for (const p1 of players) {
        for (const edge01 of edges) {
          for (const edge10 of edges) {
            const graph = buildTwoNodeGraph(p0, p1, edge01, edge10);
            const result = computeWinner(graph);

            expect(result.error).toBeUndefined();
            expect(typeof result.hasWinningStrategy).toBe('boolean');
            expect(Object.keys(result.winningPositions)).toHaveLength(2);
            expect([0, 1, 2]).toContain(result.winningPositions['0']);
            expect([0, 1, 2]).toContain(result.winningPositions['1']);

            const optimal = getOptimalMoves(graph, result);
            expect(optimal instanceof Set).toBe(true);
          }
        }
      }
    }
  });

  it('generates connected graph from start without self-loops', () => {
    const graph = generateGraph(12, 40);

    expect(graph.startingPosition.id).toBe('0');
    expect(Object.keys(graph.positions)).toHaveLength(12);

    for (const pos of Object.values(graph.positions)) {
      expect(pos.children.includes(pos.id)).toBe(false);
    }

    const visited = new Set(['0']);
    const queue = ['0'];

    while (queue.length > 0) {
      const current = queue.shift();
      for (const child of graph.positions[current].children) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }
    }

    expect(visited.size).toBe(12);
  });
});
