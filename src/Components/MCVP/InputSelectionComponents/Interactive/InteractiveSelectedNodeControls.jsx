import PropTypes from 'prop-types';
import { getNodeDisplayName } from './InteractiveInput.helpers';

export function InteractiveSelectedNodeControls({
  selectedNode,
  graphLinks,
  hasChildren,
  canAddChild,
  onUpdateNodeValue,
  onStartAddEdge,
  onDeleteNode,
  onDeleteEdge
}) {
  if (!selectedNode) return null;

  const connectedLinks = graphLinks.filter(
    link => String(link.source.id) === String(selectedNode.id) || String(link.target.id) === String(selectedNode.id)
  );

  return (
    <div className="p-4 my-3" style={{ border: '1px solid #eee', borderRadius: '4px' }}>
      <h5>Vybraný uzel: {getNodeDisplayName(selectedNode)}</h5>
      <div className="d-flex flex-wrap justify-content-center align-items-center">
        {selectedNode.type === 'operation' && (
          <>
            <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { value: 'A' })}>Nastavit na AND</button>
            <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { value: 'O' })}>Nastavit na OR</button>
            {!hasChildren(selectedNode.id) && (
              <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { type: 'variable' })}>
                Nastavit na proměnnou
              </button>
            )}
            <button className="btn btn-success mx-1" onClick={onStartAddEdge} disabled={!canAddChild(selectedNode.id)}>Propojit uzel</button>
          </>
        )}

        {selectedNode.type === 'variable' && (
          <>
            <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { varValue: 0 })}>Nastavit hodnotu na [0]</button>
            <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { varValue: 1 })}>Nastavit hodnotu na [1]</button>
            <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { type: 'operation', value: 'A' })}>Změnit na AND</button>
            <button className="btn add-btn mx-1" onClick={() => onUpdateNodeValue(selectedNode.id, { type: 'operation', value: 'O' })}>Změnit na OR</button>
          </>
        )}

        <button className="btn btn-danger mx-1" onClick={() => onDeleteNode(selectedNode.id)}>Smazat uzel</button>
      </div>

      <div style={{ marginTop: '10px' }}>
        <h6>Spojené hrany:</h6>
        <div className="d-flex flex-wrap justify-content-center">
          {connectedLinks.map((link, index) => (
            <div key={`${link.source}-${link.target}-${index}`} className="m-1">
              <button className="btn btn-outline-danger btn-sm" onClick={() => onDeleteEdge(link.source.id, link.target.id)}>
                Odstranit hranu {link.id} &times;
              </button>
            </div>
          ))}
          {connectedLinks.length === 0 && (
            <small className="text-muted">Žádné hrany.</small>
          )}
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
    varValue: PropTypes.number
  }),
  graphLinks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    source: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired }).isRequired,
    target: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired }).isRequired
  })).isRequired,
  hasChildren: PropTypes.func.isRequired,
  canAddChild: PropTypes.func.isRequired,
  onUpdateNodeValue: PropTypes.func.isRequired,
  onStartAddEdge: PropTypes.func.isRequired,
  onDeleteNode: PropTypes.func.isRequired,
  onDeleteEdge: PropTypes.func.isRequired
};
