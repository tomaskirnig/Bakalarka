import PropTypes from 'prop-types';
import { Grammar } from '../Utils/Grammar';

// Load all JSON files from the Sady/Grammar directory
const modules = import.meta.glob('../../../../Sady/Grammar/*.json', { eager: true });
const PREPARED_GRAMMAR_SETS = Object.entries(modules)
  .map(([path, mod]) => {
    const data = mod.default || mod;
    // Validation
    if (!data || typeof data !== 'object') {
      console.warn(`Skipping invalid grammar file (not an object): ${path}`);
      return null;
    }
    if (!data.name) {
      console.warn(`Skipping invalid grammar file (missing name): ${path}`);
      return null;
    }
    if (!Array.isArray(data.nonTerminals)) {
      console.warn(`Skipping invalid grammar file (missing nonTerminals): ${path}`);
      return null;
    }
    if (!Array.isArray(data.terminals)) {
      console.warn(`Skipping invalid grammar file (missing terminals): ${path}`);
      return null;
    }
    if (!data.productions || typeof data.productions !== 'object') {
      console.warn(`Skipping invalid grammar file (missing productions): ${path}`);
      return null;
    }
    return data;
  })
  .filter(Boolean);

/**
 * Selector for loading predefined grammar examples from JSON sets.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Prepared grammar sets selector UI.
 */
export function PreparedSetsInput({ onGrammar }) {
  const handleSelectChange = (event) => {
    const index = Number.parseInt(event.target.value, 10);
    if (!Number.isNaN(index) && index >= 0) {
      const selectedGrammar = new Grammar(PREPARED_GRAMMAR_SETS[index]);

      onGrammar(selectedGrammar);
    }
  };

  return (
    <div className="inputWindow">
      <label>Vybrat gramatiku:</label>
      <select className="form-select" onChange={handleSelectChange}>
        <option value="">Vybrat sadu</option>
        {PREPARED_GRAMMAR_SETS.map((grammar, index) => (
          <option key={grammar.name || index} value={index}>
            {grammar.name}
          </option>
        ))}
      </select>
    </div>
  );
}

PreparedSetsInput.propTypes = {
  onGrammar: PropTypes.func.isRequired,
};
