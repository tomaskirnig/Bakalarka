import React, { useState } from 'react';

export function GenerateInput( {onGrammar} ) {
    const [numTerminals, setNumTerminals] = useState(1); // Number of terminals
    const [numVariables, setNumVariables] = useState(1); // Number of variables

    // Handler for generating the grammar when the button is clicked
    const handleGenerateGrammar = () => {
        // const generatedGrammar = generateGrammar();
        // onGrammar(generatedGrammar); // Pass the grammar to the parent component
    };

    return (
        <div className="inputWindow">
        <label>Počet terminálů:</label>
        <input
            className='form-control'
            type="number"
            min="1"
            max="3000"
            placeholder="Počet terminálů"
            value={numTerminals}
            onChange={(e) => setNumTerminals(Number(e.target.value))} // Update state with input value
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

        <button className='btn btn-primary mt-1' onClick={handleGenerateGrammar}>Generovat</button> 

        </div>
    );
}
