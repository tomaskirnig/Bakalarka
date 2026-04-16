import { useState } from 'react';
import PropTypes from 'prop-types';
import { generateTree } from '../Utils/Generator';

const MAX_NODE_COUNT = 750;

const parseClampedPositiveInt = (rawValue) => {
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.min(MAX_NODE_COUNT, Math.max(1, parsed));
};

/**
 * Component for generating a random MCVP tree based on user input.
 * Allows the user to specify the number of gates and variables.
 *
 * @component
 * @param {Object} props - The component props
 * @param {function} props.onTreeUpdate - Callback function called when a new tree is generated. Receives the root node of the generated tree.
 */
export function GenerateInput({ onTreeUpdate }) {
  const [numGates, setNumGates] = useState(1);
  const [numVariables, setNumVariables] = useState(1);

  // Handler for generating the tree when the button is clicked
  const handleGenerateTree = () => {
    const generatedTree = generateTree(numGates, numVariables);
    onTreeUpdate(generatedTree); // Pass the tree to the parent component
  };

  return (
    <div className="inputWindow">
      <label>Počet hradel:</label>
      <input
        className="form-control"
        type="number"
        min="1"
        max={MAX_NODE_COUNT}
        placeholder="Počet hradel"
        value={numGates}
        onChange={(e) => {
          const parsed = parseClampedPositiveInt(e.target.value);
          if (parsed !== null) {
            setNumGates(parsed);
          }
        }}
      />

      <label>Počet proměnných:</label>
      <input
        className="form-control"
        type="number"
        min="1"
        max={MAX_NODE_COUNT}
        placeholder="Počet proměnných"
        value={numVariables}
        onChange={(e) => {
          const parsed = parseClampedPositiveInt(e.target.value);
          if (parsed !== null) {
            setNumVariables(parsed);
          }
        }}
      />

      <button type="button" className="btn btn-primary mt-3" onClick={handleGenerateTree}>
        Generovat
      </button>
    </div>
  );
}

GenerateInput.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired,
};
