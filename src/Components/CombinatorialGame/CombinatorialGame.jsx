import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { DisplayGraph } from './Utils/DisplayGraph';
import { GameAnalysisDisplay } from './Utils/GameAnalysisDisplay';
import { computeWinner, getOptimalMoves } from './Utils/ComputeWinner';
import { InfoButton } from '../Common/InfoButton';
import { FileTransferControls } from '../Common/FileTransferControls';
import { Modal } from '../Common/Modal';
import { StepByStepGame } from './StepByStepGame';

export function CombinatorialGame({ initialData }) {
    const [graph, setGraph] = useState(null); // Current tree
    const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
    const [selectedStartingPlayer, setSelectedStartingPlayer] = useState(1); // User's choice for starting player
    const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
    
    // Handle initial data if provided
    useEffect(() => {
        if (initialData) {
            setGraph(initialData);
        }
    }, [initialData]);

    const { analysisResult, optimalMoves } = useMemo(() => {
        if (!graph || !graph.positions || !graph.startingPosition) {
            return { analysisResult: null, optimalMoves: null };
        }

        const rawAnalysisResult = computeWinner(graph);
        const playerAtStartNode = graph.positions[graph.startingPosition.id]?.player;

        let finalAnalysisResult = { ...rawAnalysisResult }; // Copy original result
        let analysisValid = true;
        
        if (playerAtStartNode === undefined) {
            finalAnalysisResult.hasWinningStrategy = false;
            finalAnalysisResult.message = "Startovní pozice nemá definovaného hráče.";
            analysisValid = false;
        } else if (chosenOpt !== 'manual' && selectedStartingPlayer !== playerAtStartNode) {
            finalAnalysisResult.hasWinningStrategy = false; // Or null, to indicate unanalyzable
            finalAnalysisResult.message = "Nelze analyzovat: Zvolený začínající hráč se neshoduje s hráčem určeným pro startovní pozici.";
            analysisValid = false;
        } else {
            // The selected starting player matches the player assigned to the starting node
            
            finalAnalysisResult.hasWinningStrategy = rawAnalysisResult.hasWinningStrategy;
            // Use the detailed message from computeWinner (which handles Win/Lose/Draw)
            finalAnalysisResult.message = rawAnalysisResult.message;
        }
        
        // Optimal moves are still calculated based on Player 1's winning positions
        const moves = analysisValid ? getOptimalMoves(graph, rawAnalysisResult) : new Set();
        
        // Pass the interpreted message and winning status to the display
        return { analysisResult: finalAnalysisResult, optimalMoves: moves };
    }, [graph, chosenOpt, selectedStartingPlayer]);

    const handleOptionChange = (option) => {
        setChosenOpt(option);
        setGraph(null);
    };

    const handleExport = () => {
        if (!graph) return null;
        
        // If graph is already in flat format (nodes/edges), return it
        if (graph.nodes || graph.edges) return graph;

        // If graph is in positions format (internal state from ManualInput), convert to flat format
        if (graph.positions) {
            const nodes = Object.values(graph.positions).map(p => ({ 
                id: p.id, 
                player: p.player 
            }));
            const edges = [];
            Object.values(graph.positions).forEach(p => {
                if (p.children) {
                    p.children.forEach(childId => {
                        edges.push({ source: p.id, target: childId });
                    });
                }
            });
            return { 
                nodes, 
                edges, 
                startingPosition: graph.startingPosition ? (graph.startingPosition.id || graph.startingPosition) : null 
            };
        }

        return graph;
    };

    const handleImport = (data) => {
        let graphData = data;
        
        // Handle SadyCG format (Object with keys)
        // Check if data is a collection of sets rather than a single graph
        if (!data.nodes && !data.edges && !data.positions) {
            const keys = Object.keys(data);
            if (keys.length > 0) {
                const firstSet = data[keys[0]];
                if (firstSet && (firstSet.nodes || firstSet.edges || firstSet.positions)) {
                    graphData = firstSet;
                    toast.info(`Importována sada: ${keys[0]}`);
                }
            }
        }

        if (graphData && (graphData.nodes || graphData.edges || graphData.positions)) {
            setGraph(graphData);
            setChosenOpt('manual'); 
        } else {
            throw new Error("Neplatný formát dat pro kombinatorickou hru.");
        }
    };

    return(
        <div className='div-content pb-2 page-container'>
            <div className='page-controls'>
                <FileTransferControls 
                    onExport={handleExport}
                    onImport={handleImport}
                    instructionText="Nahrajte soubor JSON s definicí hry (uzly, hrany, startovní pozice)."
                    fileName="combinatorial_game.json"
                />
                <InfoButton title="Kombinatorická hra na grafu">
                    <p>
                        Jedná se o hru pro dva hráče hranou na konečném orientovaném acyklickém grafu.
                    </p>
                    <ul className="ps-3 text-start">
                        <li><strong>Pravidla:</strong> Každý vrchol je označen I (Hráč 1) nebo II (Hráč 2), podle tohoto označení se určuje, který hráč má v daném vrcholu provést tah. V každém tahu se hráč, který je na tahu, přesune z aktuálního vrcholu do jednoho z jeho následníků.</li>
                        <li><strong>Konec hry:</strong> Prohrává hráč, který má provést tah ve vrcholu, ze kterého nevedou žádné hrany.</li>
                        <li><strong>Cíl:</strong> Určit, zda má začínající hráč vyhrávající strategii (tj. dokáže vynutit výhru bez ohledu na tahy soupeře).</li>
                        <li><strong>Začínající hráč:</strong> Uživatel si zvolí, který hráč začíná.</li>
                    </ul>
                </InfoButton>
            </div>

            <h1 className='display-4 mt-4 mb-lg-4'>Kombinatorická hra</h1>
            
            <div className='page-content'>
            <GenericInputMethodSelector
                selectedOption={chosenOpt}
                onOptionSelect={handleOptionChange}
                options={[
                    { value: 'manual', label: 'Manuálně' },
                    { value: 'generate', label: 'Generovat' },
                    { value: 'sets', label: 'Načíst ze sady' }
                ]}
                renderContent={(opt) => {
                    switch (opt) {
                        case 'manual': return <ManualInput 
                            initialGraph={graph} 
                            onGraphUpdate={setGraph} 
                            analysisResult={analysisResult}
                            optimalMoves={optimalMoves}
                            onExplain={() => setExplain(true)}
                        />;
                        case 'generate': return <GenerateInput onGraphUpdate={setGraph} selectedStartingPlayer={selectedStartingPlayer} setSelectedStartingPlayer={setSelectedStartingPlayer} />;
                        case 'sets': return <PreparedSetsInput onGraphUpdate={setGraph} selectedStartingPlayer={selectedStartingPlayer} setSelectedStartingPlayer={setSelectedStartingPlayer} />;
                        default: return null;
                    }
                }}
            />

            {graph && (
                <>
                    {chosenOpt !== 'manual' && (
                        <>
                            <div style={{ height: '60vh', width: '100%', margin: '20px auto' }}>
                                <DisplayGraph graph={graph} optimalMoves={optimalMoves} />
                            </div>
                            <GameAnalysisDisplay analysisResult={analysisResult} />
                        </>
                    )}
                    
                    {chosenOpt !== 'manual' && (
                        <div className="mt-3">
                            <button className='btn btn-primary' onClick={() => setExplain(true)}>
                                Vysvětlit
                            </button>
                        </div>
                    )}
                </>
            )}

            {explain && (
                <Modal onClose={() => setExplain(false)}>
                    {graph && (
                        <StepByStepGame graph={graph} />
                    )}
                </Modal>
            )}

            {/* {graph && (
                <div className="d-flex justify-content-center gap-3 my-4">
                    <button className='btn-control'>Převést na MCVP</button>
                    <button className='btn-control'>Převést na Kombinatorickou hru</button>
                </div>
            )} */}
            </div>
        </div>  
    );
}

CombinatorialGame.propTypes = {
    onNavigate: PropTypes.func,
    initialData: PropTypes.object
};

export default CombinatorialGame;