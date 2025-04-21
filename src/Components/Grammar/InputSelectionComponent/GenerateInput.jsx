import React, { useState } from 'react';
import { generateGrammar } from '../Utils/GrammarGenerator';

export function GenerateInput({ onGrammar }) {
    // Basic parameters
    const [numTerminals, setNumTerminals] = useState(2);
    const [numNonTerminals, setNumNonTerminals] = useState(3);
    const [maxRuleLength, setMaxRuleLength] = useState(3);
    const [minProductions, setMinProductions] = useState(1);
    const [maxProductions, setMaxProductions] = useState(2);
    
    // Advanced options
    const [allowLeftRecursion, setAllowLeftRecursion] = useState(true);
    const [allowRightRecursion, setAllowRightRecursion] = useState(true);
    const [allowEpsilonRules, setAllowEpsilonRules] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Handler for generating the grammar when the button is clicked
    const handleGenerateGrammar = () => {
        // Create config object based on form inputs
        const config = {
            nonTerminalCount: numNonTerminals,
            terminalCount: numTerminals,
            maxRuleLength: maxRuleLength,
            minProductionsPerNonTerminal: minProductions,
            maxProductionsPerNonTerminal: maxProductions,
            allowLeftRecursion: allowLeftRecursion,
            allowRightRecursion: allowRightRecursion,
            allowEpsilonRules: allowEpsilonRules
        };

        try {
            // Generate the grammar
            const generatedGrammar = generateGrammar(config);
            
            // Format the grammar as a text string for display
            const grammarText = formatGrammarText(generatedGrammar);
            
            // Create the object to pass to the parent component
            const formattedGrammar = {
                ...generatedGrammar,
                input: grammarText
            };
            
            // Pass the grammar to the parent component
            onGrammar(formattedGrammar);
        } catch (error) {
            alert(`Error generating grammar: ${error.message}`);
        }
    };
    
    // Helper function to format the grammar as text
    const formatGrammarText = (grammar) => {
        return grammar.productions.reduce((text, production) => {
            const rightSide = production.right.length > 0 
                ? production.right.join(' ') 
                : 'ε';
            return text + `${production.left} → ${rightSide}\n`;
        }, '');
    };

    return (
        <div className="inputWindow">
            <h3>Generátor gramatiky</h3>
            
            {/* Basic parameters */}
            <div className="row">
                <div className="col-md-6">
                    <label>Počet terminálů:</label>
                    <input
                        className='form-control'
                        type="number"
                        min="1"
                        max="10"
                        value={numTerminals}
                        onChange={(e) => setNumTerminals(Number(e.target.value))}
                    />
                </div>
                <div className="col-md-6">
                    <label>Počet neterminálů:</label>
                    <input
                        className='form-control'
                        type="number"
                        min="1"
                        max="10"
                        value={numNonTerminals}
                        onChange={(e) => setNumNonTerminals(Number(e.target.value))}
                    />
                </div>
            </div>
            
            <div className="row mt-2">
                <div className="col-md-6">
                    <label>Min. pravidel na neterminál:</label>
                    <input
                        className='form-control'
                        type="number"
                        min="1"
                        max="5"
                        value={minProductions}
                        onChange={(e) => setMinProductions(Number(e.target.value))}
                    />
                </div>
                <div className="col-md-6">
                    <label>Max. pravidel na neterminál:</label>
                    <input
                        className='form-control'
                        type="number"
                        min={minProductions}
                        max="5"
                        value={maxProductions}
                        onChange={(e) => setMaxProductions(Number(e.target.value))}
                    />
                </div>
            </div>
            
            <div className="row mt-2">
                <div className="col-md-6">
                    <label>Max. délka pravé strany:</label>
                    <input
                        className='form-control'
                        type="number"
                        min="1"
                        max="5"
                        value={maxRuleLength}
                        onChange={(e) => setMaxRuleLength(Number(e.target.value))}
                    />
                </div>
            </div>
            
            {/* Toggle for advanced options */}
            <div className="mt-3">
                <button 
                    className="btn btn-outline-light"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? "Skrýt pokročilé možnosti" : "Zobrazit pokročilé možnosti"}
                </button>
            </div>
            
            {/* Advanced options */}
            {showAdvanced && (
                <div className="mt-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="leftRecursion"
                            checked={allowLeftRecursion}
                            onChange={(e) => setAllowLeftRecursion(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="leftRecursion">
                            Povolit levou rekurzi
                        </label>
                    </div>
                    
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="rightRecursion"
                            checked={allowRightRecursion}
                            onChange={(e) => setAllowRightRecursion(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="rightRecursion">
                            Povolit pravou rekurzi
                        </label>
                    </div>
                    
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="epsilonRules"
                            checked={allowEpsilonRules}
                            onChange={(e) => setAllowEpsilonRules(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="epsilonRules">
                            Povolit ε-pravidla
                        </label>
                    </div>
                </div>
            )}
            
            <button 
                className='btn btn-primary mt-3' 
                onClick={handleGenerateGrammar}
            >
                Generovat gramatiku
            </button>
        </div>
    );
}
