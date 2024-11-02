import React, { useState } from 'react';
import { generateTree } from './Generator'; 

export function GenerateInput() {
  // State for storing input values
  const [numGates, setNumGates] = useState(1);      // Initial value for gates
  const [numVariables, setNumVariables] = useState(1); // Initial value for variables
  const [tree, setTree] = useState(null); // State to store the generated tree

  // Handler for generating the tree when the button is clicked
  const handleGenerateTree = () => {
    const generatedTree = generateTree(numGates, numVariables);
    setTree(generatedTree); // Store the generated tree
  };

  // Recursive function to render the tree structure horizontally
  function renderTree(node) {
    if (!node) return null;
    
    return (
      <div style={{ display: 'inline-block', textAlign: 'center', margin: '0 10px' }}>
        {/* Render the current node */}
        <div>
          {node.value}{node.varValue !== null ? `[${node.varValue}]` : ''}
        </div>
        
        {/* Render child nodes (left and right) if they exist */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {node.left && (
            <div style={{ marginRight: '10px' }}>
              {renderTree(node.left)}
            </div>
          )}
          {node.right && (
            <div style={{ marginLeft: '10px' }}>
              {renderTree(node.right)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="inputWindow">
      <label>Počet hradel:</label>
      <input
        type="number"
        min="1"
        placeholder="Počet hradel"
        value={numGates}
        onChange={(e) => setNumGates(Number(e.target.value))} // Update state with input value
      />
      
      <label>Počet proměnných:</label>
      <input
        type="number"
        min="1"
        placeholder="Počet proměnných"
        value={numVariables}
        onChange={(e) => setNumVariables(Number(e.target.value))} // Update state with input value
      />

      <button onClick={handleGenerateTree}>Generovat</button> 

      {/* Optionally display the tree structure */}
      {tree && <pre>{renderTree(tree)}</pre>}
    </div>
  );
}
