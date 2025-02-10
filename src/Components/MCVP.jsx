import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelector';
import { TreeCanvas } from '../Utils/TreeRenderCanvas';
import { evaluateTree } from '../Utils/EvaluateTree';
import { Modal } from './Modal';
import StepByStepTree from './StepByStepTree';
// import { getMax } from 'mermaid/dist/diagrams/common/common.js';

export function MCVP() {
    const [tree, setTree] = useState(null); 
    const [explain, setExplain] = useState(false);

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
            <p>This is the MCVP Page</p>

            {/* Pass the handleTreeUpdate function to InputMethodSelector */}
            <InputMethodSelector onTreeUpdate={handleTreeUpdate} />

            {tree && <p>Result: {Boolean(evaluateTree(tree)) ? 'True' : 'False'}</p>}

            {/* Render the tree if it exists */}
            {tree && <TreeCanvas tree={tree} />}

            <button className='btn btn-primary' onClick={() => handleExplainToggle(true)}> Vysvětlit</button>

            {/* Render the modal if explain is true */}
            {explain && (
                <Modal onClose={() => handleExplainToggle(false)}>
                    {tree && (
                        <StepByStepTree tree={tree} />
                    )}
                </Modal>
            )}
        </div>
    );
}

export default MCVP;
