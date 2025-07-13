import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { computeWinner, getOptimalMoves } from '../Utils/ComputeWinner';
import ForceGraph2D from 'react-force-graph-2d';

const color1 = '#438c96'; 
const color4 = '#90DDF0';
const startingColor = '#FF6347';
const optimalLinkColor = '#FFD700'; 
const defaultLinkColor = '#999'; 

export function ManualInput() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [nodeMap, setNodeMap] = useState({}); // Map to store node references to nodes
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);  // Track selected node
  const [addingEdge, setAddingEdge] = useState(false);     // Track if in edge adding mode
  const [edgeSource, setEdgeSource] = useState(null);      // Track source node for edge
  const fgRef = useRef();
  
  // State to store analysis results
  const [analysisResult, setAnalysisResult] = useState(null);
  const [optimalMoves, setOptimalMoves] = useState({});

  const NODE_R = 8;

  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    const linksWithOptimal = graph.links.map(link => {
      const sourceId = link.source.id;
      const targetId = link.target.id;
      const isOptimal = optimalMoves[sourceId] === targetId;  // Check if this link represents an optimal move
      return { ...link, isOptimal };
    });

    return { 
      nodes: graph.nodes, 
      links: linksWithOptimal 
    };
  }, [graph, optimalMoves]);

  // Add the first node when the component loads
  useEffect(() => {
    if (graph.nodes.length === 0) {
      addNode(); // Add the first node for Player 1 on initial load
    }
  }, [graph.nodes]);

  // Update the nodeMap whenever the graph nodes change
  useEffect(() => {
    const newNodeMap = {};
    graph.nodes.forEach(node => {
      newNodeMap[node.id] = node;
    });
    setNodeMap(newNodeMap);
  }, [graph.nodes]);

  // Analyze the graph when it changes
  useEffect(() => {
    if (graph && graph.nodes.length > 0) {
      // Convert graph to format expected by ComputeWinner
      const formattedGraph = {
        positions: graph.nodes.reduce((acc, node) => {
          acc[node.id] = {
            id: node.id,
            player: node.player,
            children: graph.links
              .filter(link => link.source.id === node.id)
              .map(link => link.target.id),
            parents: graph.links
              .filter(link => link.target.id === node.id)
              .map(link => link.source.id)
          };
          return acc;
        }, {}),
        startingPosition: graph.nodes.find(node => node.id === "0")
      };
      
      const result = computeWinner(formattedGraph);
      const moves = getOptimalMoves(formattedGraph);

      // debugging output
      console.log("Winning analysis:", result);
      console.log("Optimal moves:", moves);
      
      setAnalysisResult(result);
      setOptimalMoves(moves);
    }
  }, [graph]);

  // Refresh the graph when optimal moves change
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, [optimalMoves]);

  // Function to add a node
  const addNode = () => {
    const newId = graph.nodes.length.toString();
    const newNode = {
      id: newId,
      player: 1, 
      neighbors: [],
    };

    setGraph(prevGraph => ({
      nodes: [...prevGraph.nodes, newNode],
      links: [...prevGraph.links],
    }));
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
    if (sourceId === targetId || edgeExists(sourceId, targetId)) {
      return false;
    }

    const newLink = {
      source: nodeMap[sourceId],
      target: nodeMap[targetId],
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
      data.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          newHighlightLinks.add(link);
        }
      });
    }

    setHoverNode(node || null);
    setHighlightLinks(newHighlightLinks);
  }, [data]);

  // Highlighted node and edges styling
  const paintRing = useCallback((node, ctx) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);
    
    // Change color based on node state
    if (addingEdge && edgeSource && edgeSource.id === node.id) {
      ctx.fillStyle = color4; 
    } else if (node === hoverNode) {
      ctx.fillStyle = color4;
    } else if (node.id == 0){
      ctx.fillStyle = startingColor; 
    }else {
      ctx.fillStyle = color1;
    }
    
    ctx.fill();
    ctx.font = `8px monospace`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player === 1 ? 'I' : 'II', node.x, node.y + NODE_R + 10);
  }, [hoverNode, addingEdge, edgeSource]);

  // Display the label for links
  const getLinkLabel = useCallback((link) => {
    if (!selectedNode) return '';
    
    const sourceId = link.source.id;
    const targetId = link.target.id;

    if (sourceId === selectedNode.id) {
      return `${targetId}`;
    } else if (targetId === selectedNode.id) {
      return `${sourceId}`;
    }
    
    return ''; // No label for edges not connected to selected node
  }, [selectedNode]);

  // Paint link labels
  const paintLink = useCallback((link, ctx, globalScale) => {
    const sourceId = link.source.id;
    const targetId = link.target.id;

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

  return (
    <>
    <div className="GraphDiv">
      {addingEdge && (
        <div className="manual-input-instruction">
          Vyberte uzel pro přidání hrany. Klikněte na pozadí pro zrušení.
        </div>
      )}
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeRelSize={NODE_R}
        autoPauseRedraw={false}
        linkWidth={link => highlightLinks.has(link) ? 5 : 3}
        linkColor={link => link.isOptimal ? optimalLinkColor : defaultLinkColor} 
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => 'rgba(0,0,0,0.6)'}
        linkLabel={getLinkLabel}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={paintRing}
        onNodeHover={handleNodeHover}
        onLinkHover={handleNodeHover}
        onNodeClick={handleNodeClick}  
        onBackgroundClick={handleBackgroundClick} 
      />
    </div>
    <div style={{ textAlign: "center", margin: "10px" }}>
        <button className="btn add-btn mx-1" onClick={addNode}>Přidat uzel</button>
    </div>

    {/* Two-column layout container */}
    <div className="row mt-3 mb-5">
        {/* Left column: Analysis results */}
        <div className="col-md-6">
            <div className="card h-100">
                <div className="card-header">
                    <h4>Analýza hry</h4>
                </div>
                <div className="card-body">
                    {analysisResult ? (
                        <>
                            <div className={`alert ${analysisResult.hasWinningStrategy ? 'alert-success' : 'alert-warning'}`}>
                                {analysisResult.message}
                            </div>
                            <p className="text-muted">
                                Zlatě vyznačené hrany představují optimální tahy pro Hráče I.
                            </p>
                        </>
                    ) : (
                        <p className="text-muted">Přidejte více uzlů a propojte je pro analýzu.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right column: Graph controls */}
        <div className="col-md-6">
            <div className="card h-100">
                <div className="card-header">
                    <h4>Ovládání grafu</h4>
                </div>
                <div className="card-body">
                    {selectedNode && !addingEdge ? (
                        <>
                            <h5>Vybraný uzel: {selectedNode.id}</h5>
                            <div className="mb-3">
                                <button className="btn btn-primary mx-1" onClick={changePlayer}>Změnit hráče</button>
                                <button className="btn btn-danger mx-1" onClick={() => deleteNode(selectedNode.id)}>Smazat uzel</button>
                                <button className="btn btn-success mx-1" onClick={startAddEdge}>Přidat hranu</button>
                            </div>
                            
                            {/* List of connected nodes with delete buttons */}
                            <div>
                                <h5>Propojené uzly:</h5>
                                <div className="d-flex flex-wrap justify-content-center">
                                    {graph.links
                                        .filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
                                        .map((link, index) => {
                                            const connectedNodeId = link.source.id === selectedNode.id ? link.target.id : link.source.id;
                                            
                                            return (
                                                <div key={index} className="m-1">
                                                    <button 
                                                        className="btn btn-outline-danger" 
                                                        onClick={() => deleteEdge(link.source.id, link.target.id)}
                                                    >
                                                        Smazat hranu {connectedNodeId}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-muted">Vyberte uzel pro zobrazení možností.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
    </>
  );
}