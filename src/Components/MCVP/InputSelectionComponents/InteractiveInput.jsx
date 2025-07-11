import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NODE_R = 12; 
const outerCircleColor = '#07393C';
const innerCircleColor = '#438c96'; 
const selectedColor = '#FFB74D'; 
const textColor = '#F0EDEE'; 

export function InteractiveMCVPGraph() {
    const [graph, setGraph] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [addingEdge, setAddingEdge] = useState(false);
    const [edgeSource, setEdgeSource] = useState(null);
    const [hoverNode, setHoverNode] = useState(null); // For hover effects
    const fgRef = useRef(); // Ref for accessing ForceGraph methods
    const nextNodeIdRef = useRef(0);
    
    // Generate unique ID function 
    const generateNodeId = useCallback(() => {
        const id = nextNodeIdRef.current;
        nextNodeIdRef.current += 1;
        return id;
    }, []);

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
        console.log("Graph Data:", graph.nodes, linksWithNodeRefs);
        return { nodes: graph.nodes, links: linksWithNodeRefs };
    }, [graph]);

    // Add initial node if graph is empty
    useEffect(() => {
        if (graph.nodes.length === 0) {
            addNode('operation', 'O'); // Add a default operation node
        }
    }, [graph.nodes]);

    // --- Core Graph Functions ---

    const addNode = (type, value = null, varValue = null) => {
        const newId = generateNodeId();
        let newNode;

        if (type === 'var') {
            newNode = {
                id: newId,
                type: 'variable',
                // Assign a default variable name 
                value: value || `x${newId}`, 
                varValue: varValue === null ? 0 : varValue, 
            };
        } else { // Operation
            newNode = {
                id: newId,
                type: 'operation',
                value: value, // 'A' or 'O'
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
        setGraph(prevGraph => ({ // Remove links and node itself
            nodes: prevGraph.nodes.filter(node => node.id !== nodeId),
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
            (link.source === sourceId && link.target === targetId) 
            //|| (link.source === targetId && link.target === sourceId) 
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
                !(link.source === sourceId && link.target === targetId) 
                //&& !(link.source === targetId && link.target === sourceId) 
            ),
        }));
    };

    const updateNodeValue = (nodeId, updates) => {
         setGraph(prevGraph => ({
             nodes: prevGraph.nodes.map(node => {
                 if (node.id === nodeId) {
                     // Create a new object with updated properties
                     const updatedNode = { ...node, ...updates };

                     if (updatedNode.type === 'operation') {
                         updatedNode.varValue = null;
                     } else if (updatedNode.type === 'variable' && updatedNode.varValue === null) {
                        updatedNode.value = `x${nodeId}`; // Default variable name if switching type
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

    const handleNodeClick = useCallback((node) => {
        if (addingEdge && edgeSource) {
            // Complete adding edge
            if (edgeSource.id !== node.id) {
                addEdge(edgeSource.id, node.id);
            }
            setAddingEdge(false);
            setEdgeSource(null);
            setSelectedNode(node); // Select the target node after adding edge // CHECK AFTER REFACTORING IF IS NOT BS
        } else {
            setSelectedNode(node);
        }
    }, [addingEdge, edgeSource]); 

    const handleBackgroundClick = useCallback(() => {
        if (addingEdge) {
            // Cancel adding edge
            setAddingEdge(false);
            setEdgeSource(null);
        }
        setSelectedNode(null); // Deselect node
    }, [addingEdge]); 

    const startAddEdge = () => {
        if (selectedNode) {
            setAddingEdge(true);
            setEdgeSource(selectedNode); // Store the actual selected node object
            setSelectedNode(null); // Deselect node while adding edge
        }
    };

    // Check if a node has any children 
    const hasChildren = (nodeId) => {
    return graph.links.some(link => link.source === nodeId);
    };

    // --- Canvas/Rendering Functions ---

    const paintNode = useCallback((node, ctx) => {
        const radius = NODE_R;
        const isSelected = selectedNode && node.id === selectedNode.id;
        const isHovered = hoverNode && node.id === hoverNode.id;
        const isEdgeSource = edgeSource && node.id === edgeSource.id;

        // Draw the main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = (isSelected || isEdgeSource) ? selectedColor : innerCircleColor;
        ctx.fill();

        ctx.strokeStyle = outerCircleColor;
        ctx.stroke();

        // Draw outline if selected/hovered/source
         if (isSelected || isHovered || isEdgeSource) {
            ctx.strokeStyle = '#90DDF0'; //'#FFCC80' Lighter orange outline
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
        const fontSize = 12;
        ctx.font = `monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText(displayText, node.x, node.y);

        // node.__bckgDimensions = ctx.measureText(displayText).width + 4; // Save for potential hover detection if needed

    }, [selectedNode, hoverNode, edgeSource]); // Dependencies

    // --- JSX ---
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
            <div className='mt-2 pb-2'>
                <button className="btn add-btn mx-1" onClick={() => addNode('op', 'A')}>Přidat AND uzel</button>
                <button className="btn add-btn mx-1" onClick={() => addNode('op', 'O')}>Přidat OR uzel</button>
                <button className="btn add-btn mx-1" onClick={() => addNode('var')}>Přidat uzel s proměnou</button>
                {/* Add buttons to center view */}
            </div>

            {/* Selected Node Controls */}
            {selectedNode && !addingEdge && (
                <div className="p-4 my-3" style={{ border: '1px solid #eee', borderRadius: '4px'}}>
                    <h5>Selected Node: {selectedNode.value === 'O' ? "OR" : selectedNode.value === 'A' ? "AND" : selectedNode.value}</h5>
                    <div className="d-flex flex-wrap justify-content-center align-items-center">
                        {/* Type/Value Change */}
                         {selectedNode.type === 'operation' && (
                            <>
                            <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { value: 'A' })}>Nastavit na AND</button>
                            <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { value: 'O' })}>Nastavit na OR</button>
                            {!hasChildren(selectedNode.id) && (
                                <button className="btn add-btn mx-1" onClick={() => updateNodeValue(selectedNode.id, { type: 'variable' })}>
                                    To Variable
                                </button>
                            )}
                            <button className="btn btn-success mx-1" onClick={startAddEdge}>Connect Node</button>
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
                          <h6>Connected Edges:</h6>
                          <div className="d-flex flex-wrap justify-content-center">
                              {graph.links
                                  .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
                                  .map((link, index) => {
                                      const connectedNodeId = link.source === selectedNode.id ? link.target : link.source;
                                      
                                      // Find the node object for display
                                      const connectedNode = graph.nodes.find(node => node.id === connectedNodeId);
                                      
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
                                                      onClick={() => deleteEdge(link.source, link.target)}>
                                                  Hrana k {displayText} &times;
                                              </button>
                                          </div>
                                      );
                                  })
                              }
                              {graph.links.filter(link => link.source === selectedNode.id || link.target === selectedNode.id).length === 0 && (
                                  <small className="text-muted">Žádné hrany.</small>
                              )}
                          </div>
                      </div>
                </div>
            )}
        </div>
    );
}