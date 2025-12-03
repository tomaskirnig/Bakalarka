import Data from '../../../../Sady/SadyCG.json'; 
import { parseExpressionToTree } from '../Utils/Parser';
import PropTypes from 'prop-types';

export function PreparedSetsInput({ onGraphUpdate }) {
  const data = Data; // Data is imported JSON file

  const handleSelectChange = (event) => {
    const key = event.target.value;
    if (key) {
      const { nodes, edges, startingPosition } = data[key];
      const expression = `nodes: ${nodes}; edges: ${edges}`; // Create the expression in the expected format
      const parsedGraph = parseExpressionToTree(expression, startingPosition);
      onGraphUpdate(parsedGraph);
    }
  };

  return (
    <div className="card p-4 mb-4 mx-auto shadow-sm text-start" style={{ maxWidth: '600px' }}>
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
