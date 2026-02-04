import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { InteractiveMCVPGraph } from './InputSelectionComponents/InteractiveInput';
import { TreeRenderCanvas } from './TreeRenderCanvas';
import { evaluateTree } from './Utils/EvaluateTree';
import { Modal } from '../Common/Modal';
import { StepByStepTree } from './StepByStepTree';
import MCVPtoGrammarConverter from '../Conversions/MCVP-Grammar/MCVPtoGrammarConverter';
import MCVPtoCombinatorialGameConverter from '../Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter';
import { InfoButton } from '../Common/InfoButton';
import { FileTransferControls } from '../Common/FileTransferControls';
import { treeToFlatGraph, flatGraphToTree } from './Utils/Serialization';
import { toast } from 'react-toastify';

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

    const handleExport = () => {
        if (!tree) return null;
        return treeToFlatGraph(tree);
    };

    const handleImport = (data) => {
        let graphData = data;
        
        // Handle SadyMCVP format (Object with keys)
        if (!data.nodes && !data.edges && !data.links) {
            const keys = Object.keys(data);
            if (keys.length > 0) {
                // Try to take the first set found
                const firstSet = data[keys[0]];
                if (firstSet && (firstSet.nodes || firstSet.edges || firstSet.links)) {
                    graphData = firstSet;
                    toast.info(`Importována sada: ${keys[0]}`);
                }
            }
        }

        const newTree = flatGraphToTree(graphData);
        if (newTree) {
            setTree(newTree);
            setChosenOpt('manual'); // Switch to view/manual mode
        } else {
            throw new Error("Nepodařilo se vytvořit strom z importovaných dat.");
        }
    };

    return (
        <div className='div-content page-container'>
            <div className='page-controls'>
                <FileTransferControls 
                    onExport={handleExport}
                    onImport={handleImport}
                    instructionText="Nahrajte soubor JSON s definicí obvodu ({nodes, edges/links})."
                    fileName="mcvp_circuit.json"
                />
                <InfoButton title="Monotónní obvody (MCVP)">
                    <p>
                        Problém hodnoty monotónního obvodu (MCVP) se zabývá vyhodnocením booleovského obvodu, který obsahuje pouze hradla AND a OR (bez negací).
                    </p>
                    <ul className="ps-3">
                        <li><strong>Vstupy:</strong> Logické hodnoty 0 nebo 1.</li>
                        <li><strong>Hradla:</strong> AND (logický součin) a OR (logický součet).</li>
                        <li><strong>Cíl:</strong> Určit výstupní hodnotu celého obvodu (kořenového uzlu).</li>
                    </ul>
                    <p className="mb-0">
                        Tento problém je P-úplný, což znamená, že je těžké jej efektivně paralelizovat.
                    </p>
                </InfoButton>
            </div>

            <h1 className='display-4 mt-4 mb-lg-4'>MCVP</h1>

            <div className='page-content'>
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
                        case 'interactive': return <InteractiveMCVPGraph onTreeUpdate={setTree} />;
                        default: return null;
                    }
                }}
            />

            {(tree && chosenOpt !== 'interactive') && (
                <div style={{ height: '60vh', width: '100%', margin: '20px auto' }}>
                    <TreeRenderCanvas tree={tree} />
                </div>
            )}

            {tree && (
                <div className="card mt-3 mx-auto shadow-sm" style={{ maxWidth: '600px' }}>
                    <div className="card-header bg-light fw-bold text-center">
                        Výsledek obvodu
                    </div>
                    <div className="card-body text-center">
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
        </div>
    );
}

MCVP.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};
