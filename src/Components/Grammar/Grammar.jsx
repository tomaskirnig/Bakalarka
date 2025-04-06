import React, { useState } from 'react';
import { InputMethodSelection } from './InputSelectionComponent/InputMethodSelection';

export function Grammar() {
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [grammar, setGrammar] = useState(null); // Current grammar

    return (
        <div className='div-content'>
            <h1 className='display-4'>Gramatika</h1>

            <InputMethodSelection onGrammar={setGrammar} chosenOpt={chosenOpt} onChosenOpt={setChosenOpt}/>
        </div>
    );
}
