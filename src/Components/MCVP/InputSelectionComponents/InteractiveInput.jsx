import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { evaluateTree } from '../Utils/EvaluateTree';
import ForceGraph2D from 'react-force-graph-2d';
import { toast } from 'react-toastify';
import { Node } from './../Utils/NodeClass';

const NODE_R = 12; 
const outerCircleColor = '#07393C';
const innerCircleColor = '#438c96'; 
const selectedColor = '#FFB74D'; 
const textColor = '#F0EDEE'; 

export function InteractiveMCVPGraph() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [addingEdge, setAddingEdge] = useState(false);
    const [edgeSource, setEdgeSource] = useState(null);
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();
    const nextNodeIdRef = useRef(0);
    
    // Generate unique ID function 
    const generateNodeId = useCallback(() => {
        const id = nextNodeIdRef.current;
        nextNodeIdRef.current += 1;
        return id;
    }, []);
    
    const GraphDataToNodeClass = (graphData) => {
        let tree = graphData.nodes.map(node => new Node(node.value, null, null, node.varValue, null, node.type));
        console.log(tree);

        // for(const link of graphData.links) {
        //     const sourceNode = tree.find(node => node.id === link.source.id);
        //     const targetNode = tree.find(node => node.id === link.target.id);
        //     if (sourceNode && targetNode) {
                
        //     }
        // }
        return tree;
    };

    // Memoize evaluation result 
    const evaluationResult = useMemo(() => {
        if (!graphData.nodes.length) return null;
        
        // Convert graph format to tree format for evaluation
        const tree = GraphDataToNodeClass(graphData);

        // return tree ? evaluateTree(tree) : null;
    }, [graphData]);

    // Add initial node if graph is empty
    useEffect(() => {
        if (graphData.nodes.length === 0) {
            addNode('operation', 'O');
        }
    }, [graphData.nodes.length]);



    // --- Core Graph Functions ---

    const addNode = (type, value = null, varValue = null) => {
        const newId = generateNodeId();
        let newNode;

        if (type === 'var') {
            newNode = {
                id: newId,
                type: 'variable',
                value: value || `x${newId}`, 
                varValue: varValue === null ? 0 : varValue, 
            };
        } else {
            newNode = {
                id: newId,
                type: 'operation',
                value: value,
                varValue: null,
            };
        }

        setGraphData(prevData => ({
            nodes: [...prevData.nodes, newNode],
            links: prevData.links,
        }));
        return newNode;
    };

    const deleteNode = (nodeId) => {
        setGraphData(prevData => ({
            nodes: prevData.nodes.filter(node => node.id !== nodeId),
            links: prevData.links.filter(link => 
                link.source.id !== nodeId && link.target.id !== nodeId
            )
        }));
        
        if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(null);
        }
        setAddingEdge(false);
        setEdgeSource(null);
    };

    const edgeExists = (sourceId, targetId) => {
        return graphData.links.some(link =>
            link.source.id === sourceId && link.target.id === targetId
        );
    };

    const addEdge = (sourceId, targetId) => {
        if (sourceId === targetId || edgeExists(sourceId, targetId)) {
            console.warn("Edge already exists or is a self-loop.");
            return false;
        }

        const sourceNode = graphData.nodes.find(n => n.id === sourceId);
        const targetNode = graphData.nodes.find(n => n.id === targetId);
        
        if (!sourceNode || !targetNode) {
            console.warn("Source or target node not found");
            return false;
        }

        const newLink = {
            source: sourceNode, 
            target: targetNode,
        };

        setGraphData(prevData => ({
            nodes: prevData.nodes,
            links: [...prevData.links, newLink],
        }));
        return true;
    };

    const deleteEdge = (sourceId, targetId) => {
        setGraphData(prevData => ({
            nodes: prevData.nodes,
            links: prevData.links.filter(link =>
                !(link.source.id === sourceId && link.target.id === targetId)
            ),
        }));
    };

    const handleDagError = (error) => {
        console.error("DAG Error:", error);
        toast.error("Chyba v DAG struktuře: Cyklus detekován nebo neplatná struktura.");
        graphData.links.pop();
    };

    const updateNodeValue = (nodeId, updates) => {
        setGraphData(prevData => {
            const updatedNodes = prevData.nodes.map(node => {
                if (node.id === nodeId) {
                    const updatedNode = { ...node, ...updates };
                    
                    if (updatedNode.type === 'operation') {
                        updatedNode.varValue = null;
                    } else if (updatedNode.type === 'variable' && updatedNode.varValue === null) {
                        updatedNode.value = `x${nodeId}`;
                        updatedNode.varValue = 0;
                    }
                    return updatedNode;
                }
                return node;
            });
            
            // Update links to reference the new node objects
            const nodeMap = updatedNodes.reduce((acc, node) => {
                acc[node.id] = node;
                return acc;
            }, {});
            
            const updatedLinks = prevData.links.map(link => ({
                source: nodeMap[link.source.id],
                target: nodeMap[link.target.id],
            }));
            
            return {
                nodes: updatedNodes,
                links: updatedLinks
            };
        });
        
        if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(prevSelNode => ({ ...prevSelNode, ...updates }));
        }
    };

    // --- Interaction Handlers ---

    const handleNodeClick = useCallback((node) => {
        if (addingEdge && edgeSource) {
            if (edgeSource.id !== node.id) {
                addEdge(edgeSource.id, node.id);
            }
            setAddingEdge(false);
            setEdgeSource(null);
            setSelectedNode(node);
        } else {
            setSelectedNode(node);
        }
    }, [addingEdge, edgeSource]);

    const handleBackgroundClick = useCallback(() => {
        if (addingEdge) {
            setAddingEdge(false);
            setEdgeSource(null);
        }
        setSelectedNode(null);
    }, [addingEdge]);

    const startAddEdge = () => {
        if (selectedNode) {
            setAddingEdge(true);
            setEdgeSource(selectedNode);
            setSelectedNode(null);
        }
    };

    const hasChildren = (nodeId) => {
        return graphData.links.some(link => link.source.id === nodeId);
    };

    // --- Canvas/Rendering Functions ---

    const paintNode = useCallback((node, ctx) => {
        const radius = NODE_R;
        const isSelected = selectedNode && node.id === selectedNode.id;
        const isHovered = hoverNode && node.id === hoverNode.id;
        const isEdgeSource = edgeSource && node.id === edgeSource.id;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = (isSelected || isEdgeSource) ? selectedColor : innerCircleColor;
        ctx.fill();

        ctx.strokeStyle = outerCircleColor;
        ctx.stroke();

        if (isSelected || isHovered || isEdgeSource) {
            ctx.strokeStyle = '#90DDF0';
            ctx.stroke();
        }

        let displayText = '';
        if (node.type === 'variable') {
            displayText = `${node.value}[${node.varValue}]`;
        } else {
            displayText = node.value === 'A' ? 'AND' : (node.value === 'O' ? 'OR' : node.value);
        }

        const fontSize = 12;
        ctx.font = `monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText(displayText, node.x, node.y);

    }, [selectedNode, hoverNode, edgeSource]);

    return (
        <div>
            {/*Instructions*/}
            <div style={{ textAlign: 'center', margin: '5px', minHeight: '24px', color: '#666' }}>
                {addingEdge && edgeSource && `Přidávání hrany z uzlu ${edgeSource.id}. Klikněte na cílový uzel nebo na pozadí pro zrušení.`}
                {selectedNode && !addingEdge && `Uzel ${selectedNode.id} vybrán.`}
                {!selectedNode && !addingEdge && 'Klikněte na pozadí pro zrušení výběru. Klikněte na uzel pro výběr.'}
            </div>

            {/* ForceGraph Canvas */}
            <div className="GraphDiv">
                <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData}
                    // Layout
                    dagMode="td" // Top-down layout
                    dagLevelDistance={70} // Distance between levels
                    cooldownTime={2000} // Stop simulation sooner
                    d3AlphaDecay={0.05} // Faster decay
                    d3VelocityDecay={0.4}
                    // Nodes
                    nodeRelSize={NODE_R} // Use fixed radius for consistency
                    nodeId="id"
                    nodeCanvasObject={paintNode}
                    nodeCanvasObjectMode={() => "after"} // Draw text after circle
                    // Links
                    linkColor={() => 'rgba(0,0,0,0.4)'}
                    linkWidth={1}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    onDagError={handleDagError}
                    // Interaction
                    onNodeClick={handleNodeClick}
                    onBackgroundClick={handleBackgroundClick}
                    onNodeHover={setHoverNode} // Update hover state
                    enableZoomPanInteraction={true}
                    enableNodeDrag={true} // Allow dragging nodes
                    onNodeDragEnd={node => { // Fix node position after dragging
                    node.fx = node.x;
                    node.fy = node.y;
                    }}
                />
            </div>

            {/* Control Buttons */}
            <div className='py-3'>
                <button className="btn add-btn mx-1" onClick={() => addNode('op', 'A')}>Přidat AND uzel</button>
                <button className="btn add-btn mx-1" onClick={() => addNode('op', 'O')}>Přidat OR uzel</button>
                <button className="btn add-btn mx-1" onClick={() => addNode('var')}>Přidat uzel s proměnou</button>
                {/* Add buttons to center view */}
            </div>

            {/* Selected Node Controls */}
            {selectedNode && !addingEdge && (
                <div className="p-4 my-3" style={{ border: '1px solid #eee', borderRadius: '4px'}}>
                    <h5>Vybraný uzel: {selectedNode.value === 'O' ? "OR" : selectedNode.value === 'A' ? "AND" : selectedNode.value}</h5>
                    <div className="d-flex flex-wrap justify-content-center align-items-center">
                        {/* Type/Value Change */}
                         {selectedNode.type === 'operation' && (
                            <>
                            <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { value: 'A' })}>Nastavit na AND</button>
                            <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { value: 'O' })}>Nastavit na OR</button>
                            {!hasChildren(selectedNode.id) && (
                                <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'variable' })}>
                                    Nastavit na proměnnou
                                </button>
                            )}
                            <button className="btn btn-success mx-1" onClick={startAddEdge}>Propojit uzel</button>
                            </>
                         )}
                         {selectedNode.type === 'variable' && (
                             <>
                             <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { varValue: 0 })}>Nastavit hodnotu na [0]</button>
                             <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { varValue: 1 })}>Nastavit hodnotu na [1]</button>
                             <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'operation', value: 'A'})}>Změnit na AND</button>
                             <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'operation', value: 'O'})}>Změnit na OR</button>
                             </>
                         )}
                         {/* General Actions */}
                        <button className="btn btn-danger mx-1" onClick={() => deleteNode(selectedNode.id)}>Smazat uzel</button>
                    </div>

                     {/* List connected edges for deletion */}
                      <div style={{ marginTop: "10px" }}>
                          <h6>Spojené hrany:</h6>
                          <div className="d-flex flex-wrap justify-content-center">
                              {graphData.links
                                  .filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
                                  .map((link, index) => {
                                      const connectedNodeId = link.source.id === selectedNode.id ? link.target.id : link.source.id;
                                      
                                      // Find the node object for display
                                      const connectedNode = graphData.nodes.find(node => node.id === connectedNodeId);
                                      
                                      // Format display text based on node type
                                      let displayText = connectedNodeId; // Fallback
                                      if (connectedNode) {
                                        if (connectedNode.type === 'variable') {
                                          displayText = `${connectedNode.value}[${connectedNode.varValue}]`;
                                        } else {
                                          displayText = connectedNode.value === 'A' ? 'AND' : 'OR';
                                        }
                                      }
                                      
                                      return (
                                          <div key={`${link.source}-${link.target}-${index}`} className="m-1">
                                              <button className="btn btn-outline-danger btn-sm"
                                                      onClick={() => deleteEdge(link.source.id, link.target.id)}>
                                                  Hrana k {displayText} &times;
                                              </button>
                                          </div>
                                      );
                                  })
                              }
                              {graphData.links.filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id).length === 0 && (
                                  <small className="text-muted">Žádné hrany.</small>
                              )}
                          </div>
                      </div>
                </div>
            )}

            {graphData && (
                <div className="card h-100 mt-3">
                    <div className="card-header">
                        <h4>Výsledek obvodu</h4>
                    </div>
                    <div className="card-body">
                        {evaluationResult !== null ? (
                            <>
                                <div className={`alert ${Boolean(evaluationResult) ? 'alert-success' : 'alert-warning'}`}>
                                    {`Výsledek: ${evaluationResult}`}
                                </div>
                            </>
                        ) : (
                            <p className="text-muted">Přidejte více uzlů a propojte je pro analýzu.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}