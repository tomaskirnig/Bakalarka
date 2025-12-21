import PropTypes from "prop-types";
import { useState } from "react";

// Load all JSON files from the Sady/CombinatorialGame directory
const modules = import.meta.glob('../../../../Sady/CombinatorialGame/*.json', { eager: true });
const Data = Object.entries(modules)
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
    .filter(item => item !== null);

export function PreparedSetsInput({ onGraphUpdate, selectedStartingPlayer, setSelectedStartingPlayer }) {
  const [selectedSetIndex, setSelectedSetIndex] = useState(null);

  const loadGraph = (index, playerOverride) => {
      const graphData = Data[index];
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
          const source = String(edge.source);
          const target = String(edge.target);

          if (positions[source] && positions[target]) {
            positions[source].children.push(target);
            positions[target].parents.push(source);
          }
        });
      }

      const startingPositionId = String(graphData.startingPosition);
      
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
    if (val === "") {
        setSelectedSetIndex(null);
        return;
    }

    const index = parseInt(val);
    if (!isNaN(index) && index >= 0) {
      setSelectedSetIndex(index);
      
      // Determine the natural starting player from the set
      const graphData = Data[index];
      const startId = String(graphData.startingPosition);
      const startNode = graphData.nodes.find(n => String(n.id) === startId);
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
    <div
      className="card p-4 mb-4 mx-auto shadow-sm text-start"
      style={{ maxWidth: "600px" }}
    >
      <div className="mb-3">
        <label className="form-label d-block fw-bold">Začínající hráč:</label>
        <div className="form-check form-check-inline">
            <input 
                className="form-check-input" 
                type="radio" 
                name="setsStartingPlayer" 
                id="setsPlayer1" 
                value="1" 
                checked={selectedStartingPlayer === 1} 
                onChange={() => handlePlayerChange(1)} 
            />
            <label className="form-check-label" htmlFor="setsPlayer1">Hráč 1</label>
        </div>
        <div className="form-check form-check-inline">
            <input 
                className="form-check-input" 
                type="radio" 
                name="setsStartingPlayer" 
                id="setsPlayer2" 
                value="2" 
                checked={selectedStartingPlayer === 2} 
                onChange={() => handlePlayerChange(2)} 
            />
            <label className="form-check-label" htmlFor="setsPlayer2">Hráč 2</label>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Vybrat sadu:</label>
        <select className="form-select" onChange={handleSelectChange} value={selectedSetIndex === null ? "" : selectedSetIndex}>
          <option value="">Vybrat sadu</option>
          {Data.map((set, index) => (
            <option key={index} value={index}>
              {set.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

PreparedSetsInput.propTypes = {
  onGraphUpdate: PropTypes.func.isRequired,
  selectedStartingPlayer: PropTypes.number,
  setSelectedStartingPlayer: PropTypes.func
};
