import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelection';

export function CombinatorialGame() {
    const [graph, setGraph] = useState(null); // Current tree
    const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    
    // Function to update the graph
    const handleGraphUpdate = (newgraph) => {
        setGraph(newgraph);
    };

    const handleExplainToggle = (value) => {
        setExplain(value);
    }

    return(
        <div className='div-content'>
            <h1 className='display-4'>Kombinatorická hra</h1>
            <InputMethodSelector onGrapUpdate={ handleGraphUpdate } setChosenOpt={ setChosenOpt } />
        </div>  
    );
}