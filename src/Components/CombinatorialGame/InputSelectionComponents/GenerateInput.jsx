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
        <div className="inputWindow">
            <label>Začínající hráč:</label>
            <div className="tabs no-border mb-0">
                <input 
                    type="radio" 
                    id="genPlayer1" 
                    name="genStartingPlayer" 
                    value="1" 
                    checked={selectedStartingPlayer === 1} 
                    onChange={() => setSelectedStartingPlayer(1)} 
                />
                <label htmlFor="genPlayer1" className="btn btn-outline-primary">Hráč 1</label>

                <input 
                    type="radio" 
                    id="genPlayer2" 
                    name="genStartingPlayer" 
                    value="2" 
                    checked={selectedStartingPlayer === 2} 
                    onChange={() => setSelectedStartingPlayer(2)} 
                />
                <label htmlFor="genPlayer2" className="btn btn-outline-primary">Hráč 2</label>
            </div>

            <label>Počet polí:</label>
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
            
            <label>Pravděpodobnost hrany (%):</label>
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
   
            <button className='btn btn-primary mt-3' onClick={handleGenerateGraph}>Generovat</button> 
        </div>
    );
}

GenerateInput.propTypes = {
  onGraphUpdate: PropTypes.func.isRequired,
  selectedStartingPlayer: PropTypes.number,
  setSelectedStartingPlayer: PropTypes.func
};