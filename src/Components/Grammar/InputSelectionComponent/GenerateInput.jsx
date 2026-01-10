import { useState } from 'react';
import PropTypes from 'prop-types';
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
    const [epsilonMode, setEpsilonMode] = useState('never');
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
            alert(`Chyba při generování gramatiky: ${error.message}`);
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
                    <label htmlFor="minProductions">Min. pravidel na neterminál:</label>
                    <input
                        id="minProductions"
                        className='form-control'
                        type="number"
                        min="1"
                        max="5"
                        value={minProductions}
                        onChange={(e) => setMinProductions(Number(e.target.value))}
                    />
                </div>
                <div className="col-md-6">
                    <label htmlFor="maxProductions">Max. pravidel na neterminál:</label>
                    <input
                        id="maxProductions"
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
                <div className="mt-3 p-3 rounded" style={{ 
                    backgroundColor: 'rgba(13, 110, 110, 0.2)',
                    border: '1px solid rgba(13, 202, 240, 0.3)'
                }}>
                    <h6 className="mb-3 text-center" style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '500', 
                        color: '#0dcaf0',
                        letterSpacing: '0.5px'
                    }}>
                        Pokročilé možnosti
                    </h6>
                    
                    {/* Recursion Options */}
                    <div className="mb-4">
                        <label className="form-label mb-3 text-center d-block" style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '500',
                            color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                            Rekurze
                        </label>
                        <div className="d-flex gap-4 justify-content-center">
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="leftRecursion"
                                    checked={allowLeftRecursion}
                                    onChange={(e) => setAllowLeftRecursion(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <label className="form-check-label" htmlFor="leftRecursion" style={{ cursor: 'pointer' }}>
                                    Levá
                                </label>
                            </div>
                            
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="rightRecursion"
                                    checked={allowRightRecursion}
                                    onChange={(e) => setAllowRightRecursion(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <label className="form-check-label" htmlFor="rightRecursion" style={{ cursor: 'pointer' }}>
                                    Pravá
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Epsilon Options */}
                    <div>
                        <label className="form-label mb-3 text-center d-block" style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '500',
                            color: 'rgba(255, 255, 255, 0.9)'
                        }}>
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
                            <label className="btn btn-outline-info" htmlFor="epsilonNever" style={{ cursor: 'pointer' }}>
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
                            <label className="btn btn-outline-info" htmlFor="epsilonRandom" style={{ cursor: 'pointer' }}>
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
                            <label className="btn btn-outline-info" htmlFor="epsilonAlways" style={{ cursor: 'pointer' }}>
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
