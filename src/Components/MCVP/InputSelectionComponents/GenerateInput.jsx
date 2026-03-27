import { useState } from 'react';
import PropTypes from 'prop-types';
import { generateTree } from '../Utils/Generator';

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
        max="750"
        placeholder="Počet hradel"
        value={numGates}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (isNaN(val)) return;
          setNumGates(Math.min(750, Math.max(1, val)));
        }}
      />

      <label>Počet proměnných:</label>
      <input
        className="form-control"
        type="number"
        min="1"
        max="750"
        placeholder="Počet proměnných"
        value={numVariables}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (isNaN(val)) return;
          setNumVariables(Math.min(750, Math.max(1, val)));
        }}
      />

      <button className="btn btn-primary mt-3" onClick={handleGenerateTree}>
        Generovat
      </button>
    </div>
  );
}

GenerateInput.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired,
};
