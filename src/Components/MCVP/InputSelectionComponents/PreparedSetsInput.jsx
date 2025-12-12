import PropTypes from "prop-types";
import Data from "../../../../Sady/SadyMCVP.json";
import { Node } from "../Utils/NodeClass";
import { toast } from "react-toastify";

/**
 * Component for selecting a pre-defined MCVP problem set.
 * Loads data from a JSON file and allows the user to choose a set.
 *
 * @component
 * @param {Object} props - The component props
 * @param {function} props.onTreeUpdate - Callback function called when a set is selected. Receives the parsed tree of the selected expression.
 */
export function PreparedSetsInput({ onTreeUpdate }) {
  const data = Data; // Load the data from the JSON file

  // Helper to convert graph data to Node structure
  const buildTreeFromGraphData = (graphData) => {
    if (!graphData || !graphData.nodes) return null;

    const nodeMap = new Map();

    // 1. Create Node instances
    graphData.nodes.forEach((n) => {
      const newNode = new Node(
        n.value,
        n.varValue,
        n.type,
        [], // children
        [], // parents
        n.id
      );
      nodeMap.set(n.id, newNode);
    });

    // 2. Build connections
    if (graphData.edges) {
      graphData.edges.forEach((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);

        if (source && target) {
          // In the JSON format, edges represent parent -> child relationships
          // (e.g., parent node n7(A) has child n5(O)).
          source.children.push(target);
          target.parents.push(source);
        }
      });
    }

    // 3. Find Root (Node with no parents)
    const rootNodes = Array.from(nodeMap.values()).filter(
      (node) => node.parents.length === 0
    );

    if (rootNodes.length === 0) {
      const msg = "V připravené sadě nebyl nalezen kořenový uzel (možný cyklus).";
      console.warn(msg);
      toast.error(msg);
      return null; // Cycle or empty?
    }

    // Return the first root found
    return rootNodes[0];
  };

  // Handle set selection
  const handleSelectChange = (event) => {
    const key = event.target.value;
    if (key) {
      const graphData = data[key];
      const tree = buildTreeFromGraphData(graphData);
      if (tree) {
        onTreeUpdate(tree);
      }
    }
  };

  return (
    <div className="inputWindow">
      <label>Vybrat sadu:</label>
      <select className="form-select" onChange={handleSelectChange}>
        <option value="">Vybrat sadu</option>
        {Object.keys(data).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </div>
  );
}

PreparedSetsInput.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired,
};
