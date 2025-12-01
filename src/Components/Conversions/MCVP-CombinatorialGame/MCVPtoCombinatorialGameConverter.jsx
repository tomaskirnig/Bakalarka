import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MCVPToGameStepGenerator } from './ConversionCombinatorialGame';
import { DisplayGraph } from '../../CombinatorialGame/Utils/DisplayGraph';
import { TreeCanvas } from '../../MCVP/TreeRenderCanvas';

export default function MCVPtoCombinatorialGameConverter({ mcvpTree, onNavigate }) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = useMemo(() => {
        if (!mcvpTree) return [];
        const generator = new MCVPToGameStepGenerator(mcvpTree);
        return generator.generate();
    }, [mcvpTree]);

    useEffect(() => {
        setCurrentStep(0);
    }, [mcvpTree]);

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
            <div className="conversion-step">
                <h3>Krok {currentStep + 1} z {steps.length}</h3>
                <p className="description" style={{ minHeight: '3em' }}>{step.description}</p>
                
                <div className="row">
                    <div className="col-md-6">
                        <h4 className='text-center'>MCVP</h4>
                        <div style={{ height: '400px', border: '1px solid #eee' }}>
                            <TreeCanvas 
                                tree={mcvpTree} 
                                highlightedNode={step.highlightNode}
                                completedSteps={[]}
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <h4 className='text-center'>Kombinatorická hra</h4>
                        <div style={{ height: '400px', border: '1px solid #eee' }}>
                            {step.graph && step.graph.positions && Object.keys(step.graph.positions).length > 0 ? (
                                <DisplayGraph graph={step.graph} />
                            ) : (
                                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                                    Prázdný graf
                                </div>
                            )}
                        </div>
                        <div className="visual-note mt-2 text-center">
                            <em>{step.visualNote}</em>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-3">
            <h2 className="text-center mb-4">MCVP {String.fromCharCode(8594)} Kombinatorická hra</h2>
            
            <div className="alert alert-info">
                <strong>Pravidla převodu:</strong>
                <ul className="mb-0 text-start" style={{ display: 'inline-block', textAlign: 'left' }}>
                    <li><strong>OR</strong> &rarr; Hráč 1 (volí)</li>
                    <li><strong>AND</strong> &rarr; Hráč 2 (volí)</li>
                    <li><strong>1</strong> &rarr; Hráč 2 (prohrává)</li>
                    <li><strong>0</strong> &rarr; Hráč 1 (prohrává)</li>
                </ul>
            </div>

            {renderCurrentStep()}

            <div className="navigation-controls mt-4 d-flex justify-content-center gap-2">
                <button className="btn btn-secondary" onClick={goToPreviousStep} disabled={currentStep === 0}>
                    Předchozí
                </button>
                <button className="btn btn-primary" onClick={goToNextStep} disabled={currentStep === steps.length - 1}>
                    Další
                </button>
            </div>

            {finalGraph && (
                <div className="text-center mt-4">
                    <button className="btn btn-success btn-lg" onClick={handleRedirect}>
                        Otevřít v Kombinatorické hře
                    </button>
                </div>
            )}
        </div>
    );
}

MCVPtoCombinatorialGameConverter.propTypes = {
    mcvpTree: PropTypes.object.isRequired,
    onNavigate: PropTypes.func
};
