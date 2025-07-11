import { useState } from 'react';
import { InputMethodSelection } from './InputSelectionComponent/InputMethodSelection';
import { isEmptyLanguage } from './Utils/GrammarEvaluator';

export function Grammar() {
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [grammar, setGrammar] = useState(null); // Current grammar

    return (
        <div className='div-content'>
            <h1 className='display-4'>Gramatika</h1>

            <InputMethodSelection onGrammar={setGrammar} chosenOpt={chosenOpt} onChosenOpt={setChosenOpt}/>

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
