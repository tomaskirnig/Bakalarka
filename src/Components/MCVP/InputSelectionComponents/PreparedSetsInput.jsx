import React, { useState } from 'react';
import { parseExpressionToTree, printTree } from '../Utils/Parser'; 
import { getData } from '../Utils/FileLoader';

export function PreparedSetsInput( {onTreeUpdate} ) {
  const data = getData();

  // Handle set selection
  const handleSelectChange = (event) => {
    const key = event.target.value;
    if (key) {
      const expression = data[key]; 
      const parsedTree = parseExpressionToTree(expression); // Parse the expression
      onTreeUpdate(parsedTree); // Send the tree to the component above for rendering
    }
  };

  return (
    <div className="inputWindow">
      <label>Vybrat sadu:</label>
      <select className="form-select" onChange={handleSelectChange}>
        <option value="">Vybrat sadu</option>
        {Object.keys(data).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {/* {console.log(data)} */}
    </div>
  );
}
  