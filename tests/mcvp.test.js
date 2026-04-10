import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { toast } from 'react-toastify';
import { evaluateCircuitWithSteps } from '../src/Components/MCVP/Utils/EvaluateCircuit.js';
import { parseExpressionToTree } from '../src/Components/MCVP/Utils/Parser.js';

describe('MCVP algorithms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses and evaluates a valid expression', () => {
    const tree = parseExpressionToTree('((x1[1] A x2[1]) O x3[0])');
    expect(tree).not.toBeNull();

    const evaluation = evaluateCircuitWithSteps(tree);
    expect(evaluation.result).toBe(1);
    expect(evaluation.steps.length).toBeGreaterThan(0);
    expect(evaluation.steps.at(-1).type).toBe('FINAL');
    expect(evaluation.steps.at(-1).explanation).toContain('Výsledná hodnota obvodu: 1');
  });

  it('reuses the same node for repeated variable with same value', () => {
    const tree = parseExpressionToTree('(x1[1] O x1[1])');
    expect(tree).not.toBeNull();
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0]).toBe(tree.children[1]);
  });

  it('rejects conflicting variable assignments', () => {
    const tree = parseExpressionToTree('(x1[1] O x1[0])');
    expect(tree).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });
});
