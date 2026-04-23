import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GenericInputMethodSelector } from '../Common/InputSystem/GenericInputMethodSelector';
import { ManualInput } from './InputSelectionComponents/ManualInput';
import { GenerateInput } from './InputSelectionComponents/GenerateInput';
import { PreparedSetsInput } from './InputSelectionComponents/PreparedSetsInput';
import { InteractiveMCVPGraph } from './InputSelectionComponents/Interactive/InteractiveInput';
import { TreeRenderCanvas } from './TreeRenderCanvas';
import { evaluateCircuitWithSteps } from './Utils/EvaluateCircuit';
import { ConversionModal } from '../Common/ConversionModal';
import { StepByStepTree } from './StepByStepTree';
import MCVPtoGrammarConverter, {
  MCVPToGrammarStepBuilder,
} from '../Conversions/MCVP-Grammar/MCVPtoGrammarConverter';
import MCVPtoCombinatorialGameConverter from '../Conversions/MCVP-CombinatorialGame/MCVPtoCombinatorialGameConverter';
import { MCVPToGameStepGenerator } from '../Conversions/MCVP-CombinatorialGame/ConversionCombinatorialGame';
import { InfoButton } from '../Common/InfoButton';
import { FileTransferControls } from '../Common/FileTransferControls';
import { treeToFlatGraph, flatGraphToTree } from './Utils/Serialization';
import { toast } from 'react-toastify';

const INPUT_OPTIONS = [
  { value: 'manual', label: 'Manuálně' },
  { value: 'generate', label: 'Generovat' },
  { value: 'sets', label: 'Načíst ze sady' },
  { value: 'interactive', label: 'Interaktivně' },
];

const INVALID_TREE_CONVERSION_MESSAGE =
  'Převod je dostupný pouze pro kompletní obvod s jediným kořenem a bez volných uzlů.';

const INVALID_TREE_EXPLAIN_MESSAGE =
  'Vysvětlení je dostupné pouze pro kompletní obvod s jediným kořenem a bez volných uzlů.';

/**
 * Main component for the Monotone Circuit Value Problem (MCVP) module.
 * Coordinates input selection, graph visualization, evaluation, and problem conversions.
 *
 * @component
 * @param {Object} props - The component props
 * @param {function} [props.onNavigate] - Callback to navigate to other modules (e.g., Combinatorial Game).
 * @param {Object} [props.initialData] - Initial tree data to load (e.g., when coming from another module).
 */
