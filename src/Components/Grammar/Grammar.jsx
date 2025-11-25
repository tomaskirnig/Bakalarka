import { useState } from 'react';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponent/ManualInput';
import { GenerateInput } from './InputSelectionComponent/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponent/PreparedSetsInput';
import { isEmptyLanguage } from './Utils/GrammarEvaluator';

export function Grammar() {
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [grammar, setGrammar] = useState(null); // Current grammar

    const handleOptionChange = (option) => {
        setChosenOpt(option);
        setGrammar(null);
    };

    return (
        <div className='div-content'>
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
                <div className='inputWindow'>
                    <h2>Aktuální gramatika:</h2>
                    <pre className='text-start w-auto mx-auto d-inline-block'>{grammar.toText()}</pre>
                    <p>{String(isEmptyLanguage(grammar).isEmpty)}</p>
                    <p>{isEmptyLanguage(grammar).explanation}</p>

                    <button className='btn btn-primary mx-2'>Převést na MCVP</button>
                    <button className='btn btn-primary mx-2'>Převést na Kombinatorickou hru</button>
                </div>
            )}
        </div>
    );
}
