import { useState } from 'react';
import { generateGraph } from '../Utils/Generator';
import PropTypes from 'prop-types';

export function GenerateInput({ onGraphUpdate, selectedStartingPlayer, setSelectedStartingPlayer }) {
    const [numGameFields, setNumGameFields] = useState(1);
    const [edgeProbability, setEdgePropability] = useState(1);
    const [localStartingPlayer, setLocalStartingPlayer] = useState(selectedStartingPlayer || 1);

    const handleGenerateGraph = () => {
        const generatedGraph = generateGraph(numGameFields, edgeProbability);

        // Set the starting position's player to the selected starting player
        generatedGraph.positions[generatedGraph.startingPosition.id].player = localStartingPlayer;
        
        if (setSelectedStartingPlayer) {
            setSelectedStartingPlayer(localStartingPlayer);
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
                    checked={localStartingPlayer === 1} 
                    onChange={() => setLocalStartingPlayer(1)} 
                />
                <label htmlFor="genPlayer1" className="btn btn-outline-primary">Hráč 1</label>

                <input 
                    type="radio" 
                    id="genPlayer2" 
                    name="genStartingPlayer" 
                    value="2" 
                    checked={localStartingPlayer === 2} 
                    onChange={() => setLocalStartingPlayer(2)} 
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
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) return;
                    setNumGameFields(Math.min(750, Math.max(1, val)));
                }}
            />
            
            <label>Pravděpodobnost hrany (%):</label>
            <input
                className='form-control'
                type="number"
                min="1"
                max="100"
                placeholder="Pravděpodobnost hrany (%)"
                value={edgeProbability}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) return;
                    setEdgePropability(Math.min(100, Math.max(1, val)));
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