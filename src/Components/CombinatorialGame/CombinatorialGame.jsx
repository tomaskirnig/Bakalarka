import { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelection';
import { DisplayGraph } from './Utils/DisplayGraph';

export function CombinatorialGame() {
    const [graph, setGraph] = useState(null); // Current tree
    //const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    
    return(
        <div className='div-content'>
            <h1 className='display-4'>Kombinatorická hra</h1>
            <InputMethodSelector onGraphUpdate={ setGraph } chosenOpt={ chosenOpt } setChosenOpt={ setChosenOpt } />

            {graph && <DisplayGraph graph={graph} />}

            {graph && (
                <div>
                    <button className='btn add-btn mx-2 mb-3'>Převést na MCVP</button>
                    <button className='btn add-btn mx-2 mb-3'>Převést na Kombinatorickou hru</button>
                </div>
            )}
        </div>  
    );
}