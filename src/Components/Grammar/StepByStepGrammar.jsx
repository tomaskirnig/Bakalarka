import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { generateGrammarSteps } from './Utils/GrammarStepEvaluator';

/**
 * Visualizes productive-symbol analysis of a grammar step by step.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Step-by-step analysis view.
 */
export function StepByStepGrammar({ grammar }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const currentRuleRef = useRef(null);
  const activeStep = steps[currentStep];

  useEffect(() => {
    if (grammar) {
      const generatedSteps = generateGrammarSteps(grammar);
      setSteps(generatedSteps);
      setCurrentStep(0);
    }
  }, [grammar]);

  useEffect(() => {
    if (currentRuleRef.current) {
      currentRuleRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep, steps]);

  // Keep step index valid when steps change.
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

  // Navigation functions
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToFirstStep = useCallback(() => setCurrentStep(0), []);

  const goToLastStep = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length]);

  // Prepare rules for display.
  const rules = useMemo(() => {
    if (!grammar) return [];

    return Array.isArray(grammar.productions)
      ? grammar.productions
      : Object.entries(grammar.productions || {}).flatMap(([left, rights]) =>
          rights.map((right) => ({ left, right }))
        );
  }, [grammar]);

  const allNonTerminals = useMemo(() => {
    if (!grammar) return [];

    return Array.isArray(grammar.nonTerminals)
      ? grammar.nonTerminals
      : [...new Set(rules.map((rule) => rule.left))];
  }, [grammar, rules]);

  if (!grammar || steps.length === 0 || !activeStep) {
    return <div className="alert alert-info text-center">Žádné kroky analýzy pro zobrazení.</div>;
  }

  const productiveSet = new Set(activeStep.productive);

  return (
    <div
      className="step-by-step-container d-flex flex-column"
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <h2 className="text-center mb-3" style={{ flexShrink: 0 }}>
        Krokové vyhodnocení
      </h2>
      <>
        {/* Grammar Rules Visualization */}
        <div className="card mb-3 flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
          <div className="card-header bg-light">
            <h6 className="mb-0 text-muted">Pravidla gramatiky</h6>
          </div>
          <div className="card-body px-4 flex-grow-1 overflow-auto">
            <div className="grammar-rules-list">
              {rules.map((rule, idx) => {
                const ruleStr = `${rule.left} → ${rule.right.length === 0 ? 'ε' : rule.right.join(' ')}`;
                const isCurrent = activeStep.currentRule === ruleStr;
                const isLeftProductive = productiveSet.has(rule.left);

                return (
                  <div
                    key={idx}
                    ref={isCurrent ? currentRuleRef : null}
                    className={`p-2 mb-1 rounded step-rule-item ${isCurrent ? 'step-rule-current' : 'bg-light'}`}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <code className="text-dark" style={{ fontSize: '1.1em' }}>
                        {ruleStr}
                      </code>
                      {isLeftProductive && (
                        <span className="badge bg-success ms-2">Produktivní</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Info and Controls */}
        <div className="step-controls-info container-fluid mt-3" style={{ flexShrink: 0 }}>
          <div className="row align-items-center">
            <div className="step-info col-md-7">
              <div
                className={`card p-3 ${activeStep.type === 'FINISHED' ? 'bg-warning bg-opacity-25' : 'bg-light'}`}
              >
                <p className="mb-2">
                  <strong>Množina produktivních symbolů (P):</strong>
                </p>
                <div className="mb-3">
                  {allNonTerminals.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {allNonTerminals.map((sym) => (
                        <span
                          key={sym}
                          className={`badge rounded-1 ${productiveSet.has(sym) ? 'bg-success' : 'bg-light text-dark border'}`}
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted fst-italic">Prázdná množina</span>
                  )}
                </div>
                <p className="mb-0">
                  <strong>Vysvětlení:</strong> {activeStep.description}
                </p>
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
    </div>
  );
}

StepByStepGrammar.propTypes = {
  grammar: PropTypes.object,
};
