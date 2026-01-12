import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphColors } from '../../../Hooks/useGraphColors';
import { useGraphSettings } from '../../../Hooks/useGraphSettings';
import { toast } from 'react-toastify';

export function ManualInput({ initialGraph, onGraphUpdate, analysisResult, optimalMoves }) {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);  // Track selected node
  const [addingEdge, setAddingEdge] = useState(false);     // Track if in edge adding mode
  const [edgeSource, setEdgeSource] = useState(null);      // Track source node for edge
  const [startingNodeId, setStartingNodeId] = useState(null); // Track starting node ID, initialized to null
  const fgRef = useRef(); // Reference to ForceGraph component
  const containerRef = useRef(); // Reference to the graph container div
  const isInternalUpdate = useRef(false); // Track if update originated internally
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { game } = settings;

  // Map to store node references
  const nodeMap = useMemo(() => {
    const map = {};
    graph.nodes.forEach(node => {
      map[node.id] = node;
    });
    return map;
  }, [graph.nodes]);

  // Derived state: Formatted graph for analysis and parent update
  const formattedGraph = useMemo(() => {
    if (!graph || graph.nodes.length === 0 || !startingNodeId) return null; // Require startingNodeId

    const startNode = graph.nodes.find(node => node.id === startingNodeId);
    if (!startNode) return null; // Starting node must exist

    return {
      positions: graph.nodes.reduce((acc, node) => {
        acc[node.id] = {
          id: node.id,
          player: node.player,
          children: graph.links
            .filter(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                return sourceId === node.id;
            })
            .map(link => typeof link.target === 'object' ? link.target.id : link.target),
          parents: graph.links
            .filter(link => {
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                return targetId === node.id;
            })
            .map(link => typeof link.source === 'object' ? link.source.id : link.source)
        };
        return acc;
      }, {}),
      startingPosition: startNode // Pass the full starting node object
    };
  }, [graph, startingNodeId]);

  // ResizeObserver for responsive graph and color updates
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
        if (!containerRef.current) return;
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

  // Initialize from initialGraph if provided
  useEffect(() => {
    // Prevent infinite loop if update came from this component
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (initialGraph && initialGraph.positions) {
      const newNodes = [];
      const newLinks = [];
      
      // Convert positions object to nodes array
      Object.values(initialGraph.positions).forEach(pos => {
        newNodes.push({
          id: String(pos.id),
          player: pos.player,
          x: pos.x, // Preserve coordinates if available
          y: pos.y,
          neighbors: [] // Will be populated by force-graph or logic
        });
      });

      // Create links from children
      Object.values(initialGraph.positions).forEach(pos => {
        if (pos.children) {
          pos.children.forEach(childId => {
            // Check if target node exists
            if (initialGraph.positions[childId]) {
              newLinks.push({
                source: String(pos.id),
                target: String(childId)
              });
            }
          });
        }
      });

      setGraph({ nodes: newNodes, links: newLinks });
      
      // Set starting position from initial graph
      if (initialGraph.startingPosition) {
        setStartingNodeId(String(initialGraph.startingPosition.id || initialGraph.startingPosition));
      }
    } else if (initialGraph && (initialGraph.nodes || initialGraph.edges)) {
        // Handle flat format (nodes, edges/links)
        const newNodes = (initialGraph.nodes || []).map(n => ({
            ...n,
            id: String(n.id),
            player: n.player !== undefined ? n.player : 1, // Default to player 1 if missing
            neighbors: []
        }));
        
        const edges = initialGraph.edges || initialGraph.links || [];
        const newLinks = edges.map(l => ({
            source: String(l.source.id || l.source),
            target: String(l.target.id || l.target)
        }));

        setGraph({ nodes: newNodes, links: newLinks });

        if (initialGraph.startingPosition) {
            setStartingNodeId(String(initialGraph.startingPosition.id || initialGraph.startingPosition));
        }
    }
  }, [initialGraph]);

  // Effect to notify parent about graph updates
  useEffect(() => {
      if (onGraphUpdate && formattedGraph) {
          isInternalUpdate.current = true; // Mark as internal update
          onGraphUpdate(formattedGraph);
      } else if (onGraphUpdate && !formattedGraph) {
          onGraphUpdate(null); // Notify parent if graph is not valid for analysis
      }
  }, [formattedGraph, onGraphUpdate]);

  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    return { 
      nodes: graph.nodes, 
      links: graph.links 
    };
  }, [graph]);

  // Add the first node when the component loads ONLY if empty and no initial graph
  useEffect(() => {
    if (!initialGraph && graph.nodes.length === 0) {
      setGraph(prevGraph => {
        if (prevGraph.nodes.length === 0) { // Only add if it's still empty
          const newId = "0"; // First node ID
          const newNode = { id: newId, player: 1, neighbors: [] };
          // Automatically set the first node as starting node
          setStartingNodeId(newId);
          return {
            nodes: [newNode],
            links: []
          };
        }
        return prevGraph;
      });
    }
  }, [initialGraph, graph]); 

  // Function to add a node
  const addNode = () => {
    // console.log("Adding node...");
    if (graph.nodes.length >= 750) {
        toast.error("Dosažen limit 750 uzlů.");
        return;
    }

    const maxId = graph.nodes.reduce((max, node) => {
        const idNum = parseInt(node.id, 10);
        return isNaN(idNum) ? max : Math.max(max, idNum);
    }, -1);
    const newId = (maxId + 1).toString();

    const newNode = {
      id: newId,
      player: 1, 
      neighbors: [],
    };

    setGraph(prevGraph => ({
      nodes: [...prevGraph.nodes, newNode],
      links: [...prevGraph.links],
    }));

    // If no starting node is set, set the first added node as starting
    if (!startingNodeId) {
        setStartingNodeId(newId);
    }
  };

  // Function to delete a node and its associated edges
  const deleteNode = (nodeId) => {
    const updatedNodes = graph.nodes.filter(node => node.id !== nodeId);
    const updatedLinks = graph.links.filter(link => 
      link.source.id !== nodeId && link.target.id !== nodeId
    );

    setGraph({
      nodes: updatedNodes,
      links: updatedLinks,
    });
    setSelectedNode(null);
    setAddingEdge(false);

    // If the deleted node was the starting node, clear startingNodeId
    if (startingNodeId === nodeId) {
        setStartingNodeId(null);
        // If there are other nodes, try to set a new starting node automatically
        if (updatedNodes.length > 0) {
            setStartingNodeId(updatedNodes[0].id);
        }
    }
  };

  // Function to check if an edge already exists between two nodes
  const edgeExists = (sourceId, targetId) => {
    return graph.links.some(link => 
      link.source.id === sourceId && link.target.id === targetId
    );
  };

  // Function to add an edge between two nodes
  const addEdge = (sourceId, targetId) => {
    // Don't allow self-loops or duplicate edges
    if (sourceId === targetId) {
      toast.error("Nelze přidat hranu: Smyčky (hrany z uzlu na sebe sama) nejsou povoleny.");
      return false;
    }
    if (edgeExists(sourceId, targetId)) {
      toast.error("Nelze přidat hranu: Hrana mezi těmito uzly již existuje.");
      return false;
    }

    const source = nodeMap[sourceId];
    const target = nodeMap[targetId];

    if (!source || !target) {
        toast.error("Nelze přidat hranu: Zdrojový nebo cílový uzel nebyl nalezen.");
        return false;
    }

    const newLink = {
      source: source,
      target: target,
    };

    setGraph(prevGraph => ({
      nodes: prevGraph.nodes,
      links: [...prevGraph.links, newLink],
    }));
    return true;
  };

  // Function to delete an edge between two nodes
  const deleteEdge = (sourceId, targetId) => {
    const updatedLinks = graph.links.filter(link =>
      !(link.source.id === sourceId && link.target.id === targetId)
    );
  
    setGraph({
      nodes: graph.nodes,
      links: updatedLinks,
    });
  };

  // Start the edge adding process
  const startAddEdge = () => {
    if (selectedNode) {
      setAddingEdge(true);
      setEdgeSource(selectedNode);
    }
  };

  // Cancel the edge adding process
  const cancelAddEdge = () => {
    setAddingEdge(false);
    setEdgeSource(null);
  };

  // Handle hover on nodes
  const handleNodeHover = useCallback((node) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (node) {
      newHighlightNodes.add(node);
      if (node.neighbors) {
        node.neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
      }
    }

    setHoverNode(node || null);
    setHighlightLinks(newHighlightLinks); 

    if (containerRef.current) {
        containerRef.current.style.cursor = node ? 'pointer' : 'grab';
    }
  }, []);

  const handleLinkHover = useCallback((link) => {
    if (containerRef.current) {
        containerRef.current.style.cursor = link ? 'pointer' : 'grab';
    }
  }, []);

  // Highlighted node and edges styling
  const paintRing = useCallback((node, ctx) => {
    const radius = game.nodeRadius; 
    
    const isSelected = selectedNode && node.id === selectedNode.id;
    const isHovered = hoverNode && node.id === hoverNode.id;
    const isEdgeSource = addingEdge && edgeSource && edgeSource.id === node.id;

    // 1. Draw the main node circle path
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

    // 2. Determine fill color
    let fillColor;
    if (isSelected || isEdgeSource) {
        fillColor = colors.selected; // Fill if selected or is the source for adding an edge
    } else if (String(node.id) === String(startingNodeId)){
        fillColor = colors.accentRed; // Red for starting position
    } else {
        fillColor = colors.defaultNode; // Default fill color
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 3. Always draw an outer circle stroke
    ctx.strokeStyle = colors.outerCircle;
    ctx.lineWidth = 0.5; 
    ctx.stroke();

    // 4. Override stroke for selected, hovered, or edge source (thicker, highlight color)
    if (isSelected || isHovered || isEdgeSource) {
        ctx.strokeStyle = colors.highlightNode; // Highlight color for border
        ctx.lineWidth = 1; // Thicker border for highlight
        ctx.stroke();
    }
    
    // 5. Draw player label
    ctx.font = game.labelFont;
    ctx.fillStyle = 'black'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player === 1 ? 'I' : 'II', node.x, node.y + radius + 10);
  }, [hoverNode, addingEdge, edgeSource, colors, startingNodeId, game, selectedNode]);

  // Display the label for links
  const getLinkLabel = useCallback((link) => {
    if (!selectedNode) return '';
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    if (sourceId === selectedNode.id) {
      return `${targetId}`;
    } else if (targetId === selectedNode.id) {
      return `${sourceId}`;
    }
    
    return ''; // No label for edges not connected to selected node
  }, [selectedNode]);

  // Paint link labels
  const paintLink = useCallback((link, ctx, globalScale) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    // Only label links connected to selected node
    if (selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)) {
      const start = link.source;
      const end = link.target;
      
      // Calculate position for the label (midpoint of the link)
      const textPos = {
        x: start.x + (end.x - start.x) * 0.5,
        y: start.y + (end.y - start.y) * 0.5
      };
      
      // Get ID of the connected node (not the selected one)
      const connectedId = sourceId === selectedNode.id ? targetId : sourceId; 
      
      // Draw a background for better visibility
      const label = `${connectedId}`;
      const fontSize = 4 + 1/globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        textPos.x - bckgDimensions[0] / 2, 
        textPos.y - bckgDimensions[1] / 2, 
        ...bckgDimensions
      );
      
      // Draw text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(label, textPos.x, textPos.y);
    }
  }, [selectedNode]);

  // Handle node click for editing/deleting actions
  const handleNodeClick = (node) => {
    if (addingEdge) {
      // If adding an edge and click a different node, create the edge
      if (edgeSource && node.id !== edgeSource.id) {
        const success = addEdge(edgeSource.id, node.id);
        if (success) {
          setAddingEdge(false);
          setEdgeSource(null);
        }
      } else {
        // If we click the same node, cancel the operation
        cancelAddEdge();
      }
    } else {
      setSelectedNode(node);
    }
  };

  // Handle background click
  const handleBackgroundClick = () => {
    if (addingEdge) {
      cancelAddEdge();
    } else {
      setSelectedNode(null);
    }
    
  };
  const changePlayer = () => {
    if (selectedNode) {
      setGraph(prevGraph => {
        // Find the node and change its property directly
        const node = prevGraph.nodes.find(n => n.id === selectedNode.id);
        if (node) {
          node.player = node.player === 1 ? 2 : 1;
        }
        // Return a new graph object, but with the same node references
        return { ...prevGraph, nodes: [...prevGraph.nodes] };
      });
      // Update selectedNode to match the new state
      setSelectedNode(prev => (prev ? { ...prev, player: prev.player === 1 ? 2 : 1 } : prev));
      
      if (fgRef.current) {
        fgRef.current.d3ReheatSimulation();
      }
    }
  };

  const setAsStartingNode = () => {
    if (selectedNode) {
        setStartingNodeId(selectedNode.id);
        toast.success(`Uzel ${selectedNode.id} nastaven jako startovní.`);
    }
  };

  const isEdgeOptimal = useCallback((link) => {
      if (!optimalMoves) return false;
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return optimalMoves.has(`${sourceId}-${targetId}`);
  }, [optimalMoves]);

  return (
    <>
    <div className="GraphDiv mb-3 shadow-sm" ref={containerRef}>
      <div className="graph-controls">
        <button 
          className="graph-btn" 
          onClick={() => fgRef.current?.zoomToFit(400, 50)}
          title="Fit Graph to Screen"
        >
          Vycentrovat
        </button>
      </div>
      {addingEdge && (
        <div className="manual-input-instruction">
          Vyberte uzel pro přidání hrany. Klikněte na pozadí pro zrušení.
        </div>
      )}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        graphData={data}
        nodeRelSize={game.nodeRadius}
        autoPauseRedraw={false}
        linkWidth={link => isEdgeOptimal(link) ? 5 : 3}
        linkColor={link => isEdgeOptimal(link) ? colors.accentYellow : colors.defaultLink} 
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={0} 
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => 'rgba(0,0,0,0.6)'}
        linkLabel={getLinkLabel}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={paintRing}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        onNodeClick={handleNodeClick}  
        onBackgroundClick={handleBackgroundClick} 
      />
    </div>
    
    <div className="d-flex justify-content-center my-3">
        <button className="btn-control" onClick={addNode}>Přidat uzel</button>
    </div>

    {/* Two-column layout container */}
    <div className="row g-4 mb-5">
        {/* Left column: Analysis results */}
        <div className="col-md-6">
            <div className="card h-100 shadow-sm">
                <div className="card-header bg-light fw-bold">
                    Analýza hry
                </div>
                <div className="card-body text-center d-flex flex-column justify-content-center">
                    {analysisResult ? (
                        <>
                            <div className={`alert ${analysisResult.hasWinningStrategy ? 'alert-success' : 'alert-warning'}`}>
                                {analysisResult.message}
                            </div>
                            <p className="text-muted small mb-0">
                                Zlatě vyznačené hrany představují optimální tahy pro Hráče I.
                            </p>
                        </>
                    ) : (
                        <p className="text-muted text-center my-auto">
                           Definujte graf a startovní pozici pro zobrazení analýzy.
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Right column: Graph controls */}
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
                                <button className="btn btn-primary btn-sm" onClick={changePlayer}>Změnit hráče</button>
                                <button className="btn btn-info btn-sm" onClick={setAsStartingNode}>Nastavit jako startovní</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteNode(selectedNode.id)}>Smazat uzel</button>
                                <button className="btn btn-success btn-sm" onClick={startAddEdge}>Přidat hranu</button>
                            </div>
                            
                            {/* List of connected nodes with delete buttons */}
                            <div>
                                <h6 className="mb-2">Propojené uzly:</h6>
                                <div className="d-flex flex-wrap gap-2 justify-content-center">
                                    {graph.links
                                        .filter(link => {
                                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                            return sourceId === selectedNode.id || targetId === selectedNode.id;
                                        })
                                        .map((link, index) => {
                                            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                            const connectedNodeId = sourceId === selectedNode.id ? targetId : sourceId;
                                            
                                            return (
                                                <button 
                                                    key={index}
                                                    className="btn btn-outline-danger btn-sm" 
                                                    onClick={() => deleteEdge(sourceId, targetId)}
                                                >
                                                    Smazat hranu {connectedNodeId}
                                                </button>
                                            );
                                        })
                                    }
                                    {graph.links.filter(link => {
                                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                        return sourceId === selectedNode.id || targetId === selectedNode.id;
                                    }).length === 0 && 
                                        <span className="text-muted small">Žádné hrany</span>
                                    }
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
    </>
  );
}

ManualInput.propTypes = {
  initialGraph: PropTypes.object,
  onGraphUpdate: PropTypes.func,
  analysisResult: PropTypes.object,
  optimalMoves: PropTypes.object
};