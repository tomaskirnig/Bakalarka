import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponent/ManualInput';
import { GenerateInput } from './InputSelectionComponent/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponent/PreparedSetsInput';
import { isEmptyLanguage } from './Utils/GrammarEvaluator';
import { Grammar as GrammarClass } from './Utils/Grammar';
import { InfoButton } from '../Common/InfoButton';
import { FileTransferControls } from '../Common/FileTransferControls';
import { StepByStepGrammar } from './StepByStepGrammar';
import { DerivationTreeVisual } from './DerivationTreeVisual';
import { Modal } from '../Common/Modal';
import { ConversionModal } from '../Common/ConversionModal';

export function Grammar({ initialData }) {
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [grammar, setGrammar] = useState(null); // Current grammar
    const [showSteps, setShowSteps] = useState(false); // Toggle for step-by-step

    // Handle initial data if provided
    useEffect(() => {
        if (initialData) {
            if (initialData instanceof GrammarClass) {
                setGrammar(initialData);
            } else {
                setGrammar(new GrammarClass(initialData));
            }
        }
    }, [initialData]);

    const handleOptionChange = (option) => {
        setChosenOpt(option);
        setGrammar(null);
        setShowSteps(false);
    };

    const handleExport = (includePositions = false) => {
        if (!grammar) return null;
        // Note: Grammar doesn't use positions like graph-based problems
        // The parameter is accepted for API consistency but not used
        // Return the grammar object properties
        return {
            name: grammar.name || "Exported Grammar",
            nonTerminals: grammar.nonTerminals,
            terminals: grammar.terminals,
            productions: grammar.productions
        };
    };

    const handleImport = (data) => {
        // Support both single object and array format (SadyG.json style)
        let grammarData = data;
        if (Array.isArray(data)) {
            if (data.length > 0) {
                grammarData = data[0]; // Take the first one
            } else {
                throw new Error("Prázdné pole v JSON souboru.");
            }
        }

        // Basic validation
        if (!grammarData || typeof grammarData !== 'object') {
             throw new Error("Data musí být objekt.");
        }
        if (!Array.isArray(grammarData.nonTerminals)) {
             throw new Error("Chybí pole 'nonTerminals'.");
        }
        if (!Array.isArray(grammarData.terminals)) {
             throw new Error("Chybí pole 'terminals'.");
        }
        if (!grammarData.productions || typeof grammarData.productions !== 'object') {
             throw new Error("Chybí objekt 'productions'.");
        }

        setGrammar(new GrammarClass(grammarData));
        setChosenOpt('manual'); // Switch to manual/view mode to show the imported result
        setShowSteps(false);
    };

    // Calculate analysis result only once when grammar changes - memoized to prevent recalculation on re-renders
    const analysisResult = useMemo(() => {
        return grammar ? isEmptyLanguage(grammar) : null;
    }, [grammar]);

    return (
        <div className='div-content pb-2 page-container'>
            <div className='page-controls'>
                <FileTransferControls 
                    onExport={handleExport}
                    onImport={handleImport}
                    instructionText="Nahrajte soubor JSON s definicí gramatiky (objekt nebo pole gramatik)."
                    fileName="grammar.json"
                    showPositionOption={false}
                />
                <InfoButton title="Problém neprázdnosti gramatiky">
                    <p>
                        Tento modul řeší problém neprázdnosti pro bezkontextové gramatiky (CFG). Zjišťuje, zda daná gramatika generuje alespoň jeden řetězec složený pouze z terminálních symbolů.
                    </p>
                    <hr />
                    <h6 className="mb-2">Pravidla formátu gramatiky</h6>
                    <ul className="ps-3 mb-2">
                        <li><strong>Oddělte symboly mezerami:</strong> <code>S → a S</code> (správně) vs <code>S → aS</code> (špatně)</li>
                        <li><strong>První písmeno velké (i české) = neterminály:</strong> S, A1, Abc, Č1, A_10</li>
                        <li><strong>Vše ostatní = terminály:</strong> a, +, id, number, 1a</li>
                        <li>První neterminál na prvním řádku je počáteční symbol</li>
                        <li>Použijte <code>|</code> pro oddělení alternativ</li>
                        <li>Použijte <code>ε</code> nebo <code>epsilon</code> pro prázdný řetězec</li>
                    </ul>
                </InfoButton>
            </div>

            <h1 className='display-4 mt-4 mb-lg-4'>Gramatika</h1>

            <div className='page-content'>
            <GenericInputMethodSelector
                selectedOption={chosenOpt}
                onOptionSelect={handleOptionChange}
                options={[
                    { value: 'manual', label: 'Manuálně' },
                    { value: 'generate', label: 'Generovat' },
                    { value: 'sets', label: 'Načíst ze sady' }
                ]}
                renderContent={(opt) => {
                    switch (opt) {
                        case 'manual': return <ManualInput onGrammar={setGrammar} />;
                        case 'generate': return <GenerateInput onGrammar={setGrammar} />;
                        case 'sets': return <PreparedSetsInput onGrammar={setGrammar} />;
                        default: return null;
                    }
                }}
            />

            {grammar && analysisResult && (
                <div className='mt-4 mb-4'>
                    <div className="card mb-3 text-center" style={{ maxWidth: '600px', margin: 'auto', marginBottom: '30px' }}>
                        <div className="card-header">
                            <h5>Definice gramatiky</h5>
                        </div>
                        <div className="card-body bg-light text-center">
                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {grammar.toText ? grammar.toText() : JSON.stringify(grammar, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Analýza gramatiky</h4>
                        </div>
                        <div className="card-body">
                             <p className={`alert ${!analysisResult.isEmpty ? 'alert-success' : 'alert-warning'}`}>
                                {analysisResult.explanation}
                             </p>
                        </div>
                        
                        {/* Step-by-Step Visualization Modal */}
                        {showSteps && (
                            <ConversionModal onClose={() => setShowSteps(false)}>
                                <StepByStepGrammar grammar={grammar} />
                            </ConversionModal>
                        )}
                        
                        {!analysisResult.isEmpty && analysisResult.derivationTree && (
                            <div className="card-body border-top">
                                <h5>Ukázkový derivační strom</h5>
                                {analysisResult.derivedWord !== undefined && analysisResult.derivedWord !== null && (
                                    <p className="text-muted small">
                                        Odvozené slovo: <strong>{analysisResult.derivedWord || 'ε'}</strong>
                                    </p>
                                )}
                                {(analysisResult.derivedWord === undefined || analysisResult.derivedWord === null) && (
                                    <p className="text-muted small">Tento strom ukazuje jedno z možných vyvození terminálního řetězce.</p>
                                )}
                                <div style={{ height: '60vh', width: '100%' }}>
                                    <DerivationTreeVisual tree={analysisResult.derivationTree} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-3">
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowSteps(true)}
                        >
                            Vysvětlit
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

Grammar.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};
