import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelector';
import { TreeCanvas } from '../Utils/TreeRenderCanvas';
import { evaluateTree } from '../Utils/EvaluateTree';
import { Modal } from './Modal';
import StepByStepTree from './StepByStepTree';

export function MCVP() {
    const [tree, setTree] = useState(null); // Current tree
    const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method

    // Function to update the tree
    const handleTreeUpdate = (newTree) => {
        setTree(newTree);
    };

    const handleExplainToggle = (value) => {
        setExplain(value);
    }

    return (
        <div className='div-content'>
            <h1 className='display-4'>MCVP</h1>
            {/* <p>This is the MCVP Page</p> */}

            <InputMethodSelector onTreeUpdate={ handleTreeUpdate } setChosenOpt={ setChosenOpt } />

            {tree && <p>Result: {Boolean(evaluateTree(tree)) ? 'True' : 'False'}</p>}

            {(tree && chosenOpt !== 'interactive') && <TreeCanvas tree={tree} />}

            <button className='btn btn-primary' onClick={() => handleExplainToggle(true)}> Vysvětlit</button>

            {explain && (
                <Modal onClose={() => handleExplainToggle(false)}>
                    {tree && (
                        <StepByStepTree tree={ tree } />
                    )}
                </Modal>
            )}
        </div>
    );
}

export default MCVP;
