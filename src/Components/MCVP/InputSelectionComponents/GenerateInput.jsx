import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { generateTree } from '../Utils/Generator'; 
import { printTree } from '../Utils/Parser'; 


export function GenerateInput( {onTreeUpdate} ) {
  const [numGates, setNumGates] = useState(1);      
  const [numVariables, setNumVariables] = useState(1); 
  const [tree, setTree] = useState(null); 

  // Handler for generating the tree when the button is clicked
  const handleGenerateTree = () => {
    const generatedTree = generateTree(numGates, numVariables);
    setTree(generatedTree); // Store the generated tree
    onTreeUpdate(generatedTree); // Pass the tree to the parent component
  };

  return (
    <div className="inputWindow">
      <label>Počet hradel:</label>
      <input
        className='form-control'
        type="number"
        min="1"
        max="3000"
        placeholder="Počet hradel"
        value={numGates}
        onChange={(e) => setNumGates(Number(e.target.value))} // Update state with input value
      />
      
      <label>Počet proměnných:</label>
      <input
        className='form-control'
        type="number"
        min="1"
        max="3000"
        placeholder="Počet proměnných"
        value={numVariables}
        onChange={(e) => setNumVariables(Number(e.target.value))} // Update state with input value
      />

      <button className='btn btn-primary mt-3' onClick={handleGenerateTree}>Generovat</button> 

      {tree && printTree(tree)}
    </div>
  );
}

GenerateInput.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired
};
