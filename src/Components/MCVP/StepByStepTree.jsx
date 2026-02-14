import { useState } from 'react';
import PropTypes from 'prop-types';
import { TreeRenderCanvas } from './TreeRenderCanvas';

/**
 * Component for visualizing the step-by-step evaluation of an MCVP tree.
 * Allows users to navigate through the evaluation process (step forward/backward).
 * 
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.tree - The MCVP tree to evaluate
 * @param {Array} props.steps - Pre-calculated evaluation steps
 */
export function StepByStepTree({ tree, steps = [] }) {
  const [currentStep, setCurrentStep] = useState(0);

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

  const goToFirstStep = () => setCurrentStep(0);
  const goToLastStep = () => setCurrentStep(steps.length - 1);

  return (
    <div className="step-by-step-container px-4 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
      <h2 className="text-center mb-3" style={{ flexShrink: 0 }}>Postupné vyhodnocení</h2> 
      {steps.length > 0 ? (
        <>
          <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflow: 'auto' }}>
            <TreeRenderCanvas 
              tree={tree}
              activeNode={steps[currentStep]?.node}
              completedSteps={steps.slice(0, currentStep + 1)}
            />
          </div>
          
          <div className='step-controls-info container-fluid mt-3' style={{ flexShrink: 0 }}>
          <div className='row align-items-center'>
            <div className='step-info col-md-7'>
              <div className="card p-3 bg-light">
                <p className="mb-1"><strong>Vyhodnocovaný uzel:</strong> {getCurrentNodeValue()}</p>
                <p className="mb-1"><strong>Hodnoty potomků:</strong> {steps[currentStep].childValues.join(', ')}</p>
                <p className="mb-0"><strong>Výsledek:</strong> {String(steps[currentStep].result)}</p>
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
  }),
  steps: PropTypes.arrayOf(PropTypes.shape({
    node: PropTypes.object,
    childValues: PropTypes.array,
    result: PropTypes.number
  }))
};
