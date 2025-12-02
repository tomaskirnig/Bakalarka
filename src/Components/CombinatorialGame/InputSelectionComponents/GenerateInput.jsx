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
        <div className="card p-4 mb-4 mx-auto shadow-sm text-start" style={{ maxWidth: '600px' }}>
            <div className="mb-3">
                <label className="form-label">Počet polí:</label>
                <input
                    className='form-control'
                    type="number"
                    min="1"
                    max="3000"
                    placeholder="Počet polí"
                    value={numGameFields}
                    onChange={(e) => setNumGameFields(Number(e.target.value))}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Pravděpodobnost hrany (%):</label>
                <input
                    className='form-control'
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Pravděpodobnost hrany (%)"
                    value={edgePropability}
                    onChange={(e) => setEdgePropability(Number(e.target.value))}
                />
            </div>
   
            <button className='btn btn-control w-100 mt-2' onClick={handleGenerateGraph}>Generovat</button> 
        </div>
    );
}