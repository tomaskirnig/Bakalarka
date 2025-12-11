import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponent/ManualInput';
import { GenerateInput } from './InputSelectionComponent/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponent/PreparedSetsInput';
import { isEmptyLanguage } from './Utils/GrammarEvaluator';
import { Grammar as GrammarClass } from './Utils/Grammar';
import { GrammarGraph } from './GrammarGraph';
import { InfoButton } from '../Common/InfoButton';

export function Grammar({ onNavigate, initialData }) {
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [grammar, setGrammar] = useState(null); // Current grammar

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
    };

    return (
        <div className='div-content'>
            <InfoButton title="Problém prázdnosti gramatiky">
                <p>
                    Tento modul řeší problém prázdnosti pro bezkontextové gramatiky (CFG). Zjišťuje, zda daná gramatika generuje alespoň jeden řetězec složený pouze z terminálních symbolů.
                </p>
                <hr />
                <h6 className="mb-2">Nápověda k formátu gramatiky</h6>
                <ul className="ps-3 mb-0">
                    <li>První řádek definuje počáteční symbol.</li>
                    <li><strong>Neterminály:</strong> Velká písmena (A-Z).</li>
                    <li><strong>Terminály:</strong> Jakékoliv znaky kromě velkých písmen.</li>
                    <li><strong>Pravidla:</strong> Tvar <code>S → aS | bA</code>.</li>
                    <li>Použijte <code>|</code> pro oddělení alternativ.</li>
                    <li>Použijte <code>ε</code> pro prázdný řetězec.</li>
                </ul>
            </InfoButton>

            <h1 className='display-4'>Gramatika</h1>

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

            {grammar && (
                <div className='mt-4 mb-4'>
                    <GrammarGraph grammar={grammar} />
                    
                    <div className="card mt-3">
                        <div className="card-header">
                            <h4>Analýza gramatiky</h4>
                        </div>
                        <div className="card-body">
                             <p className={`alert ${!isEmptyLanguage(grammar).isEmpty ? 'alert-success' : 'alert-warning'}`}>
                                {isEmptyLanguage(grammar).explanation}
                             </p>
                        </div>
                    </div>

                    {/* <div className='mt-3'>
                        <button className='btn btn-primary mx-2'>Převést na MCVP</button>
                        <button className='btn btn-primary mx-2'>Převést na Kombinatorickou hru</button>
                    </div> */}
                </div>
            )}
        </div>
    );
}

Grammar.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};
