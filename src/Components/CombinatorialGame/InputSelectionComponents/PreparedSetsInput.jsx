import PropTypes from 'prop-types';
import { useState } from 'react';

const toIdString = (value) => String(value);

// Load all JSON files from the Sady/CombinatorialGame directory
const modules = import.meta.glob('../../../../Sady/CombinatorialGame/*.json', { eager: true });
const PREPARED_GAME_SETS = Object.entries(modules)
  .map(([path, mod]) => {
    const data = mod.default || mod;
    // Validation
    if (!data || typeof data !== 'object') {
      console.warn(`Skipping invalid game file (not an object): ${path}`);
      return null;
    }
    if (!data.name) {
      console.warn(`Skipping invalid game file (missing name): ${path}`);
      return null;
    }
    if (!Array.isArray(data.nodes)) {
      console.warn(`Skipping invalid game file (missing nodes array): ${path}`);
      return null;
    }
    if (data.startingPosition === undefined) {
      console.warn(`Skipping invalid game file (missing startingPosition): ${path}`);
      return null;
    }
    return data;
  })
  .filter(Boolean);

/**
 * Selector for loading predefined combinatorial game instances from JSON sets.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Prepared sets selector UI.
 */
export function PreparedSetsInput({
  onGraphUpdate,
  selectedStartingPlayer,
  setSelectedStartingPlayer,
}) {
  const [selectedSetIndex, setSelectedSetIndex] = useState(null);

  const loadGraph = (index, playerOverride) => {
    const graphData = PREPARED_GAME_SETS[index];
    const positions = {};

    // 1. Initialize positions from nodes
    if (graphData.nodes) {
      graphData.nodes.forEach((n) => {
        positions[n.id] = {
          id: n.id,
          player: n.player,
          isWinning: false,
          parents: [],
          children: [],
        };
      });
    }

    // 2. Build edges
    if (graphData.edges) {
      graphData.edges.forEach((edge) => {
        const source = toIdString(edge.source);
        const target = toIdString(edge.target);

        if (positions[source] && positions[target]) {
          positions[source].children.push(target);
          positions[target].parents.push(source);
        }
      });
    }

    const startingPositionId = toIdString(graphData.startingPosition);

    // Override starting position player if requested
    if (playerOverride !== undefined && positions[startingPositionId]) {
      positions[startingPositionId].player = playerOverride;
    }

    const parsedGraph = {
      positions,
      startingPosition: positions[startingPositionId],
    };

    onGraphUpdate(parsedGraph);
  };

  const handleSelectChange = (event) => {
    const val = event.target.value;
    if (val === '') {
      setSelectedSetIndex(null);
      // Also clear the graph if no set is selected
      onGraphUpdate(null);
      return;
    }

    const index = Number.parseInt(val, 10);
    if (!Number.isNaN(index) && index >= 0) {
      setSelectedSetIndex(index);

      // Determine the natural starting player from the set
      const graphData = PREPARED_GAME_SETS[index];
      const startId = toIdString(graphData.startingPosition);
      const startNode = graphData.nodes.find((n) => toIdString(n.id) === startId);
      const naturalPlayer = startNode ? startNode.player : 1;

      // Update the selector to match the set
      setSelectedStartingPlayer(naturalPlayer);

      // Load the graph using the natural player
      loadGraph(index, naturalPlayer);
    }
  };

  const handlePlayerChange = (player) => {
    setSelectedStartingPlayer(player);
    if (selectedSetIndex !== null) {
      // If a set is loaded, reload it with the new player override
      loadGraph(selectedSetIndex, player);
    }
  };

  return (
    <div className="inputWindow">
      <label>Začínající hráč:</label>
      <div className="tabs no-border mb-0">
        <input
          type="radio"
          id="setsPlayer1"
          name="setsStartingPlayer"
          value="1"
          checked={selectedStartingPlayer === 1}
          onChange={() => handlePlayerChange(1)}
        />
        <label htmlFor="setsPlayer1" className="btn btn-outline-primary">
          Hráč 1
        </label>

        <input
          type="radio"
          id="setsPlayer2"
          name="setsStartingPlayer"
          value="2"
          checked={selectedStartingPlayer === 2}
          onChange={() => handlePlayerChange(2)}
        />
        <label htmlFor="setsPlayer2" className="btn btn-outline-primary">
          Hráč 2
        </label>
      </div>

      <label>Vybrat sadu:</label>
      <select
        className="form-select"
        onChange={handleSelectChange}
        value={selectedSetIndex === null ? '' : selectedSetIndex}
      >
        <option value="">Vybrat sadu</option>
        {PREPARED_GAME_SETS.map((set, index) => (
          <option key={set.name || index} value={index}>
            {set.name}
          </option>
        ))}
      </select>
    </div>
  );
}

PreparedSetsInput.propTypes = {
  onGraphUpdate: PropTypes.func.isRequired,
  selectedStartingPlayer: PropTypes.number,
  setSelectedStartingPlayer: PropTypes.func,
};
