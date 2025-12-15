import PropTypes from "prop-types";

// Load all JSON files from the Sady/CombinatorialGame directory
const modules = import.meta.glob('../../../../Sady/CombinatorialGame/*.json', { eager: true });
const Data = Object.values(modules).map(mod => mod.default || mod);

export function PreparedSetsInput({ onGraphUpdate }) {
  const handleSelectChange = (event) => {
    const index = parseInt(event.target.value);
    if (!isNaN(index) && index >= 0) {
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

      const parsedGraph = {
        positions,
        startingPosition: positions[startingPositionId],
      };

      onGraphUpdate(parsedGraph);
    }
  };

  return (
    <div
      className="card p-4 mb-4 mx-auto shadow-sm text-start"
      style={{ maxWidth: "600px" }}
    >
      <div className="mb-3">
        <label className="form-label">Vybrat sadu:</label>
        <select className="form-select" onChange={handleSelectChange}>
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
};
