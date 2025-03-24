import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelector';
import { TreeCanvas } from './Utils/TreeRenderCanvas';
import { evaluateTree } from './Utils/EvaluateTree';
import { Modal } from './Modal';
import { StepByStepTree } from './StepByStepTree';

export function MCVP() {
    const [tree, setTree] = useState(null); // Current tree
    const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method

    return (
        <div className='div-content'>
            <h1 className='display-4'>MCVP</h1>
            {/* <p>This is the MCVP Page</p> */}

            <InputMethodSelector onTreeUpdate={ setTree } setChosenOpt={ setChosenOpt } />

            {tree && <p>Result: {Boolean(evaluateTree(tree)) ? 'True' : 'False'}</p>}

            {(tree && chosenOpt !== 'interactive') && <TreeCanvas tree={tree} />}

            <button className='btn btn-primary' onClick={() => setExplain(true)}> Vysvětlit</button>

            {explain && (
                <Modal onClose={() => setExplain(false)}>
                    {tree && (
                        <StepByStepTree tree={ tree } />
                    )}
                </Modal>
            )}
        </div>
    );
}

// tree structure with react-force-graph https://github.com/vasturiano/react-force-graph/blob/master/example/tree/index.html