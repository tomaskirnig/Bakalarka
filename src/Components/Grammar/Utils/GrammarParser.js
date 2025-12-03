import { Grammar } from "../Utils/Grammar";

export function parseGrammar(inputText) {
    let grammar = new Grammar();
    grammar.name = "Parsed Grammar";
    
    if(inputText && inputText.length > 0) {
        for(let rule of inputText.split('\n')) {
            let [ls, rs] = rule.split('→').map(part => part.trim());
            if (!ls || !rs){
                console.warn(`Invalid rule format: ${rule}`);
                throw new Error(`Neplatný formát pravidla: ${rule}`);
            } 
            
            if(!ls.match(/^[A-Z]$/)) {
                console.warn(`Invalid non-terminal symbol: ${ls}`);
                throw new Error(`Neplatný neterminál: ${ls}`);
            }

            // Split by | to get alternatives
            const alternatives = rs.split('|').map(r => r.trim());
            
            // Add non-terminal if not present
            if (!grammar.nonTerminals.includes(ls)) {
                grammar.nonTerminals.push(ls);
            }
            
            // Initialize productions for this non-terminal
            if (!grammar.productions[ls]) {
                grammar.productions[ls] = [];
            }
            
            // Process each alternative
            for (let alt of alternatives) {
                if (alt === '') {
                    throw new Error(`Pravidlo pro ${ls} obsahuje prázdnou alternativu.`);
                }
                // Handle epsilon as special case - represent as empty array
                if (alt === 'ε') {
                    grammar.productions[ls].push([]);
                    continue;
                }
                
                // Split into symbols
                const symbols = alt.split('');
                grammar.productions[ls].push(symbols);
                
                // Categorize symbols
                for (let sym of symbols) {
                    if (sym.match(/^[A-Z]$/)) {
                        // It is a Non-Terminal
                        if (!grammar.nonTerminals.includes(sym)) {
                            grammar.nonTerminals.push(sym);
                        }
                        // Initialize productions for this new non-terminal if not exists
                        if (!grammar.productions[sym]) {
                            grammar.productions[sym] = [];
                        }
                    } else {
                        // It is a Terminal
                        if (!grammar.terminals.includes(sym)) {
                            grammar.terminals.push(sym);
                        }
                    }
                }
            }
        }
    } else {
        console.warn("empty inputText.rules");
        throw new Error("Pravidla gramatiky nejsou definována.");
    }
    return grammar;
}