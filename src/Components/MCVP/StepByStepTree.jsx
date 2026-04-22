import { useState, useEffect, useMemo, useCallback } from 'react';
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
export function StepByStepTree({
  tree,
  steps = [],
  useTopDownLayout = true,
  lockNodeAfterDrag = true,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fitTrigger, setFitTrigger] = useState(0);
  const currentStepData = steps[currentStep];

  // Keep step index valid when data changes.
  useEffect(() => {
    if (steps.length === 0) {
      if (currentStep !== 0) {
        setCurrentStep(0);
      }
      return;
    }

    if (currentStep > steps.length - 1) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length, currentStep]);

  // Trigger initial zoom-to-fit when explanation modal opens or data changes.
  useEffect(() => {
    if (steps.length > 0) {
      setFitTrigger((prev) => prev + 1);
    }
  }, [tree, steps.length]);

  // Trigger zoom-to-fit when reaching the final step
  useEffect(() => {
    if (currentStepData?.type === 'FINAL') {
      setFitTrigger((prev) => prev + 1);
    }
  }, [currentStepData]);

  // Navigation functions
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const getCurrentNodeValue = () => {
    if (!currentStepData) return '';
    if (currentStepData.type === 'FINAL') return 'Výstupní hradlo';
    const val = currentStepData.node.value;
    if (val === 'A' || val === 'AND' || val === '∧') return 'AND';
    if (val === 'O' || val === 'OR' || val === '∨') return 'OR';
    return val;
  };

  const goToFirstStep = useCallback(() => setCurrentStep(0), []);
  const goToLastStep = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length]);

  const completedSteps = useMemo(() => steps.slice(0, currentStep + 1), [steps, currentStep]);

  return (
    <div
      className="step-by-step-container d-flex flex-column"
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <h2 className="text-center mb-3" style={{ flexShrink: 0 }}>
        Postupné vyhodnocení
      </h2>
      {steps.length > 0 ? (
        <>
          <div
            className="flex-grow-1 d-flex flex-column"
            style={{ minHeight: 0, overflow: 'auto' }}
          >
            <TreeRenderCanvas
              tree={tree}
              activeNode={currentStepData?.node}
              completedSteps={completedSteps}
              fitTrigger={fitTrigger}
              disableAutoCenter={currentStepData?.type === 'FINAL'}
              useTopDownLayout={useTopDownLayout}
              defaultLocked={true}
              lockOnFirstTick={true}
              lockNodeAfterDrag={lockNodeAfterDrag}
            />
          </div>

          <div className="step-controls-info container-fluid mt-3" style={{ flexShrink: 0 }}>
            <div className="row align-items-center">
              <div className="step-info col-md-7">
                <div
                  className="card p-3"
                  style={{
                    minHeight: '140px',
                    backgroundColor:
                      currentStepData?.type === 'FINAL' ? 'rgba(255, 255, 0, 0.2)' : undefined,
                  }}
                >
                  {currentStepData?.type === 'FINAL' ? (
                    <>
                      <p className="mb-1">
                        <strong>Typ:</strong> Výsledek vyhodnocení
                      </p>
                      <p className="mb-1">
                        <strong>Výstupní hodnota obvodu:</strong> {String(currentStepData.result)}
                      </p>
                      <p className="mb-0">
                        <strong>Vysvětlení:</strong> {currentStepData.explanation}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mb-1">
                        <strong>Vyhodnocovaný uzel:</strong> {getCurrentNodeValue()}
                      </p>
                      <p className="mb-1">
                        <strong>Hodnoty potomků:</strong> {currentStepData.childValues.join(', ')}
                      </p>
                      <p className="mb-0">
                        <strong>Výsledek:</strong> {String(currentStepData.result)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="step-controls col-md-5 d-flex flex-column align-items-center justify-content-center">
                <p className="text-center mb-2">
                  Krok {currentStep + 1} z {steps.length}
                </p>
                <div className="step-button-group d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={goToFirstStep}
                    disabled={currentStep === 0}
                  >
                    <i className="bi bi-skip-start-fill"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 0}
                  >
                    <i className="bi bi-chevron-left"></i> Předchozí
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={goToNextStep}
                    disabled={currentStep === steps.length - 1}
                  >
                    Další <i className="bi bi-chevron-right"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={goToLastStep}
                    disabled={currentStep === steps.length - 1}
                  >
                    <i className="bi bi-skip-end-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info text-center">
          Žádné kroky vyhodnocení pro zobrazení. Strom možná není kompletní nebo neobsahuje logické
          operace.
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
    children: PropTypes.array,
  }),
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      node: PropTypes.object,
      childValues: PropTypes.array,
      result: PropTypes.number,
    })
  ),
  useTopDownLayout: PropTypes.bool,
  lockNodeAfterDrag: PropTypes.bool,
};
