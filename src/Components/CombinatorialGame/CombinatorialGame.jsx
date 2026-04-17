import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { DisplayGraph } from './Utils/DisplayGraph';
import { GameAnalysisDisplay } from './Utils/GameAnalysisDisplay';
import { computeWinner, getOptimalMoves } from './Utils/ComputeWinner';
import { InfoButton } from '../Common/InfoButton';
import { FileTransferControls } from '../Common/FileTransferControls';
import { ConversionModal } from '../Common/ConversionModal';
import { StepByStepGame } from './StepByStepGame';

const INPUT_OPTIONS = [
  { value: 'manual', label: 'Manuálně' },
  { value: 'generate', label: 'Generovat' },
  { value: 'sets', label: 'Načíst ze sady' },
];

const isSelectedPlayerMismatch = (chosenOpt, selectedStartingPlayer, playerAtStartNode) =>
  chosenOpt !== 'manual' && selectedStartingPlayer !== playerAtStartNode;

/**
 * Counts positions with no incoming and no outgoing edges.
 *
 * @param {{positions?: Object}|null} graph - Internal graph format.
 * @returns {number} Number of isolated positions.
 */
function countIsolatedNodes(graph) {
  if (!graph?.positions) return 0;

  return Object.values(graph.positions).reduce((count, pos) => {
    const outCount = (pos.children || []).length;
    const inCount = (pos.parents || []).length;
    return count + (outCount === 0 && inCount === 0 ? 1 : 0);
  }, 0);
}

/**
 * Main page component for combinatorial game input, analysis, and visualization.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Combinatorial game module UI.
 */
