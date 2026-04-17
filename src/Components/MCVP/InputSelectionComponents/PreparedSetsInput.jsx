import PropTypes from 'prop-types';
import { graphToTree } from '../Utils/GraphToTree';
import { toast } from 'react-toastify';

// Load all JSON files from the Sady/MCVP directory
const modules = import.meta.glob('../../../../Sady/MCVP/*.json', { eager: true });
const PREPARED_MCVP_SETS = Object.entries(modules)
  .map(([path, mod]) => {
    const data = mod.default || mod;
    // Validation
    if (!data || typeof data !== 'object') {
      console.warn(`Skipping invalid MCVP file (not an object): ${path}`);
      return null;
    }
    if (!data.name) {
      console.warn(`Skipping invalid MCVP file (missing name): ${path}`);
      return null;
    }
    if (!Array.isArray(data.nodes)) {
      console.warn(`Skipping invalid MCVP file (missing nodes array): ${path}`);
      return null;
    }
    return data;
  })
  .filter(Boolean);

/**
 * Component for selecting a pre-defined MCVP problem set.
 * Loads data from a JSON file and allows the user to choose a set.
 *
 * @component
 * @param {Object} props - The component props
 * @param {function} props.onTreeUpdate - Callback function called when a set is selected. Receives the parsed tree of the selected expression.
 */
export function PreparedSetsInput({ onTreeUpdate }) {
  // Handle set selection
  const handleSelectChange = (event) => {
    const index = Number.parseInt(event.target.value, 10);
    if (!Number.isNaN(index) && index >= 0) {
      const graphData = PREPARED_MCVP_SETS[index];
      try {
        const tree = graphToTree(graphData, {
          acceptEdgesOrLinks: true,
          preservePositions: false,
          requireBinaryOperationNodes: true,
          normalizeUnaryOperationNodes: false,
          throwOnInvalid: true,
        });
        if (tree) {
          onTreeUpdate(tree);
        }
      } catch (error) {
        toast.error(error.message || 'Nepodařilo se načíst sadu MCVP.');
      }
    }
  };

  return (
    <div className="inputWindow">
      <label>Vybrat sadu:</label>
      <select className="form-select" onChange={handleSelectChange}>
        <option value="">Vybrat sadu</option>
        {PREPARED_MCVP_SETS.map((set, index) => (
          <option key={set.name || index} value={index}>
            {set.name}
          </option>
        ))}
      </select>
    </div>
  );
}

PreparedSetsInput.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired,
};
