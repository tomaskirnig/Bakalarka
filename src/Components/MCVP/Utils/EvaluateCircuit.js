/**
 * @fileoverview Provides a function to evaluate MCVP circuits (DAGs) with step tracking.
 */
import { toast } from "react-toastify";

/**
 * Evaluates an MCVP circuit (DAG) and returns the evaluation steps.
 * 
 * @param {Node} node - The root node of the circuit to evaluate
 * @returns {Object} An object containing the result and the steps array
 */
export function evaluateCircuitWithSteps(node) {
    const steps = [];
    const memo = new Map(); // Cache results
    const visiting = new Set();
    
    function evaluate(currentNode) {
        if (!currentNode) return null;

        // Return cached result if available
        if (memo.has(currentNode.id)) {
            return memo.get(currentNode.id);
        }

        if (visiting.has(currentNode.id)) {
            throw new Error("Během postupného vyhodnocování byl detekován cyklus.");
        }
        visiting.add(currentNode.id);

        // Variable node
        if (currentNode.type === "variable") {
            const val = currentNode.varValue !== undefined ? currentNode.varValue : null;
            visiting.delete(currentNode.id);
            memo.set(currentNode.id, val);
            return val;
        }

        if (!currentNode.children || !Array.isArray(currentNode.children) || currentNode.children.length === 0) {
            visiting.delete(currentNode.id);
            return null;
        }

        if (currentNode.type === 'operation' && currentNode.children.length > 2) {
            throw new Error(`Uzel operace ${currentNode.id} má více než 2 potomky.`);
        }

        const childValues = [];
        for (const child of currentNode.children) {
            const childVal = evaluate(child);
            if (childVal !== null) childValues.push(childVal);
        }

        if (childValues.length === 0) {
            visiting.delete(currentNode.id);
            return null;
        }

        let result;
        if (currentNode.value === 'A' || currentNode.value === 'AND' || currentNode.value === '∧') {
             result = childValues.every(v => v === 1) ? 1 : 0;
        } else if (currentNode.value === 'O' || currentNode.value === 'OR' || currentNode.value === '∨') {
             result = childValues.some(v => v === 1) ? 1 : 0;
        } else {
             visiting.delete(currentNode.id);
             return null;
        }

        // Only add step if we actually computed it (which we did, since we are here)
        steps.push({
            node: currentNode,
            childValues: childValues,
            result: result
        });

        visiting.delete(currentNode.id);
        memo.set(currentNode.id, result);
        return result;
    }

    try {
        const finalResult = evaluate(node);
        
        // Add final summary step
        if (finalResult !== null) {
            steps.push({
                type: 'FINAL',
                node: node,
                childValues: [],
                result: finalResult,
                explanation: `Vyhodnocení dokončeno. Výsledná hodnota obvodu: ${finalResult}`
            });
        }
        
        return { result: finalResult, steps };
    } catch (e) {
        console.error(e);
        toast.error(e.message);
        return { result: null, steps: [] };
    }
}