export function CombinatorialGame({ initialData, autoScrollToGraph = true }) {
  const [graph, setGraph] = useState(null); // Current tree
  const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
  const [selectedStartingPlayer, setSelectedStartingPlayer] = useState(1); // User's choice for starting player
  const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
  const [graphFitTrigger, setGraphFitTrigger] = useState(0);
  const graphDisplaySectionRef = useRef(null);

  // Handle initial data if provided
  useEffect(() => {
    if (initialData) {
      setGraph(initialData);
    }
  }, [initialData]);

  const isolatedNodeCount = useMemo(() => countIsolatedNodes(graph), [graph]);

  const rawAnalysisResult = useMemo(() => {
    if (!graph || !graph.positions || !graph.startingPosition) return null;
    return computeWinner(graph);
  }, [graph]);

  // Validation/display logic — re-runs when user changes options or starting player
  const { analysisResult, optimalMoves, analysisSteps } = useMemo(() => {
    if (!rawAnalysisResult) {
      return { analysisResult: null, optimalMoves: null, analysisSteps: [] };
    }

    const playerAtStartNode = graph.positions[graph.startingPosition.id]?.player;
    let finalAnalysisResult = { ...rawAnalysisResult };
    let analysisValid = true;

    if (playerAtStartNode === undefined) {
      finalAnalysisResult.hasWinningStrategy = false;
      finalAnalysisResult.message = 'Startovní pozice nemá definovaného hráče.';
      analysisValid = false;
    } else if (isSelectedPlayerMismatch(chosenOpt, selectedStartingPlayer, playerAtStartNode)) {
      finalAnalysisResult.hasWinningStrategy = false;
      finalAnalysisResult.message =
        'Nelze analyzovat: Zvolený začínající hráč se neshoduje s hráčem určeným pro startovní pozici.';
      analysisValid = false;
    } else {
      finalAnalysisResult.hasWinningStrategy = rawAnalysisResult.hasWinningStrategy;
      finalAnalysisResult.message = rawAnalysisResult.message;
    }

    const moves = analysisValid ? getOptimalMoves(graph, rawAnalysisResult) : new Set();
    return {
      analysisResult: finalAnalysisResult,
      optimalMoves: moves,
      analysisSteps: rawAnalysisResult.steps,
    };
  }, [rawAnalysisResult, graph, selectedStartingPlayer, chosenOpt]);

  const handleOptionChange = (option) => {
    setChosenOpt(option);
    setGraph(null);
  };

  // Refit once when a generated/prepared/imported graph is shown in view mode.
  useEffect(() => {
    if (!graph || chosenOpt === 'manual') return;
    setGraphFitTrigger((prev) => prev + 1);
  }, [graph, chosenOpt]);

  useEffect(() => {
    if (!autoScrollToGraph || !graph || chosenOpt === 'manual') return;

    const frameId = requestAnimationFrame(() => {
      graphDisplaySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => cancelAnimationFrame(frameId);
  }, [autoScrollToGraph, graph, chosenOpt]);

  const handleExport = (includePositions = false) => {
    if (!graph) return null;

    // If graph is already in flat format (nodes/edges), return it (possibly with positions)
    if (graph.nodes || graph.edges) {
      const result = { ...graph };

      // If positions were not already included but requested, try to extract them from nodes
      if (includePositions && !graph.nodePositions && graph.nodes) {
        const nodePositions = {};
        graph.nodes.forEach((node) => {
          if (typeof node.x === 'number' && typeof node.y === 'number') {
            nodePositions[node.id] = { x: node.x, y: node.y };
          }
        });
        if (Object.keys(nodePositions).length > 0) {
          result.nodePositions = nodePositions;
        }
      }

      return result;
    }

    // If graph is in positions format (internal state from ManualInput), convert to flat format
    if (graph.positions) {
      const nodes = Object.values(graph.positions).map((p) => ({
        id: p.id,
        player: p.player,
      }));
      const edges = [];
      const nodePositions = {};

      Object.values(graph.positions).forEach((p) => {
        if (p.children) {
          p.children.forEach((childId) => {
            edges.push({ source: p.id, target: childId });
          });
        }

        // Capture positions if requested
        if (includePositions && typeof p.x === 'number' && typeof p.y === 'number') {
          nodePositions[p.id] = { x: p.x, y: p.y };
        }
      });

      const result = {
        nodes,
        edges,
        startingPosition: graph.startingPosition
          ? graph.startingPosition.id || graph.startingPosition
          : null,
      };

      if (includePositions && Object.keys(nodePositions).length > 0) {
        result.nodePositions = nodePositions;
      }

      return result;
    }

    return graph;
  };

  const handleImport = (data) => {
    let graphData = data;

    // Handle SadyCG format (Object with keys)
    // Check if data is a collection of sets rather than a single graph
    if (!data.nodes && !data.edges && !data.links && !data.positions) {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const firstSet = data[keys[0]];
        if (
          firstSet &&
          (firstSet.nodes || firstSet.edges || firstSet.links || firstSet.positions)
        ) {
          graphData = firstSet;
          toast.info(`Importována sada: ${keys[0]}`);
        }
      }
    }

    if (
      graphData &&
      (graphData.nodes || graphData.edges || graphData.links || graphData.positions)
    ) {
      setGraph(graphData);
      setChosenOpt('manual');
    } else {
      throw new Error('Neplatný formát dat pro kombinatorickou hru.');
    }
  };

  return (
    <div className="div-content pb-2 page-container">
      <div className="page-controls">
        <FileTransferControls
          onExport={handleExport}
          onImport={handleImport}
          instructionText="Nahrajte soubor JSON s definicí hry (uzly, hrany, startovní pozice)."
          fileName="combinatorial_game.json"
          showPositionOption={false}
        />
        <InfoButton title="Kombinatorická hra na grafu">
          <p>
            Jedná se o hru pro dva hráče hranou na konečném orientovaném grafu (který může obsahovat
            cykly).
          </p>
          <ul className="ps-3 text-start">
            <li>
              <strong>Pravidla:</strong> Každý vrchol je označen I (Hráč 1) nebo II (Hráč 2), podle
              tohoto označení se určuje, který hráč má v daném vrcholu provést tah. V každém tahu se
              hráč, který je na tahu, přesune z aktuálního vrcholu do jednoho z jeho následníků.
            </li>
            <li>
              <strong>Konec hry:</strong> Prohrává hráč, který má provést tah ve vrcholu, ze kterého
              nevedou žádné hrany.
            </li>
            <li>
              <strong>Cíl:</strong> Určit, zda má začínající hráč vyhrávající strategii (tj. dokáže
              vynutit výhru bez ohledu na tahy soupeře).
            </li>
            <li>
              <strong>Začínající hráč:</strong> Uživatel si zvolí, který hráč začíná.
            </li>
          </ul>
        </InfoButton>
      </div>

      <h1 className="display-4 mt-4 mb-lg-4">Kombinatorická hra</h1>

      <div className="page-content">
        <GenericInputMethodSelector
          selectedOption={chosenOpt}
          onOptionSelect={handleOptionChange}
          options={INPUT_OPTIONS}
          renderContent={(opt) => {
            switch (opt) {
              case 'manual':
                return (
                  <ManualInput
                    initialGraph={graph}
                    onGraphUpdate={setGraph}
                    analysisResult={analysisResult}
                    optimalMoves={optimalMoves}
                    onExplain={() => setExplain(true)}
                  />
                );
              case 'generate':
                return (
                  <GenerateInput
                    onGraphUpdate={setGraph}
                    selectedStartingPlayer={selectedStartingPlayer}
                    setSelectedStartingPlayer={setSelectedStartingPlayer}
                  />
                );
              case 'sets':
                return (
                  <PreparedSetsInput
                    onGraphUpdate={setGraph}
                    selectedStartingPlayer={selectedStartingPlayer}
                    setSelectedStartingPlayer={setSelectedStartingPlayer}
                  />
                );
              default:
                return null;
            }
          }}
        />

        {graph && (
          <>
            {isolatedNodeCount > 0 && (
              <div className="alert alert-info mt-2 mx-auto" style={{ maxWidth: '900px' }}>
                V grafu jsou nalezeny izolované uzly bez hran ({isolatedNodeCount}). Tyto uzly
                nemají vliv na průchod hrou ze startovní pozice.
              </div>
            )}

            {chosenOpt !== 'manual' && (
              <div ref={graphDisplaySectionRef}>
                <div style={{ height: '60vh', width: '100%', margin: '20px auto' }}>
                  <DisplayGraph
                    graph={graph}
                    optimalMoves={optimalMoves}
                    fitTrigger={graphFitTrigger}
                    showLockControl={true}
                  />
                </div>
                <GameAnalysisDisplay analysisResult={analysisResult} />
              </div>
            )}

            {chosenOpt !== 'manual' && (
              <div className="mt-3">
                <button type="button" className="btn btn-primary" onClick={() => setExplain(true)}>
                  Vysvětlit
                </button>
              </div>
            )}
          </>
        )}

        {explain && (
          <ConversionModal onClose={() => setExplain(false)}>
            {graph && <StepByStepGame graph={graph} analysisSteps={analysisSteps} />}
          </ConversionModal>
        )}
      </div>
    </div>
  );
}

CombinatorialGame.propTypes = {
  onNavigate: PropTypes.func,
  initialData: PropTypes.object,
  autoScrollToGraph: PropTypes.bool,
};

export default CombinatorialGame;
