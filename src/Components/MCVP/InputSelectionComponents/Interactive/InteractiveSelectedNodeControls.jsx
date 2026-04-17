import PropTypes from 'prop-types';
import { getNodeDisplayName } from './InteractiveInput.helpers';

const getLinkEndpointId = (endpoint) =>
  typeof endpoint === 'object' && endpoint !== null ? endpoint.id : endpoint;

/**
 * Renders action controls for the currently selected node
 * in the interactive MCVP editor.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element|null} Controls panel for selected node, or null.
 */
export function InteractiveSelectedNodeControls({
  selectedNode,
  graphLinks,
  hasChildren,
  canAddChild,
  onUpdateNodeValue,
  onStartAddEdge,
  onDeleteNode,
  onDeleteEdge,
}) {
  if (!selectedNode) return null;

  const connectedLinks = graphLinks.filter(
    (link) =>
      String(getLinkEndpointId(link.source)) === String(selectedNode.id) ||
      String(getLinkEndpointId(link.target)) === String(selectedNode.id)
  );

  return (
    <div className="p-4 my-3" style={{ border: '1px solid #eee', borderRadius: '4px' }}>
      <h5>Vybraný uzel: {getNodeDisplayName(selectedNode)}</h5>
      <div className="d-flex flex-wrap justify-content-center align-items-center">
        {selectedNode.type === 'operation' && (
          <>
            <button
              type="button"
              className="btn add-btn mx-1"
              onClick={() => onUpdateNodeValue(selectedNode.id, { value: 'A' })}
            >
              Nastavit na AND
            </button>
            <button
              type="button"
              className="btn add-btn mx-1"
              onClick={() => onUpdateNodeValue(selectedNode.id, { value: 'O' })}
            >
              Nastavit na OR
            </button>
            {!hasChildren(selectedNode.id) && (
              <button
                type="button"
                className="btn add-btn mx-1"
                onClick={() => onUpdateNodeValue(selectedNode.id, { type: 'variable' })}
              >
                Nastavit na proměnnou
              </button>
            )}
            <button
              type="button"
              className="btn btn-success mx-1"
              onClick={onStartAddEdge}
              disabled={!canAddChild(selectedNode.id)}
            >
              Propojit uzel
            </button>
          </>
        )}

        {selectedNode.type === 'variable' && (
          <>
            <button
              type="button"
              className="btn add-btn mx-1"
              onClick={() => onUpdateNodeValue(selectedNode.id, { varValue: 0 })}
            >
              Nastavit hodnotu na [0]
            </button>
            <button
              type="button"
              className="btn add-btn mx-1"
              onClick={() => onUpdateNodeValue(selectedNode.id, { varValue: 1 })}
            >
              Nastavit hodnotu na [1]
            </button>
            <button
              type="button"
              className="btn add-btn mx-1"
              onClick={() => onUpdateNodeValue(selectedNode.id, { type: 'operation', value: 'A' })}
            >
              Změnit na AND
            </button>
            <button
              type="button"
              className="btn add-btn mx-1"
              onClick={() => onUpdateNodeValue(selectedNode.id, { type: 'operation', value: 'O' })}
            >
              Změnit na OR
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-danger mx-1"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          Smazat uzel
        </button>
      </div>

      <div style={{ marginTop: '10px' }}>
        <h6>Spojené hrany:</h6>
        <div className="d-flex flex-wrap justify-content-center">
          {connectedLinks.map((link) => (
            <div key={link.id} className="m-1">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  onDeleteEdge(getLinkEndpointId(link.source), getLinkEndpointId(link.target))
                }
              >
                Odstranit hranu {link.id} &times;
              </button>
            </div>
          ))}
          {connectedLinks.length === 0 && <small className="text-muted">Žádné hrany.</small>}
        </div>
      </div>
    </div>
  );
}

InteractiveSelectedNodeControls.propTypes = {
  selectedNode: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.string,
    varValue: PropTypes.number,
  }),
  graphLinks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      source: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      }).isRequired,
      target: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      }).isRequired,
    })
  ).isRequired,
  hasChildren: PropTypes.func.isRequired,
  canAddChild: PropTypes.func.isRequired,
  onUpdateNodeValue: PropTypes.func.isRequired,
  onStartAddEdge: PropTypes.func.isRequired,
  onDeleteNode: PropTypes.func.isRequired,
  onDeleteEdge: PropTypes.func.isRequired,
};
