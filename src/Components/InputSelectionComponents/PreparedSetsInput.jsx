import React, { useState } from 'react';
import { parseExpressionToTree, printTree } from '../../Utils/Parser'; 
import { getData, printData } from '../../Utils/FileLoader';

export function PreparedSetsInput( {onTreeUpdate} ) {
  const data = getData();
  const [selectedKey, setSelectedKey] = useState(''); 
  const [tree, setTree] = useState(null);

  // Update selected key and parse expression when dropdown changes
  const handleSelectChange = (event) => {
    const key = event.target.value;
    setSelectedKey(key);
    if (key) {
      const expression = data[key]; // Get expression by key from data
      const parsedTree = parseExpressionToTree(expression); // Parse the expression
      setTree(parsedTree); // Update state with parsed tree
      onTreeUpdate(parsedTree); // Call the update function if needed
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
      {/* <div className="confirmInputDiv">
          <button className='btn btn-primary' type="button" onClick={() => printTree(tree)}>
            Potvrdit
          </button>
      </div> */}
      {printData()}
    </div>
  );
}
  