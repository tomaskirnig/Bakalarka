import PropTypes from 'prop-types';
import { getConnectedLinks, resolveNodeId } from './ManualInput.helpers';

export function ManualInputPanels({
  analysisResult,
  startingNodeId,
  selectedNode,
  addingEdge,
  links,
  onChangePlayer,
  onSetAsStartingNode,
  onDeleteNode,
  onStartAddEdge,
  onDeleteEdge
}) {
  const connectedLinks = selectedNode ? getConnectedLinks(links, selectedNode.id) : [];

  return (
    <div className="row g-4 mb-3">
      <div className="col-md-6">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-light fw-bold">
            Analýza hry
          </div>
          <div className="card-body text-center d-flex flex-column justify-content-center">
            {analysisResult ? (
              (() => {
                const startStatus = analysisResult.nodeStatusRaw ? analysisResult.nodeStatusRaw[startingNodeId] : null;
                let alertClass = 'alert-secondary';

                if (analysisResult.hasWinningStrategy) {
                  alertClass = 'alert-success';
                } else if (startStatus === 'DRAW') {
                  alertClass = 'alert-warning';
                } else {
                  alertClass = 'alert-danger';
                }

                return (
                  <>
                    <div className={`alert ${alertClass}`}>
                      {analysisResult.message}
                    </div>
                    <p className="text-muted small mb-0">
                      Zlatě vyznačené hrany představují optimální tahy pro Hráče I.
                    </p>
                  </>
                );
              })()
            ) : (
              <p className="text-muted text-center my-auto">
                Definujte graf a startovní pozici pro zobrazení analýzy.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-light fw-bold">
            Ovládání grafu
          </div>
          <div className="card-body">
            {selectedNode && !addingEdge ? (
              <>
                <h5 className="card-title mb-3">Vybraný uzel: {selectedNode.id}</h5>
                <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                  <button className="btn btn-primary btn-sm" onClick={onChangePlayer}>Změnit hráče</button>
                  <button className="btn btn-info btn-sm" onClick={onSetAsStartingNode}>Nastavit jako startovní</button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDeleteNode(selectedNode.id)}>Smazat uzel</button>
                  <button className="btn btn-success btn-sm" onClick={onStartAddEdge}>Přidat hranu</button>
                </div>

                <div>
                  <h6 className="mb-2">Propojené uzly:</h6>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {connectedLinks.map((link, index) => {
                      const sourceId = resolveNodeId(link.source);
                      const targetId = resolveNodeId(link.target);
                      const connectedNodeId = sourceId === selectedNode.id ? targetId : sourceId;

                      return (
                        <button
                          key={index}
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => onDeleteEdge(sourceId, targetId)}
                        >
                          Smazat hranu {connectedNodeId}
                        </button>
                      );
                    })}
                    {connectedLinks.length === 0 && (
                      <span className="text-muted small">Žádné hrany</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                Vyberte uzel pro zobrazení možností.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ManualInputPanels.propTypes = {
  analysisResult: PropTypes.object,
  startingNodeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedNode: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  addingEdge: PropTypes.bool.isRequired,
  links: PropTypes.arrayOf(PropTypes.shape({
    source: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })
    ]),
    target: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })
    ])
  })).isRequired,
  onChangePlayer: PropTypes.func.isRequired,
  onSetAsStartingNode: PropTypes.func.isRequired,
  onDeleteNode: PropTypes.func.isRequired,
  onStartAddEdge: PropTypes.func.isRequired,
  onDeleteEdge: PropTypes.func.isRequired
};
