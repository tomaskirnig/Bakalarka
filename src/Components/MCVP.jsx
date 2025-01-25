import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelector';
import { renderTree } from '../Utils/TreeRender';
import { TreeCanvas } from '../Utils/TreeRenderCanvas';
import { TreeSVG } from '../Utils/TreeRenderSVG';
import { evaluateTree } from '../Utils/EvaluateTree';
import { Modal } from './Modal';

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

            {tree && <p>Result: {evaluateTree(tree) ? 'True' : 'False'}</p>}

            {/* Render the tree if it exists */}
            {tree && <TreeCanvas tree={tree} />}

            <button className='btn btn-primary' onClick={() => handleExplainToggle(true)}> Vysvětlit</button>

            {/* Render the modal if explain is true */}
            {explain && (
                <Modal onClose={() => handleExplainToggle(false)}>
                    <h2>Explanation</h2>
                    <p>This is where the step-by-step explanation of the MCVP evaluation process.</p>
                </Modal>
            )}
        </div>
    );
}

export default MCVP;
