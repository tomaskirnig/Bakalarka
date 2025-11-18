import { useMemo, useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelector';
import { TreeCanvas } from './Utils/TreeRenderCanvas';
import { evaluateTree } from './Utils/EvaluateTree';
import { Modal } from './Modal';
import { StepByStepTree } from './StepByStepTree';
import MCVPtoGrammarConverter from '../Conversions/MCVP-Grammar/MCVPtoGrammarConverter';

export function MCVP() {
    const [tree, setTree] = useState(null); // Current tree
    const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [conversion, setConversion] = useState(null); // Conversion result

    const evaluationResult = useMemo(() => {
        return tree ? evaluateTree(tree) : null;
    }, [tree]);

    return (
        <div className='div-content'>
            <h1 className='display-4'>MCVP</h1>

            <InputMethodSelector onTreeUpdate={ setTree } setChosenOpt={ setChosenOpt } />


            {(tree && chosenOpt !== 'interactive') && <TreeCanvas tree={tree} />}

            {tree && (
                <div className="card h-100 mt-3">
                    <div className="card-header">
                        <h4>Výsledek obvodu</h4>
                    </div>
                    <div className="card-body">
                        {evaluationResult !== null ? (
                            <>
                                <div className={`alert ${evaluationResult ? 'alert-success' : 'alert-warning'}`}>
                                    {`Výsledek: ${evaluationResult}`}
                                </div>
                                {/* <p className="text-muted">
                                    Zlatě vyznačené hrany představují optimální tahy pro Hráče I.
                                </p> */}
                            </>
                        ) : (
                            <p className="text-muted">Přidejte více uzlů a propojte je pro analýzu.</p>
                        )}
                    </div>
                </div>
            )}

            {tree && (
                <div>
                    <button className='btn btn-primary m-2' onClick={() => setExplain(true)}> Vysvětlit</button>
                    <button className='btn btn-primary mx-2'>Převést na Kombinatorickou hru</button>
                    <button className='btn btn-primary mx-2' onClick={() => setConversion(true)} >Převést na Gramatiku</button>
                </div>
            )}

            {conversion && (
                <Modal onClose={() => setConversion(false)}>
                    {tree && (
                        <MCVPtoGrammarConverter mcvpTree={tree} />
                    )}
                </Modal>
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
