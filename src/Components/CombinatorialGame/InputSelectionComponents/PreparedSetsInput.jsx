import React, { useState } from 'react';
import { getData } from '../Utils/FileLoader';
import { parseExpressionToTree } from '../Utils/Parser';

export function PreparedSetsInput({ onGraphUpdate }) {
  const data = getData();

  const handleSelectChange = (event) => {
    const key = event.target.value;
    if (key) {
      const { nodes, edges, startingPosition } = data[key];
      console.log('nodes: ', nodes, '\n egdes: ', edges, '\n start pos: ', startingPosition);
      const expression = `nodes: ${nodes}; edges: ${edges}`; // Create the expression in the expected format
      const parsedGraph = parseExpressionToTree(expression, startingPosition);
      onGraphUpdate(parsedGraph);
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
    </div>
  );
}
