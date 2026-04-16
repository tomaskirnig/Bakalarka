import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { generateGrammar } from '../Utils/GrammarGenerator';

const SOFT_COMPLEXITY_LIMIT = 240;
const HARD_COMPLEXITY_LIMIT = 420;
const MAX_PRODUCTIONS_INPUT = 8;

/**
 * Form for random grammar generation with basic and advanced options.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Grammar generator UI.
 */
export function GenerateInput({ onGrammar }) {
  // Basic parameters
  const [numTerminals, setNumTerminals] = useState(2);
  const [numNonTerminals, setNumNonTerminals] = useState(3);
  const [maxRuleLength, setMaxRuleLength] = useState(3);

  // Advanced options
  const [allowLeftRecursion, setAllowLeftRecursion] = useState(true);
  const [allowRightRecursion, setAllowRightRecursion] = useState(true);
  const [epsilonMode, setEpsilonMode] = useState('random');
  const [minProductions, setMinProductions] = useState(1);
  const [maxProductions, setMaxProductions] = useState(3);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const estimateComplexity = () => {
    const estimatedRules = Number(numNonTerminals || 1) * Number(maxProductions || 1);
    const estimatedSymbolSlots = estimatedRules * Number(maxRuleLength || 1);
    const recursionMultiplier = (allowLeftRecursion ? 1.25 : 1) * (allowRightRecursion ? 1.25 : 1);
    const estimatedComplexity = Math.round(estimatedSymbolSlots * recursionMultiplier);

    return {
      estimatedRules,
      estimatedSymbolSlots,
      recursionMultiplier,
      estimatedComplexity,
    };
  };

  const handleIntChange = (setter, min, max) => (e) => {
    const val = e.target.value;
    // Allow empty string temporarily for editing
    if (val === '') {
      setter('');
      return;
    }

    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num)) return;

    // Strict clamping
    if (num > max) {
      setter(max);
    } else if (num < min) {
      // If user types '0' or negative, force to min immediately
      setter(min);
    } else {
      setter(num);
    }
  };

  // Ensure valid value on blur (if user left it empty)
  const handleBlur = (setter, val, min) => () => {
    if (val === '' || val < min) {
      setter(min);
    }
  };

  // Handler for generating the grammar when the button is clicked
  const handleGenerateGrammar = () => {
    const complexity = estimateComplexity();
    const { estimatedComplexity } = complexity;

    console.debug('[GrammarGenerator] Complexity estimate', {
      ...complexity,
      currentInputs: {
        numTerminals,
        numNonTerminals,
        maxRuleLength,
        minProductions,
        maxProductions,
        allowLeftRecursion,
        allowRightRecursion,
        epsilonMode,
      },
    });

    if (estimatedComplexity >= HARD_COMPLEXITY_LIMIT) {
      toast.error(
        'Tahle kombinace je pro generování příliš náročná. Zkuste snížit počet pravidel nebo vypnout část rekurze.'
      );
      return;
    }

    if (estimatedComplexity >= SOFT_COMPLEXITY_LIMIT) {
      toast.warn(
        'Tato konfigurace může být pomalejší. Pokud by se stránka zpomalovala, upravte parametry.'
      );
    }

    // Create config object based on form inputs
    // Ensure values are numbers (in case of temporary empty string state)
    const config = {
      nonTerminalCount: Number(numNonTerminals) || 1,
      terminalCount: Number(numTerminals) || 1,
      maxRuleLength: Number(maxRuleLength) || 1,
      minProductionsPerNonTerminal: Number(minProductions) || 1,
      maxProductionsPerNonTerminal: Number(maxProductions) || 1,
      allowLeftRecursion,
      allowRightRecursion,
      epsilonMode,
    };

    try {
      // Generate the grammar and pass it to the parent component
      const generatedGrammar = generateGrammar(config);

      // Pass the grammar to the parent component
      onGrammar(generatedGrammar);
    } catch (error) {
      console.error('[GrammarGenerator] Generation failed', { error, config });
      toast.error('Generování se nepodařilo. Zkontrolujte parametry a zkuste to prosím znovu.');
    }
  };

  return (
    <div className="inputWindow">
      <h3>Generátor gramatiky</h3>

      {/* Basic parameters */}
      <div className="row">
        <div className="col-md-6">
          <label htmlFor="numTerminals">Počet terminálů:</label>
          <input
            id="numTerminals"
            className="form-control"
            type="number"
            min="1"
            max="10"
            value={numTerminals}
            onChange={handleIntChange(setNumTerminals, 1, 10)}
            onBlur={handleBlur(setNumTerminals, numTerminals, 1)}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="numNonTerminals">Počet neterminálů:</label>
          <input
            id="numNonTerminals"
            className="form-control"
            type="number"
            min="1"
            max="10"
            value={numNonTerminals}
            onChange={handleIntChange(setNumNonTerminals, 1, 10)}
            onBlur={handleBlur(setNumNonTerminals, numNonTerminals, 1)}
          />
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-md-6">
          <label htmlFor="maxRuleLength">Max. délka pravé strany:</label>
          <input
            id="maxRuleLength"
            className="form-control"
            type="number"
            min="1"
            max="5"
            value={maxRuleLength}
            onChange={handleIntChange(setMaxRuleLength, 1, 5)}
            onBlur={handleBlur(setMaxRuleLength, maxRuleLength, 1)}
          />
        </div>
      </div>

      {/* Toggle for advanced options */}
      <div className="mt-3">
        <button
          type="button"
          className="btn btn-outline-light"
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced ? 'Skrýt pokročilé možnosti' : 'Zobrazit pokročilé možnosti'}
        </button>
      </div>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="advanced-options-container">
          <h6 className="advanced-options-title">Pokročilé možnosti</h6>

          {/* Rules per nonterminal */}
          <div className="mb-4">
            <label className="advanced-options-label">Počet pravých stran na neterminál</label>
            <div className="row">
              <div className="col-6">
                <label htmlFor="minProductions" className="form-label text-white-50 small">
                  Min:
                </label>
                <input
                  id="minProductions"
                  className="form-control"
                  type="number"
                  min="1"
                  max={MAX_PRODUCTIONS_INPUT}
                  value={minProductions}
                  onChange={handleIntChange(setMinProductions, 1, MAX_PRODUCTIONS_INPUT)}
                  onBlur={handleBlur(setMinProductions, minProductions, 1)}
                />
              </div>
              <div className="col-6">
                <label htmlFor="maxProductions" className="form-label text-white-50 small">
                  Max:
                </label>
                <input
                  id="maxProductions"
                  className="form-control"
                  type="number"
                  min={minProductions}
                  max={MAX_PRODUCTIONS_INPUT}
                  value={maxProductions}
                  onChange={handleIntChange(
                    setMaxProductions,
                    minProductions,
                    MAX_PRODUCTIONS_INPUT
                  )}
                  onBlur={handleBlur(setMaxProductions, maxProductions, minProductions)}
                />
              </div>
            </div>
          </div>

          {/* Recursion Options */}
          <div className="mb-4">
            <label className="advanced-options-label">Rekurze</label>
            <div className="d-flex gap-4 justify-content-center">
              <div className="form-check form-switch p-0">
                <input
                  className="form-check-input clickable"
                  type="checkbox"
                  role="switch"
                  id="leftRecursion"
                  checked={allowLeftRecursion}
                  onChange={(e) => setAllowLeftRecursion(e.target.checked)}
                />
                <label className="form-check-label clickable" htmlFor="leftRecursion">
                  Levá
                </label>
              </div>

              <div className="form-check form-switch p-0">
                <input
                  className="form-check-input clickable"
                  type="checkbox"
                  role="switch"
                  id="rightRecursion"
                  checked={allowRightRecursion}
                  onChange={(e) => setAllowRightRecursion(e.target.checked)}
                />
                <label className="form-check-label clickable" htmlFor="rightRecursion">
                  Pravá
                </label>
              </div>
            </div>
          </div>

          {/* Epsilon Options */}
          <div>
            <label className="advanced-options-label">Generovat epsilon (ε)</label>
            <div className="btn-group d-flex" role="group">
              <input
                type="radio"
                className="btn-check"
                id="epsilonNever"
                name="epsilonMode"
                value="never"
                checked={epsilonMode === 'never'}
                onChange={(e) => setEpsilonMode(e.target.value)}
                autoComplete="off"
              />
              <label className="btn btn-outline-info clickable" htmlFor="epsilonNever">
                Ne
              </label>

              <input
                type="radio"
                className="btn-check"
                id="epsilonRandom"
                name="epsilonMode"
                value="random"
                checked={epsilonMode === 'random'}
                onChange={(e) => setEpsilonMode(e.target.value)}
                autoComplete="off"
              />
              <label className="btn btn-outline-info clickable" htmlFor="epsilonRandom">
                Náhodně
              </label>

              <input
                type="radio"
                className="btn-check"
                id="epsilonAlways"
                name="epsilonMode"
                value="always"
                checked={epsilonMode === 'always'}
                onChange={(e) => setEpsilonMode(e.target.value)}
                autoComplete="off"
              />
              <label className="btn btn-outline-info clickable" htmlFor="epsilonAlways">
                Vždy
              </label>
            </div>
          </div>
        </div>
      )}

      <button type="button" className="btn btn-primary mt-3" onClick={handleGenerateGrammar}>
        Generovat gramatiku
      </button>
    </div>
  );
}

GenerateInput.propTypes = {
  onGrammar: PropTypes.func.isRequired,
};
