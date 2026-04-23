import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { MCVPToGameStepGenerator } from './ConversionCombinatorialGame';
import { DisplayGraph } from '../../CombinatorialGame/Utils/DisplayGraph';
import { TreeRenderCanvas } from '../../MCVP/TreeRenderCanvas';

const FIT_RESET_DELAY_MS = 150;

/**
 * Step-by-step visual converter from MCVP graphs to combinatorial game graphs.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Conversion walkthrough UI.
 */
export default function MCVPtoCombinatorialGameConverter({
  mcvpTree,
  conversionSteps = null,
  onNavigate,
  useTopDownLayout = true,
  lockNodeAfterDrag = true,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [shouldFitCG, setShouldFitCG] = useState(false);
  const [cgDimensions, setCgDimensions] = useState({ width: 400, height: 400 });
  const [mcvpDimensions, setMcvpDimensions] = useState({ width: 400, height: 400 });
  const cgContainerRef = useRef(null);
  const mcvpContainerRef = useRef(null);
  const fitTimerRef = useRef(null);

  const scheduleCgFitReset = () => {
    clearTimeout(fitTimerRef.current);
    fitTimerRef.current = setTimeout(() => setShouldFitCG(false), FIT_RESET_DELAY_MS);
  };

  useEffect(() => {
    return () => clearTimeout(fitTimerRef.current);
  }, []);

  const steps = useMemo(() => {
    if (conversionSteps) return conversionSteps;
    if (!mcvpTree) return [];
    const generator = new MCVPToGameStepGenerator(mcvpTree);
    return generator.generate();
  }, [mcvpTree, conversionSteps]);

  useEffect(() => {
    setCurrentStep(0);
    setFitTrigger((prev) => prev + 1);
  }, [mcvpTree]);

  // Trigger fit when reaching the last step
  useEffect(() => {
    if (currentStep === steps.length - 1 && steps.length > 0) {
      setShouldFitCG(true);
      setFitTrigger((prev) => prev + 1);
      scheduleCgFitReset();
    }
  }, [currentStep, steps.length]);

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
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRedirect = () => {
    if (onNavigate && finalGraph) {
      onNavigate('CombinatorialGame', finalGraph);
    }
  };

  const skipToStart = () => {
    setCurrentStep(0);
    setShouldFitCG(true);
    setFitTrigger((prev) => prev + 1);
    scheduleCgFitReset();
  };

  const skipToEnd = () => {
    setCurrentStep(steps.length - 1);
    setShouldFitCG(true);
    setFitTrigger((prev) => prev + 1);
    scheduleCgFitReset();
  };

  const renderCurrentStep = () => {
    if (!steps.length) return <p>Žádné kroky konverze.</p>;
    const step = steps[currentStep];
    const highlightedCgNodeId =
      step.highlightNode && Array.isArray(step.labels)
        ? (step.labels.find((label) => label.node === step.highlightNode)?.result ?? null)
        : null;

    return (
      <div className="conversion-step d-flex flex-column pb-2">
        <h3 className="text-center mb-1">
          Krok {currentStep + 1} z {steps.length}
        </h3>
        <p className="description text-center mb-2 small">{step.description}</p>

        <div className="row gx-2" style={{ minHeight: 0, margin: 0 }}>
          <div className="col-md-6 d-flex flex-column" style={{ minHeight: 0 }}>
            <h4 className="text-center mb-1">MCVP</h4>
            <div
              ref={mcvpContainerRef}
              className="bg-light"
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '4px',
                height: '55vh',
              }}
            >
              <TreeRenderCanvas
                tree={mcvpTree}
                highlightedNode={step.highlightNode}
                activeNode={step.highlightNode}
                completedSteps={step.labels || []}
                width={mcvpDimensions.width}
                height={mcvpDimensions.height}
                fitToScreen={false}
                fitTrigger={fitTrigger}
                disableAutoCenter={currentStep === steps.length - 1}
                useTopDownLayout={useTopDownLayout}
                defaultLocked={true}
                lockOnFirstTick={true}
                showLockControl={true}
                lockNodeAfterDrag={lockNodeAfterDrag}
              />
            </div>
          </div>
          <div className="col-md-6 d-flex flex-column" style={{ minHeight: 0 }}>
            <h4 className="text-center mb-1">Kombinatorická hra</h4>
            <div
              ref={cgContainerRef}
              className="bg-light"
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '4px',
                height: '55vh',
              }}
            >
              <DisplayGraph
                graph={step.graph}
                width={cgDimensions.width}
                height={cgDimensions.height}
                fitToScreen={shouldFitCG}
                fitTrigger={fitTrigger}
                highlightedNode={highlightedCgNodeId}
                trackHighlightedNode={currentStep !== steps.length - 1}
                defaultLocked={true}
                lockOnFirstTick={true}
                showNodeIdsAlways={true}
                showLockControl={true}
                lockNodeAfterDrag={lockNodeAfterDrag}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
      <h2 className="text-center mb-2" style={{ flexShrink: 0 }}>
        MCVP {String.fromCharCode(8594)} Kombinatorická hra
      </h2>

      <div className="alert alert-info py-2 mb-2" style={{ flexShrink: 0 }}>
        <strong>Pravidla převodu:</strong>
        <ul className="mb-0 list-inline d-inline-block ms-2">
          <li className="list-inline-item">
            <strong>OR</strong> &rarr; Hráč 1,
          </li>
          <li className="list-inline-item">
            <strong>AND</strong> &rarr; Hráč 2
          </li>
          <li className="list-inline-item">
            <strong>|</strong>
          </li>
          <li className="list-inline-item">
            <strong>1</strong> &rarr; Hráč 2,
          </li>
          <li className="list-inline-item">
            <strong>0</strong> &rarr; Hráč 1
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflow: 'hidden' }}>
        {renderCurrentStep()}
      </div>

      <div className="mt-2" style={{ flexShrink: 0 }}>
        <div className="step-button-group d-flex justify-content-center gap-2 mb-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={skipToStart}
            disabled={currentStep === 0}
            aria-label="Přeskočit na začátek"
          >
            <i className="bi bi-skip-start-fill"></i>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            aria-label="Předchozí krok"
          >
            <i className="bi bi-chevron-left"></i> Předchozí
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={goToNextStep}
            disabled={steps.length === 0 || currentStep === steps.length - 1}
            aria-label="Další krok"
          >
            Další <i className="bi bi-chevron-right"></i>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={skipToEnd}
            disabled={steps.length === 0 || currentStep === steps.length - 1}
            aria-label="Přeskočit na konec"
          >
            <i className="bi bi-skip-end-fill"></i>
          </button>
        </div>

        {finalGraph && (
          <div className="d-flex justify-content-center">
            <button type="button" className="btn btn-success" onClick={handleRedirect}>
              Otevřít v Kombinatorické hře
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

MCVPtoCombinatorialGameConverter.propTypes = {
  mcvpTree: PropTypes.object.isRequired,
  conversionSteps: PropTypes.array,
  onNavigate: PropTypes.func,
  useTopDownLayout: PropTypes.bool,
  lockNodeAfterDrag: PropTypes.bool,
};
