import { useState, useEffect } from 'react';
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
         explanation = 'Hráč 2 nemá žádný tah → Hráč 1 vyhrává';
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
             explanation = `Hráč 1 může vyhrát přesunem do ${winningChildren.length > 1 ? 'pozic' : 'pozice'}: ${winningChildren.join(', ')}`;
           } else {
             explanation = 'Hráč 1 nemá výherní tah (všechny následníci jsou prohrávající)';
           }
         } else {
           result = false;
           explanation = 'Hráč 1 nemá žádný tah → Hráč 1 prohrává';
         }
      } else if (position.player === 2) {
         // Player 2: wins (for P1) if ALL children are winning
         if (!position.children || position.children.length === 0) {
            result = true; 
            explanation = 'Hráč 2 nemá žádný tah → Hráč 1 vyhrává';
         } else {
            const childStatuses = position.children.map(childId => {
              childResults[childId] = getResult(childId);
              return getResult(childId);
            });
            
            result = childStatuses.every(status => status);
            
            if (result) {
              explanation = 'Všechny tahy Hráče 2 vedou k výhře Hráče 1';
            } else {
              const losingChildren = position.children.filter(childId => !getResult(childId));
              explanation = `Hráč 2 může přesunout do prohrávající pozice: ${losingChildren.join(', ')}`;
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

  // Get optimal moves up to current step
  const getOptimalMovesUpToStep = () => {
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
  };

  return (
    <div className="step-by-step-container">
      <h2 className="text-center mb-3">Postupná analýza výherní strategie</h2> 
      {steps.length > 0 ? (
        <>
          <DisplayGraph 
            graph={graph} 
            optimalMoves={getOptimalMovesUpToStep()}
            highlightedNode={steps[currentStep]?.positionId}
          />
          
          <div className='step-controls-info container'>
          <div className='row align-items-center mt-3'>
            <div className='step-info col-md-7'>
              <div className="card p-3 bg-light">
                <p className="mb-1"><strong>Analyzovaná pozice:</strong> {steps[currentStep].positionId}</p>
                <p className="mb-1"><strong>Hráč na tahu:</strong> Hráč {steps[currentStep].position.player}</p>
                {Object.keys(steps[currentStep].childResults).length > 0 && (
                  <p className="mb-1">
                    <strong>Výsledky následníků:</strong>{' '}
                    {Object.entries(steps[currentStep].childResults).map(([childId, result]) => 
                      `${childId}: ${result ? 'Výhra P1' : 'Prohra P1'}`
                    ).join(', ')}
                  </p>
                )}
                <p className="mb-1"><strong>Vysvětlení:</strong> {steps[currentStep].explanation}</p>
                <p className="mb-0">
                  <strong>Výsledek pro P1:</strong>{' '}
                  <span className={steps[currentStep].result ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {steps[currentStep].result ? 'Výherní pozice' : 'Prohrávající pozice'}
                  </span>
                </p>
              </div>
            </div>
            <div className='step-controls col-md-5 d-flex flex-column align-items-center justify-content-center'>
              <p className="text-center mb-2">Krok {currentStep + 1} z {steps.length}</p>
              <div>
                <button className='btn btn-secondary mx-1' onClick={goToPreviousStep} disabled={currentStep === 0}>
                  &larr; Předchozí
                </button>
                <button className='btn btn-primary mx-1' onClick={goToNextStep} disabled={currentStep === steps.length - 1}>
                  Další &rarr;
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
