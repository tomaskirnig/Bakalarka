import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { InteractiveMCVPGraph } from './InputSelectionComponents/InteractiveInput';
import { TreeCanvas } from './TreeRenderCanvas';
import { evaluateTree } from './Utils/EvaluateTree';
import { Modal } from '../Common/Modal';
import { StepByStepTree } from './StepByStepTree';
import MCVPtoGrammarConverter from '../Conversions/MCVP-Grammar/MCVPtoGrammarConverter';
import MCVPtoCombinatorialGameConverter from '../Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter';

/**
 * Main component for the Monotone Circuit Value Problem (MCVP) module.
 * Coordinates input selection, graph visualization, evaluation, and problem conversions.
 * 
 * @component
 * @param {Object} props - The component props
 * @param {function} [props.onNavigate] - Callback to navigate to other modules (e.g., Combinatorial Game).
 * @param {Object} [props.initialData] - Initial tree data to load (e.g., when coming from another module).
 */
export function MCVP({ onNavigate, initialData }) {
    const [tree, setTree] = useState(null); // Current tree
    const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [grammarConversion, setGrammarConversion] = useState(false); // Grammar Conversion result
    const [gameConversion, setGameConversion] = useState(false); // Game Conversion result

    // Handle initial data if provided (e.g., from reverse conversion)
    useEffect(() => {
        if (initialData) {
            // If initialData is an MCVP tree structure, set it
            // This assumes initialData structure matches what setTree expects
            setTree(initialData);
        }
    }, [initialData]);

    const evaluationResult = useMemo(() => {
        return tree ? evaluateTree(tree) : null;
    }, [tree]);

    const handleOptionChange = (option) => {
        setChosenOpt(option);
        setTree(null);
    };

    return (
        <div className='div-content'>
            <h1 className='display-4'>MCVP</h1>

            <GenericInputMethodSelector
                selectedOption={chosenOpt}
                onOptionSelect={handleOptionChange}
                options={[
                    { value: 'manual', label: 'Manuálně' },
                    { value: 'generate', label: 'Generovat' },
                    { value: 'sets', label: 'Načíst ze sady' },
                    { value: 'interactive', label: 'Interaktivně' }
                ]}
                renderContent={(opt) => {
                    switch (opt) {
                        case 'manual': return <ManualInput onTreeUpdate={setTree} />;
                        case 'generate': return <GenerateInput onTreeUpdate={setTree} />;
                        case 'sets': return <PreparedSetsInput onTreeUpdate={setTree} />;
                        case 'interactive': return <InteractiveMCVPGraph />;
                        default: return null;
                    }
                }}
            />

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
                    <button className='btn btn-primary mx-2' onClick={() => setGameConversion(true)}>Převést na Kombinatorickou hru</button>
                    <button className='btn btn-primary mx-2' onClick={() => setGrammarConversion(true)} >Převést na Gramatiku</button>
                </div>
            )}

            {grammarConversion && (
                <Modal onClose={() => setGrammarConversion(false)}>
                    {tree && (
                        <MCVPtoGrammarConverter mcvpTree={tree} onNavigate={onNavigate} />
                    )}
                </Modal>
            )}

            {gameConversion && (
                <Modal onClose={() => setGameConversion(false)}>
                    {tree && (
                        <MCVPtoCombinatorialGameConverter mcvpTree={tree} onNavigate={onNavigate} />
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

MCVP.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};