export function MCVP({
  onNavigate,
  initialData,
  useTopDownLayout = true,
  autoScrollToGraph = true,
  lockNodeAfterDrag = true,
}) {
  const [tree, setTree] = useState(null); // Current tree
  const [explain, setExplain] = useState(false); // Explain modal state (open/closed)
  const [chosenOpt, setChosenOpt] = useState('manual'); // Chosen input method
  const [grammarConversion, setGrammarConversion] = useState(false); // Grammar Conversion result
  const [gameConversion, setGameConversion] = useState(false); // Game Conversion result
  const [lockImportedLayout, setLockImportedLayout] = useState(false);
  const [mainFitTrigger, setMainFitTrigger] = useState(0);
  const positionSnapshotGetterRef = useRef(null);
  const mainGraphSectionRef = useRef(null);

  // Handle initial data if provided (e.g., from reverse conversion)
  useEffect(() => {
    if (initialData) {
      // If initialData is an MCVP tree structure, set it
      // This assumes initialData structure matches what setTree expects
      setTree(initialData);
    }
  }, [initialData]);

  // Calculate evaluation with steps once - the steps are reused for step-by-step explanation
  const evaluation = useMemo(() => {
    return tree ? evaluateCircuitWithSteps(tree) : { result: null, steps: [] };
  }, [tree]);

  const gameConversionSteps = useMemo(() => {
    if (!tree) return [];
    const generator = new MCVPToGameStepGenerator(tree);
    return generator.generate();
  }, [tree]);

  const grammarConversionSteps = useMemo(() => {
    if (!tree) return [];
    const builder = new MCVPToGrammarStepBuilder(tree);
    return builder.convert();
  }, [tree]);

  const hasTree = Boolean(tree);
  const isTreeValid = hasTree && evaluation.result !== null;

  const runWhenTreeIsValid = (action, invalidMessage) => {
    if (!isTreeValid) {
      toast.error(invalidMessage);
      return;
    }

    action();
  };

  const handleOptionChange = (option) => {
    setChosenOpt(option);
    setTree(null);
    setLockImportedLayout(false);
  };

  // Refit once when a non-interactive tree is (re)loaded/generated/imported.
  useEffect(() => {
    if (!tree || chosenOpt === 'interactive') return;
    setMainFitTrigger((prev) => prev + 1);
  }, [tree, chosenOpt]);

  useEffect(() => {
    if (!autoScrollToGraph || !tree || chosenOpt === 'interactive') return;

    const frameId = requestAnimationFrame(() => {
      mainGraphSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => cancelAnimationFrame(frameId);
  }, [autoScrollToGraph, tree, chosenOpt]);

  const handleRegisterPositionSnapshotGetter = useCallback((getter) => {
    positionSnapshotGetterRef.current = typeof getter === 'function' ? getter : null;
  }, []);

  const handleExport = (includePositions = false) => {
    if (!tree) return null;

    let positionSnapshot = null;
    if (includePositions && typeof positionSnapshotGetterRef.current === 'function') {
      try {
        positionSnapshot = positionSnapshotGetterRef.current();
      } catch (error) {
        console.warn('Failed to take live position snapshot for export:', error);
      }
    }

    return treeToFlatGraph(tree, includePositions, positionSnapshot);
  };

  const handleImport = (data) => {
    let graphData = data;

    // Handle SadyMCVP format (Object with keys)
    if (!data.nodes && !data.edges && !data.links) {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        // Try to take the first set found
        const firstSet = data[keys[0]];
        if (firstSet && (firstSet.nodes || firstSet.edges || firstSet.links)) {
          graphData = firstSet;
          toast.info(`Importována sada: ${keys[0]}`);
        }
      }
    }

    const newTree = flatGraphToTree(graphData);
    if (newTree) {
      setTree(newTree);
      setChosenOpt('manual'); // Switch to view/manual mode

      const hasExplicitPositions =
        Boolean(graphData?.positions && Object.keys(graphData.positions).length > 0) ||
        Boolean(
          Array.isArray(graphData?.nodes) &&
          graphData.nodes.some((node) => typeof node?.x === 'number' && typeof node?.y === 'number')
        );

      setLockImportedLayout(hasExplicitPositions);
    } else {
      throw new Error('Nepodařilo se vytvořit strom z importovaných dat.');
    }
  };

  const handleOpenGameConversion = () => {
    runWhenTreeIsValid(() => setGameConversion(true), INVALID_TREE_CONVERSION_MESSAGE);
  };

  const handleOpenGrammarConversion = () => {
    runWhenTreeIsValid(() => setGrammarConversion(true), INVALID_TREE_CONVERSION_MESSAGE);
  };

  const handleOpenExplain = () => {
    runWhenTreeIsValid(() => setExplain(true), INVALID_TREE_EXPLAIN_MESSAGE);
  };

  return (
    <div className="div-content page-container">
      <div className="page-controls">
        <FileTransferControls
          onExport={handleExport}
          onImport={handleImport}
          instructionText="Nahrajte soubor JSON s definicí obvodu ({nodes, edges/links})."
          fileName="mcvp_circuit.json"
        />
        <InfoButton title="Monotónní obvody (MCVP)">
          <p>
            Problém hodnoty monotónního obvodu (MCVP) se zabývá vyhodnocením booleovského obvodu,
            který obsahuje pouze hradla AND a OR (bez negací).
          </p>
          <ul className="ps-3">
            <li>
              <strong>Vstupy:</strong> Logické hodnoty 0 nebo 1.
            </li>
            <li>
              <strong>Hradla:</strong> AND (logický součin) a OR (logický součet).
            </li>
            <li>
              <strong>Cíl:</strong> Určit výstupní hodnotu celého obvodu (kořenového uzlu).
            </li>
          </ul>
        </InfoButton>
      </div>

      <h1 className="display-4 mt-4 mb-lg-4">MCVP</h1>

      <div className="page-content">
        <GenericInputMethodSelector
          selectedOption={chosenOpt}
          onOptionSelect={handleOptionChange}
          options={INPUT_OPTIONS}
          renderContent={(opt) => {
            switch (opt) {
              case 'manual':
                return <ManualInput onTreeUpdate={setTree} />;
              case 'generate':
                return <GenerateInput onTreeUpdate={setTree} />;
              case 'sets':
                return <PreparedSetsInput onTreeUpdate={setTree} />;
              case 'interactive':
                return (
                  <InteractiveMCVPGraph
                    onTreeUpdate={setTree}
                    useTopDownLayout={useTopDownLayout}
                    lockNodeAfterDrag={lockNodeAfterDrag}
                    onRegisterPositionSnapshotGetter={handleRegisterPositionSnapshotGetter}
                  />
                );
              default:
                return null;
            }
          }}
        />

        {tree && chosenOpt !== 'interactive' && (
          <div
            ref={mainGraphSectionRef}
            style={{ height: '60vh', width: '100%', margin: '20px auto' }}
          >
            <TreeRenderCanvas
              tree={tree}
              highlightedNode={!useTopDownLayout && isTreeValid ? tree : null}
              useTopDownLayout={useTopDownLayout}
              fitTrigger={mainFitTrigger}
              defaultLocked={lockImportedLayout}
              lockOnFirstTick={lockImportedLayout}
              lockNodeAfterDrag={lockNodeAfterDrag}
              onRegisterPositionSnapshotGetter={handleRegisterPositionSnapshotGetter}
            />
          </div>
        )}

        {tree && (
          <div className="card mt-3 mx-auto shadow-sm" style={{ maxWidth: '600px' }}>
            <div className="card-header bg-light fw-bold text-center">Výsledek obvodu</div>
            <div className="card-body text-center">
              {evaluation.result !== null ? (
                <>
                  <div className={`alert ${evaluation.result ? 'alert-success' : 'alert-warning'}`}>
                    {`Výsledek: ${evaluation.result}`}
                  </div>
                </>
              ) : (
                <p className="text-muted">Přidejte více uzlů a propojte je pro analýzu.</p>
              )}
            </div>
          </div>
        )}

        {tree && !isTreeValid && (
          <div className="alert alert-warning mt-3 mx-auto" style={{ maxWidth: '700px' }}>
            Obvod není kompletní nebo platný. Doplňte chybějící propojení tak, aby měl právě jeden
            kořenový uzel a šel vyhodnotit.
          </div>
        )}

        {!tree && chosenOpt === 'interactive' && (
          <div className="alert alert-warning mt-3 mx-auto" style={{ maxWidth: '700px' }}>
            Graf není platný pro vyhodnocení. Upravte propojení tak, aby neobsahoval
            volné/disconnected části a měl právě jeden kořen.
          </div>
        )}

        {tree && (
          <div>
            <button
              className="btn btn-primary m-2"
              onClick={handleOpenExplain}
              disabled={!isTreeValid}
              title={
                !isTreeValid
                  ? 'Nejprve dokončete obvod (jeden kořen, bez volných uzlů).'
                  : undefined
              }
            >
              Vysvětlit
            </button>
            <button
              className="btn btn-primary mx-2"
              onClick={handleOpenGameConversion}
              disabled={!isTreeValid}
              title={
                !isTreeValid
                  ? 'Nejprve dokončete obvod (jeden kořen, bez volných uzlů).'
                  : undefined
              }
            >
              Převést na Kombinatorickou hru
            </button>
            <button
              className="btn btn-primary mx-2"
              onClick={handleOpenGrammarConversion}
              disabled={!isTreeValid}
              title={
                !isTreeValid
                  ? 'Nejprve dokončete obvod (jeden kořen, bez volných uzlů).'
                  : undefined
              }
            >
              Převést na Gramatiku
            </button>
          </div>
        )}

        {grammarConversion && (
          <ConversionModal onClose={() => setGrammarConversion(false)}>
            {tree && (
              <MCVPtoGrammarConverter
                mcvpTree={tree}
                conversionSteps={grammarConversionSteps}
                onNavigate={onNavigate}
                useTopDownLayout={useTopDownLayout}
                lockNodeAfterDrag={lockNodeAfterDrag}
              />
            )}
          </ConversionModal>
        )}

        {gameConversion && (
          <ConversionModal onClose={() => setGameConversion(false)}>
            {tree && (
              <MCVPtoCombinatorialGameConverter
                mcvpTree={tree}
                conversionSteps={gameConversionSteps}
                onNavigate={onNavigate}
                useTopDownLayout={useTopDownLayout}
                lockNodeAfterDrag={lockNodeAfterDrag}
              />
            )}
          </ConversionModal>
        )}

        {explain && (
          <ConversionModal onClose={() => setExplain(false)}>
            {tree && (
              <StepByStepTree
                tree={tree}
                steps={evaluation.steps}
                useTopDownLayout={useTopDownLayout}
                lockNodeAfterDrag={lockNodeAfterDrag}
              />
            )}
          </ConversionModal>
        )}
      </div>
    </div>
  );
}

MCVP.propTypes = {
  onNavigate: PropTypes.func,
  initialData: PropTypes.object,
  useTopDownLayout: PropTypes.bool,
  autoScrollToGraph: PropTypes.bool,
  lockNodeAfterDrag: PropTypes.bool,
};
