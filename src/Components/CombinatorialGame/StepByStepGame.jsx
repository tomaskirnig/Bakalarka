import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { DisplayGraph } from './Utils/DisplayGraph';

/**
 * Computes the winning strategy step-by-step using a bottom-up approach.
 * Returns an array of steps, each containing information about the analysis of a position.
 */
function computeWinningStrategySteps(graph) {
  if (!graph || !graph.positions || !graph.startingPosition) {
    return [];
  }

  const memo = {};
  const processing = new Set();
  const visited = new Set();
  const stack = [graph.startingPosition.id];
  const steps = [];
  
  const getResult = (id) => memo[id] === undefined ? false : memo[id];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];

    if (memo[u] !== undefined && !processing.has(u)) {
      stack.pop();
      continue;
    }

    if (!visited.has(u)) {
      processing.add(u);
      visited.add(u);
      memo[u] = false; // Default/Cycle assumption

      const position = graph.positions[u];
      if (position && position.children) {
        for (const v of position.children) {
           if (!processing.has(v) && memo[v] === undefined) {
             stack.push(v);
           }
        }
      }
    } else {
      const position = graph.positions[u];
      let result = false;
      let explanation = '';
      const childResults = {};
      
      if (!position) {
         result = false;
         explanation = 'Pozice neexistuje';
      } else if (position.player === 2 && (!position.children || position.children.length === 0)) {
         result = true;
         explanation = 'H2 nemá žádný tah → H1 vyhrává';
      } else if (position.player === 1) {
         // Player 1: wins if at least one child is winning
         if (position.children && position.children.length > 0) {
           const childStatuses = position.children.map(childId => {
             childResults[childId] = getResult(childId);
             return getResult(childId);
           });
           
           result = childStatuses.some(status => status);
           
           if (result) {
             const winningChildren = position.children.filter(childId => getResult(childId));
             explanation = `H1 může vyhrát přesunem do ${winningChildren.length > 1 ? 'pozic' : 'pozice'}: ${winningChildren.join(', ')}`;
           } else {
             explanation = 'H1 nemá výherní tah (všechny následníci jsou prohrávající)';
           }
         } else {
           result = false;
           explanation = 'H1 nemá žádný tah → H1 prohrává';
         }
      } else if (position.player === 2) {
         // Player 2: wins (for P1) if ALL children are winning
         if (!position.children || position.children.length === 0) {
            result = true; 
            explanation = 'H2 nemá žádný tah → H1 vyhrává';
         } else {
            const childStatuses = position.children.map(childId => {
              childResults[childId] = getResult(childId);
              return getResult(childId);
            });
            
            result = childStatuses.every(status => status);
            
            if (result) {
              explanation = 'Všechny tahy H2 vedou k výhře H1';
            } else {
              const losingChildren = position.children.filter(childId => !getResult(childId));
              explanation = `H2 může přesunout do prohrávající pozice: ${losingChildren.join(', ')}`;
            }
         }
      }

      memo[u] = result;
      processing.delete(u);
      stack.pop();
      
      // Add step for this position
      steps.push({
        positionId: u,
        position: position,
        result: result,
        explanation: explanation,
        childResults: childResults,
        winningPositions: { ...memo }
      });
    }
  }
  
  return steps;
}

/**
 * Component for visualizing the step-by-step winning strategy analysis for a combinatorial game.
 * Allows users to navigate through the analysis process (step forward/backward).
 * 
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.graph - The game graph to analyze
 */
export function StepByStepGame({ graph }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (graph) {
      const generatedSteps = computeWinningStrategySteps(graph);
      setSteps(generatedSteps);
      setCurrentStep(0);
    }
  }, [graph]);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToFirstStep = () => {
    setCurrentStep(0);
  };

  const goToLastStep = () => {
    setCurrentStep(steps.length - 1);
  };

  // Get optimal moves up to current step
  const optimalMoves = useMemo(() => {
    if (!steps[currentStep]) return new Set();
    
    const winningPositions = steps[currentStep].winningPositions;
    const optimalEdges = new Set();
    
    for (const posId in graph.positions) {
      const position = graph.positions[posId];
      
      if (winningPositions[posId]) {
        for (const childId of position.children || []) {
          if (winningPositions[childId]) {
            optimalEdges.add(`${posId}-${childId}`);
          }
        }
      }
    }
    
    return optimalEdges;
  }, [currentStep, steps, graph.positions]);

  // Get winning player map for current step
  const winningPlayerMap = useMemo(() => {
    if (!steps[currentStep]) return {};
    
    const winningPositions = steps[currentStep].winningPositions;
    const map = {};
    
    for (const [nodeId, p1Wins] of Object.entries(winningPositions)) {
      map[nodeId] = p1Wins ? 1 : 2;
    }
    
    return map;
  }, [currentStep, steps]);

  return (
    <div className="step-by-step-container px-4 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
      <h2 className="text-center mb-3" style={{ flexShrink: 0 }}>Postupná analýza výherní strategie</h2> 
      {steps.length > 0 ? (
        <>
          <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflow: 'auto' }}>
            <DisplayGraph 
              graph={graph} 
              optimalMoves={optimalMoves}
              highlightedNode={steps[currentStep]?.positionId}
              winningPlayerMap={winningPlayerMap}
            />
          </div>
          
          <div className='step-controls-info container-fluid mt-3' style={{ flexShrink: 0 }}>
          <div className='row align-items-center'>
            <div className='step-info col-md-7'>
              <div className="card p-3 bg-light" style={{ minHeight: '140px' }}>
                <p className="mb-1"><strong>Hráč na tahu:</strong> Hráč {steps[currentStep].position.player}</p>
                {Object.keys(steps[currentStep].childResults).length > 0 && (
                  <p className="mb-1">
                    <strong>Výsledky potomků:</strong>{' '}
                    {Object.entries(steps[currentStep].childResults).map(([childId, result]) => 
                      `${childId}: ${result ? 'Výhra H1' : 'Prohra H1'}`
                    ).join(', ')}
                  </p>
                )}
                <p className="mb-1"><strong>Vysvětlení:</strong> {steps[currentStep].explanation}</p>
                <p className="mb-0">
                  <strong>Výsledek pro H1:</strong>{' '}
                  <span className={steps[currentStep].result ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {steps[currentStep].result ? 'Výherní pozice' : 'Prohrávající pozice'}
                  </span>
                </p>
              </div>
            </div>
            <div className='step-controls col-md-5 d-flex flex-column align-items-center justify-content-center'>
              <p className="text-center mb-2">Krok {currentStep + 1} z {steps.length}</p>
              <div className="d-flex gap-2">
                <button className='btn btn-secondary btn-sm' onClick={goToFirstStep} disabled={currentStep === 0}>
                  &#x23EE; Začátek
                </button>
                <button className='btn btn-secondary' onClick={goToPreviousStep} disabled={currentStep === 0}>
                  &larr; Předchozí
                </button>
                <button className='btn btn-primary' onClick={goToNextStep} disabled={currentStep === steps.length - 1}>
                  Další &rarr;
                </button>
                <button className='btn btn-primary btn-sm' onClick={goToLastStep} disabled={currentStep === steps.length - 1}>
                  Konec &#x23ED;
                </button>
              </div>
            </div>
          </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info text-center">
            Žádné kroky analýzy pro zobrazení. Graf možná není kompletní.
        </div>
      )}
    </div>
  );  
}

StepByStepGame.propTypes = {
  graph: PropTypes.shape({
    positions: PropTypes.object.isRequired,
    startingPosition: PropTypes.object.isRequired
  }).isRequired
};
