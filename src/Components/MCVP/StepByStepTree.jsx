import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { evaluateTreeWithSteps } from './Utils/EvaluateTree';
import { TreeCanvas } from './TreeRenderCanvas';

/**
 * Component for visualizing the step-by-step evaluation of an MCVP tree.
 * Allows users to navigate through the evaluation process (step forward/backward).
 * 
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.tree - The MCVP tree to evaluate
 */
export function StepByStepTree({ tree }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (tree) {
      const { steps: generatedSteps } = evaluateTreeWithSteps(tree);
      setSteps(generatedSteps);
      setCurrentStep(0);
    }
  }, [tree]);

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

  const getCurrentNodeValue = () => {
    if (!steps[currentStep]) return '';
    const val = steps[currentStep].node.value;
    if (val === 'A' || val === 'AND' || val === '∧') return 'AND';
    if (val === 'O' || val === 'OR' || val === '∨') return 'OR';
    return val;
  };

  return (
    <div className="step-by-step-container">
      <h2 className="text-center mb-3">Postupné vyhodnocení</h2> 
      {steps.length > 0 ? (
        <>
          <p className="text-center">Krok {currentStep + 1} z {steps.length}</p>
          
          <TreeCanvas 
            tree={tree}
            activeNode={steps[currentStep]?.node}
            completedSteps={steps.slice(0, currentStep + 1)}
          />
          
          <div className='step-controls-info row align-items-center mt-3'>
            <div className='step-info col-md-7'>
              <div className="card p-3 bg-light">
                <p className="mb-1"><strong>Vyhodnocovaný uzel:</strong> {getCurrentNodeValue()}</p>
                <p className="mb-1"><strong>Hodnoty potomků:</strong> {steps[currentStep].childValues.join(', ')}</p>
                <p className="mb-0"><strong>Výsledek:</strong> {String(steps[currentStep].result)}</p>
              </div>
            </div>
            <div className='step-controls col-md-5 d-flex justify-content-center'>
              <button className='btn btn-secondary mx-1' onClick={goToPreviousStep} disabled={currentStep === 0}>
                &larr; Předchozí
              </button>
              <button className='btn btn-primary mx-1' onClick={goToNextStep} disabled={currentStep === steps.length - 1}>
                Další &rarr;
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info text-center">
            Žádné kroky vyhodnocení pro zobrazení. Strom možná není kompletní nebo neobsahuje logické operace.
        </div>
      )}
    </div>
  );  
}

StepByStepTree.propTypes = {
  tree: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    value: PropTypes.any,
    varValue: PropTypes.any,
    children: PropTypes.array
  })
};
