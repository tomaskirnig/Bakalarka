import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { toast } from 'react-toastify';
import { evaluateCircuitWithSteps } from '../src/Components/MCVP/Utils/EvaluateCircuit.js';
import { generateTree } from '../src/Components/MCVP/Utils/Generator.js';
import { parseExpressionToTree } from '../src/Components/MCVP/Utils/Parser.js';

function collectNodes(root) {
  if (!root) return [];
  const visited = new Set();
  const stack = [root];
  const nodes = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    nodes.push(current);

    for (const child of current.children || []) {
      stack.push(child);
    }
  }

  return nodes;
}

describe('MCVP completeness checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('covers full truth table for AND/OR with two binary inputs', () => {
    const cases = [
      { a: 0, b: 0 },
      { a: 0, b: 1 },
      { a: 1, b: 0 },
      { a: 1, b: 1 },
    ];

    for (const { a, b } of cases) {
      const andTree = parseExpressionToTree(`(x1[${a}] A x2[${b}])`);
      const orTree = parseExpressionToTree(`(x1[${a}] O x2[${b}])`);

      expect(andTree).not.toBeNull();
      expect(orTree).not.toBeNull();

      expect(evaluateCircuitWithSteps(andTree).result).toBe(a & b);
      expect(evaluateCircuitWithSteps(orTree).result).toBe(a | b);
    }
  });

  it('handles null input in evaluator', () => {
    const evaluation = evaluateCircuitWithSteps(null);
    expect(evaluation.result).toBeNull();
    expect(evaluation.steps).toEqual([]);
  });

  it('returns null result and reports error for cyclic graph', () => {
    const cycleNode = {
      id: 'op1',
      type: 'operation',
      value: 'A',
      children: [],
    };
    const leaf = {
      id: 'v1',
      type: 'variable',
      varValue: 1,
      children: [],
    };
    cycleNode.children = [leaf, cycleNode];

    const evaluation = evaluateCircuitWithSteps(cycleNode);
    expect(evaluation.result).toBeNull();
    expect(evaluation.steps).toEqual([]);
    expect(toast.error).toHaveBeenCalled();
  });

  it('returns null result and reports error for invalid operation arity', () => {
    const malformedNode = {
      id: 'op1',
      type: 'operation',
      value: 'A',
      children: [{ id: 'v1', type: 'variable', varValue: 1, children: [] }],
    };

    const evaluation = evaluateCircuitWithSteps(malformedNode);
    expect(evaluation.result).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('enforces generator precondition for binary circuit feasibility', () => {
    expect(() => generateTree(1, 4)).toThrow();
    expect(toast.error).toHaveBeenCalled();
  });

  it('generates evaluable DAG with binary operation nodes', () => {
    const root = generateTree(6, 5);
    const nodes = collectNodes(root);

    expect(nodes.length).toBeGreaterThan(0);

    const operationNodes = nodes.filter((n) => n.type === 'operation');
    for (const op of operationNodes) {
      expect(op.children.length).toBe(2);
    }

    const evaluation = evaluateCircuitWithSteps(root);
    expect([0, 1]).toContain(evaluation.result);
    expect(evaluation.steps.at(-1).type).toBe('FINAL');
  });
});
