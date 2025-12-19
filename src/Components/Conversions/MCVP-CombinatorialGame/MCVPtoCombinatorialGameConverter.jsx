import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { MCVPToGameStepGenerator } from './ConversionCombinatorialGame';
import { DisplayGraph } from '../../CombinatorialGame/Utils/DisplayGraph';
import { TreeCanvas } from '../../MCVP/TreeRenderCanvas';

export default function MCVPtoCombinatorialGameConverter({ mcvpTree, onNavigate }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [cgDimensions, setCgDimensions] = useState({ width: 400, height: 400 });
    const [mcvpDimensions, setMcvpDimensions] = useState({ width: 400, height: 400 });
    const cgContainerRef = useRef(null);
    const mcvpContainerRef = useRef(null);

    const steps = useMemo(() => {
        if (!mcvpTree) return [];
        const generator = new MCVPToGameStepGenerator(mcvpTree);
        return generator.generate();
    }, [mcvpTree]);

    useEffect(() => {
        setCurrentStep(0);
    }, [mcvpTree]);

    // Resize observer for CG graph
    useEffect(() => {
        if (!cgContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setCgDimensions({ width, height });
            }
        });
        resizeObserver.observe(cgContainerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Resize observer for MCVP graph
    useEffect(() => {
        if (!mcvpContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setMcvpDimensions({ width, height });
            }
        });
        resizeObserver.observe(mcvpContainerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const finalGraph = useMemo(() => {
        return steps.length > 0 ? steps[steps.length - 1].graph : null;
    }, [steps]);

    const goToNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleRedirect = () => {
        if (onNavigate && finalGraph) {
            onNavigate('CombinatorialGame', finalGraph);
        }
    };

    const renderCurrentStep = () => {
        if (!steps.length) return <p>Žádné kroky konverze.</p>;
        const step = steps[currentStep];

        return (
            <div className="conversion-step h-100 d-flex flex-column">
                <h3 className="text-center">Krok {currentStep + 1} z {steps.length}</h3>
                <p className="description text-center" style={{ minHeight: '3em' }}>{step.description}</p>
                
                <div className="row flex-grow-1" style={{ minHeight: '0' }}>
                    <div className="col-md-6 d-flex flex-column">
                        <h4 className='text-center'>MCVP</h4>
                        <div 
                            ref={mcvpContainerRef}
                            className="flex-grow-1" 
                            style={{ border: '1px solid var(--color-grey-light)', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
                        >
                            <TreeCanvas 
                                tree={mcvpTree} 
                                highlightedNode={step.highlightNode}
                                activeNode={step.highlightNode}
                                completedSteps={[]}
                                width={mcvpDimensions.width}
                                height={mcvpDimensions.height}
                                fitToScreen={currentStep === steps.length - 1}
                            />
                        </div>
                    </div>
                    <div className="col-md-6 d-flex flex-column">
                        <h4 className='text-center'>Kombinatorická hra</h4>
                        <div 
                            ref={cgContainerRef}
                            className="flex-grow-1" 
                            style={{ border: '1px solid var(--color-grey-light)', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
                        >
                            {step.graph && step.graph.positions && Object.keys(step.graph.positions).length > 0 ? (
                                <DisplayGraph 
                                    graph={step.graph} 
                                    width={cgDimensions.width} 
                                    height={cgDimensions.height}
                                    fitToScreen={currentStep === steps.length - 1}
                                />
                            ) : (
                                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                                    Prázdný graf
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="visual-note mt-3 text-center fw-bold" style={{ minHeight: '1.5em' }}>
                    {step.visualNote}
                </div>
            </div>
        );
    };

    return (
        <div className="p-3 d-flex flex-column h-100">
            <h2 className="text-center mb-3">MCVP {String.fromCharCode(8594)} Kombinatorická hra</h2>
            
            <div className="alert alert-info py-2 mb-3">
                <strong>Pravidla převodu:</strong>
                <ul className="mb-0 list-inline d-inline-block ms-2">
                    <li className="list-inline-item"><strong>OR</strong> &rarr; Hráč 1 (volí)</li>
                    <li className="list-inline-item"><strong>AND</strong> &rarr; Hráč 2 (volí)</li>
                    <li className="list-inline-item"><strong>1</strong> &rarr; Hráč 2 (prohrává)</li>
                    <li className="list-inline-item"><strong>0</strong> &rarr; Hráč 1 (prohrává)</li>
                </ul>
            </div>

            <div className="flex-grow-1" style={{ minHeight: '400px' }}>
                {renderCurrentStep()}
            </div>

            <div className="navigation-controls mt-3 d-flex justify-content-center gap-2">
                <button className="btn btn-secondary" onClick={goToPreviousStep} disabled={currentStep === 0}>
                    Předchozí
                </button>
                <button className="btn btn-primary" onClick={goToNextStep} disabled={currentStep === steps.length - 1}>
                    Další
                </button>
            </div>

            {finalGraph && (
                <div className="d-flex justify-content-center flex-column align-items-center">
                    <QuickNavigationControls 
                        onGoToStart={() => setCurrentStep(0)}
                        onGoToEnd={() => setCurrentStep(steps.length - 1)}
                    />
                    <div className="text-center mt-3">
                        <button className="btn btn-success btn-lg" onClick={handleRedirect}>
                            Otevřít v Kombinatorické hře
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

MCVPtoCombinatorialGameConverter.propTypes = {
    mcvpTree: PropTypes.object.isRequired,
    onNavigate: PropTypes.func
};

/**
 * Component for quick navigation controls
 */
function QuickNavigationControls({ onGoToStart, onGoToEnd }) {
  return (
    <div className="quick-navigation my-4 d-flex justify-content-center gap-3">
      <button 
        onClick={onGoToStart}
        className="btn btn-outline-secondary"
      >
        ⏮️ Jít na začátek
      </button>
      
      <button 
        onClick={onGoToEnd}
        className="btn btn-outline-primary"
      >
        Jít na konec ⏭️
      </button>
    </div>
  );
}

QuickNavigationControls.propTypes = {
  onGoToStart: PropTypes.func.isRequired,
  onGoToEnd: PropTypes.func.isRequired
};
