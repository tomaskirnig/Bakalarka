import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { generateGrammarSteps } from './Utils/GrammarStepEvaluator';

export function StepByStepGrammar({ grammar }) {
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (grammar) {
            const generatedSteps = generateGrammarSteps(grammar);
            setSteps(generatedSteps);
            setCurrentStep(0);
        }
    }, [grammar]);

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
    
    const goToFirstStep = () => setCurrentStep(0);
    const goToLastStep = () => setCurrentStep(steps.length - 1);

    if (!grammar || steps.length === 0) {
        return (
            <div className="alert alert-info text-center">
                Žádné kroky analýzy pro zobrazení.
            </div>
        );
    }

    const activeStep = steps[currentStep];
    const productiveSet = new Set(activeStep.productive);

    // Prepare rules for display
    const rules = Array.isArray(grammar.productions)
        ? grammar.productions
        : Object.entries(grammar.productions).flatMap(([left, rights]) =>
            rights.map(right => ({ left, right }))
        );

    return (
        <div className="step-by-step-container px-4 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
            <h2 className="text-center mb-3" style={{ flexShrink: 0 }}>Krokové vyhodnocení</h2>
            {steps.length > 0 ? (
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
                                            className={`p-2 mb-1 rounded step-rule-item ${isCurrent ? 'step-rule-current' : 'bg-light'}`}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <code className="text-dark" style={{ fontSize: '1.1em' }}>{ruleStr}</code>
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
                    <div className='step-controls-info container-fluid mt-3' style={{ flexShrink: 0 }}>
                        <div className='row align-items-center'>
                            <div className='step-info col-md-7'>
                                <div className="card p-3 bg-light">
                                    <p className="mb-2">
                                        <strong>Množina produktivních symbolů (P):</strong>
                                    </p>
                                    <div className="mb-3">
                                        {activeStep.productive.length > 0 ? (
                                            <div className="d-flex flex-wrap gap-2">
                                                {activeStep.productive.map(sym => (
                                                    <span key={sym} className="badge bg-success">{sym}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted fst-italic">Prázdná množina</span>
                                        )}
                                    </div>
                                    <p className="mb-0"><strong>Vysvětlení:</strong> {activeStep.description}</p>
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
                    Žádné kroky analýzy pro zobrazení.
                </div>
            )}
        </div>
    );
}

StepByStepGrammar.propTypes = {
    grammar: PropTypes.object
};
