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

            <InputMethodSelector onTreeUpdate={ setTree } setChosenOpt={ setChosenOpt } />

            {tree && <p>Výsledek: {Boolean(evaluateTree(tree)) ? '1' : '0'}</p>}

            {(tree && chosenOpt !== 'interactive') && <TreeCanvas tree={tree} />}

            {tree && (
                <div>
                    <button className='btn btn-primary m-2' onClick={() => setExplain(true)}> Vysvětlit</button>
                    <button className='btn btn-primary mx-2'>Převést na MCVP</button>
                    <button className='btn btn-primary mx-2'>Převést na Kombinatorickou hru</button>
                </div>
            )}

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
