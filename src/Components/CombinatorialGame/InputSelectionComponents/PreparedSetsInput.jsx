import Data from "../../../../Sady/SadyCG.json";
import PropTypes from "prop-types";

export function PreparedSetsInput({ onGraphUpdate }) {
  const data = Data; // Data is imported JSON file

  const handleSelectChange = (event) => {
    const key = event.target.value;
    if (key) {
      const graphData = data[key];

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
          {Object.keys(data).map((key) => (
            <option key={key} value={key}>
              {key}
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
