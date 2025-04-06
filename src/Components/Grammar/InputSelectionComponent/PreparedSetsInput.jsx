import React, { useState } from 'react';

export function PreparedSetsInput({ onGrammar }) {
  // This would be replaced with actual data loading from a file
  const grammarSets = {
    "Bezkontextová gramatika 1": "S → aS | bA\nA → aA | bS | ε",
    "Regulární gramatika": "S → aS | bA | ε\nA → aB | bA\nB → aS | bB",
    "Jednoduchá gramatika": "S → aSb | ε"
  };

  const handleSelectChange = (event) => {
    const key = event.target.value;
    if (key) {
      const grammarText = grammarSets[key];
      const parsedGrammar = {
        rules: grammarText.split('\n').filter(rule => rule.trim()),
        input: grammarText,
        name: key
      };
      onGrammar(parsedGrammar);
    }
  };

  return (
    <div className="inputWindow">
      <label>Vybrat gramatiku:</label>
      <select className="form-select" onChange={handleSelectChange}>
        <option value="">Vybrat sadu</option>
        {Object.keys(grammarSets).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </div>
  );
}