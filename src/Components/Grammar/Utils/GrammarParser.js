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
                // Handle epsilon as special case
                if (alt === 'ε') {
                    grammar.productions[ls].push(['ε']);
                    continue;
                }
                
                // Split into symbols
                const symbols = alt.split('');
                grammar.productions[ls].push(symbols);
                
                // Add terminals
                for (let sym of symbols) {
                    if (!grammar.nonTerminals.includes(sym) && !grammar.terminals.includes(sym)) {
                        if (!sym.match(/^[A-Z]$/)) { // Uppercase letters are non-terminals
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