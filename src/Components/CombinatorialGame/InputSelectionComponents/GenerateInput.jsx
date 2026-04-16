import { useState } from 'react';
import { generateGraph } from '../Utils/Generator';
import PropTypes from 'prop-types';

const MAX_GAME_FIELDS = 750;
const MAX_EDGE_PROBABILITY = 100;

const parseClampedInt = (rawValue, min, max) => {
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
};

/**
 * Form for generating random combinatorial game graphs.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Generator input UI.
 */
export function GenerateInput({
  onGraphUpdate,
  selectedStartingPlayer,
  setSelectedStartingPlayer,
}) {
  const [numGameFields, setNumGameFields] = useState(1);
  const [edgeProbability, setEdgeProbability] = useState(1);
  const [localStartingPlayer, setLocalStartingPlayer] = useState(selectedStartingPlayer || 1);

  const handleGenerateGraph = () => {
    const generatedGraph = generateGraph(numGameFields, edgeProbability);

    // Set the starting position's player to the selected starting player
    generatedGraph.positions[generatedGraph.startingPosition.id].player = localStartingPlayer;

    if (setSelectedStartingPlayer) {
      setSelectedStartingPlayer(localStartingPlayer);
    }

    onGraphUpdate(generatedGraph);
  };

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
        <label htmlFor="genPlayer1" className="btn btn-outline-primary">
          Hráč 1
        </label>

        <input
          type="radio"
          id="genPlayer2"
          name="genStartingPlayer"
          value="2"
          checked={localStartingPlayer === 2}
          onChange={() => setLocalStartingPlayer(2)}
        />
        <label htmlFor="genPlayer2" className="btn btn-outline-primary">
          Hráč 2
        </label>
      </div>

      <label>Počet polí:</label>
      <input
        className="form-control"
        type="number"
        min="1"
        max={MAX_GAME_FIELDS}
        placeholder="Počet polí"
        value={numGameFields}
        onChange={(e) => {
          const parsed = parseClampedInt(e.target.value, 1, MAX_GAME_FIELDS);
          if (parsed !== null) {
            setNumGameFields(parsed);
          }
        }}
      />

      <label>Pravděpodobnost hrany (%):</label>
      <input
        className="form-control"
        type="number"
        min="1"
        max={MAX_EDGE_PROBABILITY}
        placeholder="Pravděpodobnost hrany (%)"
        value={edgeProbability}
        onChange={(e) => {
          const parsed = parseClampedInt(e.target.value, 1, MAX_EDGE_PROBABILITY);
          if (parsed !== null) {
            setEdgeProbability(parsed);
          }
        }}
      />

      <button type="button" className="btn btn-primary mt-3" onClick={handleGenerateGraph}>
        Generovat
      </button>
    </div>
  );
}

GenerateInput.propTypes = {
  onGraphUpdate: PropTypes.func.isRequired,
  selectedStartingPlayer: PropTypes.number,
  setSelectedStartingPlayer: PropTypes.func,
};
