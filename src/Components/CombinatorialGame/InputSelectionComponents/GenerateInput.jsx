import React, { useState } from 'react';
import { generateGraph } from '../Utils/Generator';

export function GenerateInput({ onGraphUpdate }) {
    const [numGameFields, setNumGameFields] = useState(1);
    const [edgePropability, setEdgePropability] = useState(1);

    const handleGenerateGraph = () => {
        const generatedGraph = generateGraph(numGameFields, edgePropability);
        onGraphUpdate(generatedGraph);
    }

    return (
        <div className="inputWindow">
         <label>Počet polí:</label>
         <input
           className='form-control'
           type="number"
           min="1"
           max="3000"
           placeholder="Počet polí"
           value={numGameFields}
           onChange={(e) => setNumGameFields(Number(e.target.value))} // Update state with input value
         />
         <label>Pravděpodobnost hrany (%):</label>
         <input
           className='form-control'
           type="number"
           min="1"
           max="100"
           placeholder="Pravděpodobnost hrany (%)"
           value={edgePropability}
           onChange={(e) => setEdgePropability(Number(e.target.value))} // Update state with input value
         />
   
         <button className='btn btn-primary mt-3' onClick={handleGenerateGraph}>Generovat</button> 
        </div>
    );
}