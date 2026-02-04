
/**
 * Generates a sequence of steps describing the iterative evaluation of grammar emptiness.
 * @param {Object} grammar - The grammar object with nonTerminals, terminals, productions.
 * @returns {Array} Array of step objects.
 */
export function generateGrammarSteps(grammar) {
    const steps = [];
    const productive = new Set();
    const { nonTerminals, terminals, productions } = grammar;
    
    const start = nonTerminals.length > 0 ? nonTerminals[0] : null;

    if (!start) {
        steps.push({
            type: 'ERROR',
            description: 'Gramatika nemá definovaný žádný neterminál (a tedy ani počáteční symbol).',
            productive: [],
            currentRule: null
        });
        return steps;
    }

    // Normalize rules
    const rules = Array.isArray(productions)
      ? productions
      : Object.entries(productions).flatMap(([left, rights]) =>
          rights.map(right => ({ left, right }))
        );

    // Initial State
    steps.push({
        type: 'INIT',
        description: 'Inicializace: Množina produktivních neterminálů je prázdná.',
        productive: [],
        currentRule: null
    });

    // We use the queue-based approach (work-list algorithm) to match the logic described in the thesis.
    const queue = [];
    
    // 1. Initial Scan
    steps.push({
        type: 'SCAN_START',
        description: 'Fáze 1: Hledání pravidel, která obsahují pouze terminály.',
        productive: [],
        currentRule: null
    });

    for (const rule of rules) {
        const { left, right } = rule;
        const ruleStr = `${left} → ${right.length === 0 ? 'ε' : right.join(' ')}`;
        
        // Check if right side consists purely of terminals (or is epsilon)
        const isTerminalOnly = right.length === 0 || 
                             (right.length === 1 && right[0] === 'ε') ||
                             right.every(sym => terminals.includes(sym));

        if (isTerminalOnly) {
             if (!productive.has(left)) {
                productive.add(left);
                queue.push(left);
                steps.push({
                    type: 'FOUND_TERMINAL_RULE',
                    description: `Pravidlo "${ruleStr}" obsahuje pouze terminály. "${left}" je produktivní.`,
                    productive: [...productive],
                    currentRule: ruleStr,
                    highlight: 'success'
                });
             } else {
                 // Already marked, but we found another terminal rule
                 steps.push({
                    type: 'CHECK_RULE',
                    description: `Pravidlo "${ruleStr}" obsahuje pouze terminály ( "${left}" je již produktivní).`,
                    productive: [...productive],
                    currentRule: ruleStr,
                    highlight: 'neutral'
                });
             }
        } else {
             steps.push({
                type: 'CHECK_RULE',
                description: `Pravidlo "${ruleStr}" obsahuje neterminály. Zatím nelze rozhodnout.`,
                productive: [...productive],
                currentRule: ruleStr,
                highlight: 'neutral'
            });
        }
    }

    // 2. Queue Processing
    if (queue.length > 0) {
        steps.push({
            type: 'QUEUE_PROCESS_START',
            description: `Zahajuji iterativní proces. Ve frontě nových produktivních symbolů jsou: { ${queue.join(', ')} }`,
            productive: [...productive],
            currentRule: null
        });
    }

    while (queue.length > 0) {
        const newlyProd = queue.shift();
        
        steps.push({
            type: 'QUEUE_POP',
            description: `Zpracovávám nově produktivní neterminál: "${newlyProd}". Hledám pravidla, která ho využívají.`,
            productive: [...productive],
            currentRule: null
        });

        // Check all rules that use this symbol
        // (In a real optimized engine we'd have a map, here we iterate for visualization clarity or simulate the map)
        for (const rule of rules) {
            const { left, right } = rule;
            // Only interested if the rule actually uses the symbol we just popped
            if (right.includes(newlyProd)) {
                 const ruleStr = `${left} → ${right.length === 0 ? 'ε' : right.join(' ')}`;
                 
                 // Check if this rule is NOW fully productive
                 const isProductive = right.length === 0 || 
                                    (right.length === 1 && right[0] === 'ε') ||
                                    right.every(sym => terminals.includes(sym) || productive.has(sym));
                 
                 if (isProductive) {
                     if (!productive.has(left)) {
                         productive.add(left);
                         queue.push(left);
                         steps.push({
                            type: 'NEW_PRODUCTIVE',
                            description: `Pravidlo "${ruleStr}" se stalo produktivním díky "${newlyProd}". "${left}" přidán mezi produktivní.`,
                            productive: [...productive],
                            currentRule: ruleStr,
                            highlight: 'success'
                        });
                     } else {
                        steps.push({
                            type: 'CHECK_RULE_AGAIN',
                            description: `Pravidlo "${ruleStr}" je nyní plně produktivní ("${left}" již byl označen).`,
                            productive: [...productive],
                            currentRule: ruleStr,
                            highlight: 'neutral'
                        });
                     }
                 } else {
                     // Find what's missing
                     const missing = right.filter(sym => !terminals.includes(sym) && !productive.has(sym));
                     steps.push({
                        type: 'CHECK_RULE_WAIT',
                        description: `Pravidlo "${ruleStr}" obsahuje "${newlyProd}", ale stále čeká na: { ${missing.join(', ')} }.`,
                        productive: [...productive],
                        currentRule: ruleStr,
                        highlight: 'warning'
                    });
                 }
            }
        }
    }

    // Final Result
    const isEmpty = !productive.has(start);
    steps.push({
        type: 'FINISHED',
        description: isEmpty 
            ? `Hotovo. Počáteční symbol "${start}" není v množině produktivních symbolů. Jazyk je PRÁZDNÝ.` 
            : `Hotovo. Počáteční symbol "${start}" je produktivní. Jazyk je NEPRÁZDNÝ.`,
        productive: [...productive],
        currentRule: null,
        result: !isEmpty
    });

    return steps;
}
