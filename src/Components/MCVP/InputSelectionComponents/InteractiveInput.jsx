import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// --- Configuration ---
const NODE_R = 12; // Slightly larger radius for better visibility
const operationColor = '#07393C'; // Dark teal for operations
const variableColor = '#438c96'; // Lighter teal for variables
const selectedColor = '#FFB74D'; // Orange for selection highlight
const nodeTextColor = '#F0EDEE'; // Light text color

// Helper to generate unique IDs (simple version)
let nextNodeId = 0;
const generateNodeId = () => `n${nextNodeId++}`;

// --- New Interactive Component using ForceGraph2D ---
export function InteractiveMCVPGraph() {
    // --- State ---
    const [graph, setGraph] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [addingEdge, setAddingEdge] = useState(false);
    const [edgeSource, setEdgeSource] = useState(null);
    const [hoverNode, setHoverNode] = useState(null); // For hover effects
    const fgRef = useRef(); // Ref for accessing ForceGraph methods

    // --- Derived Data ---
    // Memoize graph data for ForceGraph2D
    const graphData = useMemo(() => {
        // Make sure links reference the actual node objects for the library
        const nodeMap = graph.nodes.reduce((acc, node) => {
            acc[node.id] = node;
            return acc;
        }, {});
        const linksWithNodeRefs = graph.links.map(link => ({
            ...link,
            source: nodeMap[link.source] || link.source, // Use node object or ID if not found
            target: nodeMap[link.target] || link.target, // Use node object or ID if not found
        }));
        return { nodes: graph.nodes, links: linksWithNodeRefs };
    }, [graph]);

    // --- Effects ---
    // Add initial node if graph is empty
    useEffect(() => {
        if (graph.nodes.length === 0) {
            // Add a default root node (e.g., an OR operation)
            addNode('O');
        }
    }, [graph.nodes]); // Dependency: runs only when node count changes from 0

    // --- Core Graph Functions ---

    const addNode = (type, value = null, varValue = null) => {
        const newId = generateNodeId();
        let newNode;

        if (type === 'variable') {
            newNode = {
                id: newId,
                type: 'variable',
                // Assign a default variable name if needed, or require it
                value: value || `x${newId.substring(1)}`, // Simple default like 'x1'
                varValue: varValue === null ? 0 : varValue, // Default variable value to 0
            };
        } else { // Operation
            newNode = {
                id: newId,
                type: 'operation',
                value: type, // 'A' or 'O'
                varValue: null,
            };
        }

        setGraph(prevGraph => ({
            nodes: [...prevGraph.nodes, newNode],
            links: prevGraph.links, // Links remain unchanged
        }));
        return newNode; // Return the new node
    };

    const deleteNode = (nodeId) => {
        setGraph(prevGraph => ({
            nodes: prevGraph.nodes.filter(node => node.id !== nodeId),
            // Remove links connected to the deleted node
            links: prevGraph.links.filter(link => link.source !== nodeId && link.target !== nodeId)
        }));
        // Clear selection if the deleted node was selected
        if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(null);
        }
        setAddingEdge(false); // Cancel edge adding if active
        setEdgeSource(null);
    };

    const edgeExists = (sourceId, targetId) => {
        return graph.links.some(link =>
            (link.source === sourceId && link.target === targetId) ||
            (link.source === targetId && link.target === sourceId) // Check both directions if undirected
        );
    };

    const addEdge = (sourceId, targetId) => {
        if (sourceId === targetId || edgeExists(sourceId, targetId)) {
            console.warn("Edge already exists or is a self-loop.");
            return false; // Prevent self-loops and duplicate edges
        }

        const newLink = {
            source: sourceId, // Store IDs in state
            target: targetId,
        };

        setGraph(prevGraph => ({
            nodes: prevGraph.nodes,
            links: [...prevGraph.links, newLink],
        }));
        return true;
    };

    const deleteEdge = (sourceId, targetId) => {
        setGraph(prevGraph => ({
            nodes: prevGraph.nodes,
            // Filter out the link (consider both directions if needed, depends on graph type)
            links: prevGraph.links.filter(link =>
                !(link.source === sourceId && link.target === targetId) &&
                !(link.source === targetId && link.target === sourceId) // Remove if considering undirected
            ),
        }));
    };

    const updateNodeValue = (nodeId, updates) => {
         setGraph(prevGraph => ({
             nodes: prevGraph.nodes.map(node => {
                 if (node.id === nodeId) {
                     // Create a new object with updated properties
                     const updatedNode = { ...node, ...updates };

                     // Ensure consistency (e.g., operations don't have varValue)
                     if (updatedNode.type === 'operation') {
                         updatedNode.varValue = null;
                     } else if (updatedNode.type === 'variable' && updatedNode.varValue === null) {
                         updatedNode.varValue = 0; // Default variable value if switching type
                     }
                     return updatedNode;
                 }
                 return node;
             }),
             links: prevGraph.links // Links remain the same
         }));
         // Update selectedNode state as well if the updated node was selected
         if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(prevSelNode => ({ ...prevSelNode, ...updates }));
         }
     };


    // --- Interaction Handlers ---

    const handleNodeClick = useCallback((node, event) => {
        if (addingEdge && edgeSource) {
            // Complete adding edge
            if (edgeSource.id !== node.id) {
                addEdge(edgeSource.id, node.id);
            }
            setAddingEdge(false);
            setEdgeSource(null);
            setSelectedNode(node); // Select the target node after adding edge
        } else {
            // Select node
            setSelectedNode(node);
        }
    }, [addingEdge, edgeSource]); // Dependencies

    const handleBackgroundClick = useCallback(() => {
        if (addingEdge) {
            // Cancel adding edge
            setAddingEdge(false);
            setEdgeSource(null);
        }
        setSelectedNode(null); // Deselect node
    }, [addingEdge]); // Dependency

    const startAddEdge = () => {
        if (selectedNode) {
            setAddingEdge(true);
            setEdgeSource(selectedNode); // Store the actual selected node object
            setSelectedNode(null); // Deselect node while adding edge
        }
    };

    // --- Canvas/Rendering Functions ---

    const paintNode = useCallback((node, ctx, globalScale) => {
        const radius = NODE_R;
        const isSelected = selectedNode && node.id === selectedNode.id;
        const isHovered = hoverNode && node.id === hoverNode.id;
        const isEdgeSource = edgeSource && node.id === edgeSource.id;

        // Determine fill color
        let fillColor = node.type === 'variable' ? variableColor : operationColor;
        if (isSelected || isEdgeSource) {
            fillColor = selectedColor;
        }

        // Draw the main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Draw outline if selected/hovered/source
         if (isSelected || isHovered || isEdgeSource) {
            ctx.lineWidth = 2 / globalScale;
            ctx.strokeStyle = '#FFCC80'; // Lighter orange outline
            ctx.stroke();
         }

        // Determine text to display
        let displayText = '';
        if (node.type === 'variable') {
            displayText = `${node.value}[${node.varValue}]`;
        } else { // Operation
            displayText = node.value === 'A' ? 'AND' : (node.value === 'O' ? 'OR' : node.value); // Handle 'A'/'O' or others
        }

        // Draw text
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = nodeTextColor;
        ctx.fillText(displayText, node.x, node.y);

        node.__bckgDimensions = ctx.measureText(displayText).width + 4 /globalScale; // Save for potential hover detection if needed

    }, [selectedNode, hoverNode, edgeSource]); // Dependencies

    // --- JSX ---
    return (
        <div>
            {/* Instructions/Status Bar */}
            <div style={{ textAlign: 'center', margin: '5px', minHeight: '24px', color: '#666' }}>
                {addingEdge && edgeSource && `Adding edge from node ${edgeSource.id}. Click target node or background to cancel.`}
                {selectedNode && !addingEdge && `Node ${selectedNode.id} selected.`}
                {!selectedNode && !addingEdge && 'Click background to deselect. Click node to select.'}
            </div>

            {/* ForceGraph Canvas */}
            <div className="GraphDiv" style={{ border: '1px solid #ccc', borderRadius: '4px', margin: '10px 0' }}>
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
                    linkSource="source"
                    linkTarget="target"
                    linkColor={() => 'rgba(0,0,0,0.4)'}
                    linkWidth={1}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
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
            <div style={{ textAlign: "center", margin: "10px" }}>
                <button className="btn btn-secondary mx-1" onClick={() => addNode('A')}>Add AND Node</button>
                <button className="btn btn-secondary mx-1" onClick={() => addNode('O')}>Add OR Node</button>
                <button className="btn btn-secondary mx-1" onClick={() => addNode('variable')}>Add Variable Node</button>
                {/* Add buttons to center view, zoom etc. if needed */}
            </div>

            {/* Selected Node Controls */}
            {selectedNode && !addingEdge && (
                <div style={{ border: '1px solid #eee', padding: '15px', margin: '10px 0', borderRadius: '4px' }}>
                    <h5>Selected Node: {selectedNode.id}</h5>
                    <div className="d-flex flex-wrap justify-content-center align-items-center">
                        {/* Type/Value Change */}
                         {selectedNode.type === 'operation' && (
                            <>
                            <button className="btn btn-outline-primary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { value: 'A' })}>Set AND</button>
                            <button className="btn btn-outline-primary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { value: 'O' })}>Set OR</button>
                            <button className="btn btn-outline-secondary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'variable' })}>To Variable</button>
                            </>
                         )}
                         {selectedNode.type === 'variable' && (
                             <>
                             <button className="btn btn-outline-primary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { varValue: 0 })}>Set Value [0]</button>
                             <button className="btn btn-outline-primary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { varValue: 1 })}>Set Value [1]</button>
                             <button className="btn btn-outline-secondary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'operation', value: 'A'})}>To AND</button>
                             <button className="btn btn-outline-secondary btn-sm m-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'operation', value: 'O'})}>To OR</button>
                             </>
                         )}
                         {/* General Actions */}
                        <button className="btn btn-success btn-sm m-1" onClick={startAddEdge}>Connect Node</button>
                        <button className="btn btn-danger btn-sm m-1" onClick={() => deleteNode(selectedNode.id)}>Delete Node</button>
                    </div>

                     {/* List connected edges for deletion */}
                      <div style={{ marginTop: "10px" }}>
                          <h6>Connected Edges:</h6>
                          <div className="d-flex flex-wrap justify-content-center">
                              {graph.links
                                  .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
                                  .map((link, index) => {
                                      const connectedNodeId = link.source === selectedNode.id ? link.target : link.source;
                                      return (
                                          <div key={`${link.source}-${link.target}-${index}`} className="m-1">
                                              <button
                                                  className="btn btn-outline-danger btn-sm"
                                                  onClick={() => deleteEdge(link.source, link.target)}
                                                  title={`Delete edge between ${link.source} and ${link.target}`}
                                              >
                                                  Edge to {connectedNodeId} &times;
                                              </button>
                                          </div>
                                      );
                                  })
                              }
                              {graph.links.filter(link => link.source === selectedNode.id || link.target === selectedNode.id).length === 0 && (
                                  <small className="text-muted">No connections</small>
                              )}
                          </div>
                      </div>
                </div>
            )}
        </div>
    );
}