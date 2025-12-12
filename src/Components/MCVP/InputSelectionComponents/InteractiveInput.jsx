import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { toast } from 'react-toastify';
import { Node } from './../Utils/NodeClass';
import { useGraphColors } from '../../../Hooks/useGraphColors';
import { useGraphSettings } from '../../../Hooks/useGraphSettings';

/**
 * Component for interactively building and evaluating an MCVP graph.
 * Uses a force-directed graph to allow users to add nodes, edges, and modify values.
 * Automatically evaluates the circuit as it is built.
 * 
 * @component
 */
export function InteractiveMCVPGraph({ onTreeUpdate }) {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [addingEdge, setAddingEdge] = useState(false);
    const [edgeSource, setEdgeSource] = useState(null);
    const [hoverNode, setHoverNode] = useState(null);
    const fgRef = useRef();
    const containerRef = useRef(); // Ref for container
    const nextNodeIdRef = useRef(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const colors = useGraphColors();
    const settings = useGraphSettings();
    const { mcvp } = settings;

    // ResizeObserver for responsive graph and color updates
    useEffect(() => {
        if (!containerRef.current) return;

        const updateDimensions = () => {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setDimensions({ width, height });
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver(() => {
            updateDimensions();
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);
    
    // Generate unique ID function 
    const generateNodeId = useCallback(() => {
        const id = nextNodeIdRef.current;
        nextNodeIdRef.current += 1;
        return id;
    }, []);
    
    const GraphDataToNodeClass = useCallback((graphData) => {
        if (!graphData.nodes.length) return null;
        
        // Create a map of Node instances
        const nodeMap = new Map();
        
        // First pass: Create all Node instances
        for (const graphNode of graphData.nodes) {
            const node = new Node(
                graphNode.value,
                graphNode.varValue,
                graphNode.type,
                [], // Initialize empty children array
                [],  // Initialize empty parents array
                graphNode.id 
            );
            nodeMap.set(graphNode.id, node);
        }
        
        // Second pass: Build parent-child relationships
        for (const link of graphData.links) {
            const sourceNode = nodeMap.get(link.source.id);
            const targetNode = nodeMap.get(link.target.id);
            
            if (sourceNode && targetNode) {
                // Add target as child of source
                sourceNode.children.push(targetNode);
                // Add source as parent of target
                targetNode.parents.push(sourceNode);
            }
        }
        
        // Find the root node (node with no parents)
        const rootNodes = Array.from(nodeMap.values()).filter(node => 
            node.parents.length === 0
        );
        
        if (rootNodes.length === 0) {
            console.warn("No root node found - graph may have cycles");
            return null;
        }
        
        if (rootNodes.length > 1) {
            // console.warn("Multiple root nodes found - using the first one");
        }
        
        // console.log(`Graph converted to tree structure:`);
        // console.log(rootNodes[0]);
        
        return rootNodes[0]; // Return the root node of the tree
    }, []);

    // Sync with parent component whenever graphData changes
    useEffect(() => {
        if (onTreeUpdate && graphData.nodes.length > 0) {
            const tree = GraphDataToNodeClass(graphData);
            if (tree) {
                onTreeUpdate(tree);
            }
        }
    }, [graphData, onTreeUpdate, GraphDataToNodeClass]);

    // --- Core Graph Functions ---

    const addNode = useCallback((type, value = null, varValue = null) => {
        if (graphData.nodes.length >= 750) {
            toast.error("Dosažen limit 750 uzlů.");
            return null;
        }
        
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
    }, [generateNodeId, graphData.nodes.length]);

    // Add initial node if graph is empty
    useEffect(() => {
        if (graphData.nodes.length === 0) {
            addNode('operation', 'O');
        }
    }, [graphData.nodes.length, addNode]);

    /**
     * Deletes a node and all connected edges from the graph.
     * @param {number|string} nodeId - The ID of the node to delete.
     */
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

    const edgeExists = useCallback((sourceId, targetId) => {
        return graphData.links.some(link =>
            link.source.id === sourceId && link.target.id === targetId
        );
    }, [graphData.links]);

    /**
     * Adds a directed edge between two nodes.
     * @param {number|string} sourceId - The ID of the source node (parent).
     * @param {number|string} targetId - The ID of the target node (child).
     * @returns {boolean} True if the edge was added, false if it already exists or is invalid.
     */
    const addEdge = useCallback((sourceId, targetId) => {
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
    }, [graphData.nodes, edgeExists]);

    /**
     * Deletes an edge between two nodes.
     * @param {number|string} sourceId - The ID of the source node.
     * @param {number|string} targetId - The ID of the target node.
     */
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

    /**
     * Updates properties of a specific node.
     * @param {number|string} nodeId - The ID of the node to update.
     * @param {Object} updates - An object containing the properties to update.
     */
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
    }, [addingEdge, edgeSource, addEdge]);

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
        const radius = mcvp.nodeRadius;
        const isSelected = selectedNode && node.id === selectedNode.id;
        const isHovered = hoverNode && node.id === hoverNode.id;
        const isEdgeSource = edgeSource && node.id === edgeSource.id;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = (isSelected || isEdgeSource) ? colors.selected : colors.defaultNode;
        ctx.fill();

        ctx.strokeStyle = colors.outerCircle;
        ctx.stroke();

        if (isSelected || isHovered || isEdgeSource) {
            ctx.strokeStyle = colors.highlightNode;
            ctx.stroke();
        }

        let displayText = '';
        if (node.type === 'variable') {
            displayText = `${node.value}[${node.varValue}]`;
        } else {
            displayText = node.value === 'A' ? 'AND' : (node.value === 'O' ? 'OR' : node.value);
        }

        ctx.font = mcvp.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colors.text;
        ctx.fillText(displayText, node.x, node.y);

    }, [selectedNode, hoverNode, edgeSource, colors, mcvp]);

    return (
        <div>
            {/*Instructions*/}
            <div style={{ textAlign: 'center', margin: '5px', minHeight: '24px', color: 'var(--color-grey-medium)' }}>
                {addingEdge && edgeSource && `Přidávání hrany z uzlu ${edgeSource.id}. Klikněte na cílový uzel nebo na pozadí pro zrušení.`}
                {selectedNode && !addingEdge && `Uzel ${selectedNode.id} vybrán.`}
                {!selectedNode && !addingEdge && 'Klikněte na pozadí pro zrušení výběru. Klikněte na uzel pro výběr.'}
            </div>

            {/* ForceGraph Canvas */}
            <div className="GraphDiv" ref={containerRef}>
                <div className="graph-controls">
                  <button 
                    className="graph-btn" 
                    onClick={() => fgRef.current?.zoomToFit(400, 50)}
                    title="Fit Graph to Screen"
                  >
                    Vycentrovat
                  </button>
                </div>
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    // Layout
                    dagMode="td" // Top-down layout
                    dagLevelDistance={mcvp.dagLevelDistance} // Distance between levels
                    cooldownTime={mcvp.cooldownTime} // Stop simulation sooner
                    d3AlphaDecay={0.05} // Faster decay
                    d3VelocityDecay={0.4}
                    // Nodes
                    nodeRelSize={mcvp.nodeRadius} // Use fixed radius for consistency
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
                    enablePanInteraction={true}
                    enableZoomInteraction={true}
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
        </div>
    );
}

InteractiveMCVPGraph.propTypes = {
    onTreeUpdate: PropTypes.func
};