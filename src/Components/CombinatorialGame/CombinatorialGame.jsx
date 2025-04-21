import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelection';
import { DisplayGraph } from './Utils/DisplayGraph';
import { computeWinner } from './Utils/ComputeWinner';

export function CombinatorialGame() {
    const [graph, setGraph] = useState(null); // Current tree
    //const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    
    return(
        <div className='div-content'>
            <h1 className='display-4'>Kombinatorická hra</h1>
            <InputMethodSelector onGraphUpdate={ setGraph } chosenOpt={ chosenOpt } setChosenOpt={ setChosenOpt } />

            {graph && <DisplayGraph graph={graph} />}
            {graph && <computeWinner graph={graph} />}
        </div>  
    );
}