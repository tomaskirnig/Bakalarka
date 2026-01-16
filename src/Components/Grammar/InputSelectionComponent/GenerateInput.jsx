import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { generateGrammar } from '../Utils/GrammarGenerator';

export function GenerateInput({ onGrammar }) {
    // Basic parameters
    const [numTerminals, setNumTerminals] = useState(2);
    const [numNonTerminals, setNumNonTerminals] = useState(3);
    const [maxRuleLength, setMaxRuleLength] = useState(3);
    
    // Advanced options
    const [allowLeftRecursion, setAllowLeftRecursion] = useState(true);
    const [allowRightRecursion, setAllowRightRecursion] = useState(true);
    const [epsilonMode, setEpsilonMode] = useState('never');
    const [minProductions, setMinProductions] = useState(1);
    const [maxProductions, setMaxProductions] = useState(3);
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
            epsilonMode: epsilonMode
        };

        try {
            // Generate the grammar and pass it to the parent component
            const generatedGrammar = generateGrammar(config);
            
            // Pass the grammar to the parent component
            onGrammar(generatedGrammar);
        } catch (error) {
            toast.error(`Chyba při generování gramatiky: ${error.message}`);
        }
    };
    
    return (
        <div className="inputWindow">
            <h3>Generátor gramatiky</h3>
            
            {/* Basic parameters */}
            <div className="row">
                <div className="col-md-6">
                    <label htmlFor="numTerminals">Počet terminálů:</label>
                    <input
                        id="numTerminals"
                        className='form-control'
                        type="number"
                        min="1"
                        max="10"
                        value={numTerminals}
                        onChange={(e) => setNumTerminals(Number(e.target.value))}
                    />
                </div>
                <div className="col-md-6">
                    <label htmlFor="numNonTerminals">Počet neterminálů:</label>
                    <input
                        id="numNonTerminals"
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
                    <label htmlFor="maxRuleLength">Max. délka pravé strany:</label>
                    <input
                        id="maxRuleLength"
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
                <div className="advanced-options-container">
                    <h6 className="advanced-options-title">
                        Pokročilé možnosti
                    </h6>
                    
                    {/* Rules per nonterminal */}
                    <div className="mb-4">
                        <label className="advanced-options-label">
                            Počet pravých stran na neterminál
                        </label>
                        <div className="row">
                            <div className="col-6">
                                <label htmlFor="minProductions" className="form-label text-white-50 small">Min:</label>
                                <input
                                    id="minProductions"
                                    className='form-control'
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={minProductions}
                                    onChange={(e) => setMinProductions(Number(e.target.value))}
                                />
                            </div>
                            <div className="col-6">
                                <label htmlFor="maxProductions" className="form-label text-white-50 small">Max:</label>
                                <input
                                    id="maxProductions"
                                    className='form-control'
                                    type="number"
                                    min={minProductions}
                                    max="10"
                                    value={maxProductions}
                                    onChange={(e) => setMaxProductions(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Recursion Options */}
                    <div className="mb-4">
                        <label className="advanced-options-label">
                            Rekurze
                        </label>
                        <div className="d-flex gap-4 justify-content-center">
                            <div className="form-check form-switch p-0">
                                <input
                                    className="form-check-input clickable"
                                    type="checkbox"
                                    role="switch"
                                    id="leftRecursion"
                                    checked={allowLeftRecursion}
                                    onChange={(e) => setAllowLeftRecursion(e.target.checked)}
                                />
                                <label className="form-check-label clickable" htmlFor="leftRecursion">
                                    Levá
                                </label>
                            </div>
                            
                            <div className="form-check form-switch p-0">
                                <input
                                    className="form-check-input clickable"
                                    type="checkbox"
                                    role="switch"
                                    id="rightRecursion"
                                    checked={allowRightRecursion}
                                    onChange={(e) => setAllowRightRecursion(e.target.checked)}
                                />
                                <label className="form-check-label clickable" htmlFor="rightRecursion">
                                    Pravá
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Epsilon Options */}
                    <div>
                        <label className="advanced-options-label">
                            Generovat epsilon (ε)
                        </label>
                        <div className="btn-group d-flex" role="group">
                            <input
                                type="radio"
                                className="btn-check"
                                id="epsilonNever"
                                name="epsilonMode"
                                value="never"
                                checked={epsilonMode === 'never'}
                                onChange={(e) => setEpsilonMode(e.target.value)}
                                autoComplete="off"
                            />
                            <label className="btn btn-outline-info clickable" htmlFor="epsilonNever">
                                Ne
                            </label>
                            
                            <input
                                type="radio"
                                className="btn-check"
                                id="epsilonRandom"
                                name="epsilonMode"
                                value="random"
                                checked={epsilonMode === 'random'}
                                onChange={(e) => setEpsilonMode(e.target.value)}
                                autoComplete="off"
                            />
                            <label className="btn btn-outline-info clickable" htmlFor="epsilonRandom">
                                Náhodně
                            </label>
                            
                            <input
                                type="radio"
                                className="btn-check"
                                id="epsilonAlways"
                                name="epsilonMode"
                                value="always"
                                checked={epsilonMode === 'always'}
                                onChange={(e) => setEpsilonMode(e.target.value)}
                                autoComplete="off"
                            />
                            <label className="btn btn-outline-info clickable" htmlFor="epsilonAlways">
                                Vždy
                            </label>
                        </div>
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

GenerateInput.propTypes = {
    onGrammar: PropTypes.func.isRequired
};
