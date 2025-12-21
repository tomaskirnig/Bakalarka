import { useState } from 'react';
import { generateGraph } from '../Utils/Generator';
import PropTypes from 'prop-types';

export function GenerateInput({ onGraphUpdate, selectedStartingPlayer, setSelectedStartingPlayer }) {
    const [numGameFields, setNumGameFields] = useState(1);
    const [edgePropability, setEdgePropability] = useState(1);

    const handleGenerateGraph = () => {
        const generatedGraph = generateGraph(numGameFields, edgePropability);
        
        // Force the starting position's player to match the selected starting player
        if (generatedGraph && generatedGraph.startingPosition) {
            const startId = generatedGraph.startingPosition.id;
            if (generatedGraph.positions[startId]) {
                generatedGraph.positions[startId].player = selectedStartingPlayer;
            }
        }
        
        onGraphUpdate(generatedGraph);
    }

    return (
        <div className="card p-4 mb-4 mx-auto shadow-sm text-start" style={{ maxWidth: '600px' }}>
             <div className="mb-3">
                <label className="form-label d-block fw-bold">Začínající hráč:</label>
                <div className="form-check form-check-inline">
                    <input 
                        className="form-check-input" 
                        type="radio" 
                        name="genStartingPlayer" 
                        id="genPlayer1" 
                        value="1" 
                        checked={selectedStartingPlayer === 1} 
                        onChange={() => setSelectedStartingPlayer(1)} 
                    />
                    <label className="form-check-label" htmlFor="genPlayer1">Hráč 1</label>
                </div>
                <div className="form-check form-check-inline">
                    <input 
                        className="form-check-input" 
                        type="radio" 
                        name="genStartingPlayer" 
                        id="genPlayer2" 
                        value="2" 
                        checked={selectedStartingPlayer === 2} 
                        onChange={() => setSelectedStartingPlayer(2)} 
                    />
                    <label className="form-check-label" htmlFor="genPlayer2">Hráč 2</label>
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">Počet polí:</label>
                <input
                    className='form-control'
                    type="number"
                    min="1"
                    max="750"
                    placeholder="Počet polí"
                    value={numGameFields}
                    onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val > 750) val = 750;
                        if (val < 1) val = 1;
                        setNumGameFields(val);
                    }}
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
                    onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val > 100) val = 100;
                        if (val < 1) val = 1;
                        setEdgePropability(val);
                    }}
                />
            </div>
   
            <button className='btn-control mt-2' onClick={handleGenerateGraph}>Generovat</button> 
        </div>
    );
}

GenerateInput.propTypes = {
  onGraphUpdate: PropTypes.func.isRequired,
  selectedStartingPlayer: PropTypes.number,
  setSelectedStartingPlayer: PropTypes.func
};