import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const color1 = '#438c96'; 
const color4 = '#90DDF0';
const startingColor = '#FF6347';

export function ManualInput() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);  // Track selected node
  const [addingEdge, setAddingEdge] = useState(false);     // Track if we're in edge adding mode
  const [edgeSource, setEdgeSource] = useState(null);      // Track source node for edge
  const fgRef = useRef();

  const NODE_R = 8;

  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    return { nodes: graph.nodes, links: graph.links };
  }, [graph]);

  // Add the first node when the component loads
  useEffect(() => {
    if (graph.nodes.length === 0) {
      addNode(); // Add the first node for Player 1 on initial load
    }
  }, [graph.nodes]);

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
      (typeof link.source === 'object' ? link.source.id !== nodeId : link.source !== nodeId) && 
      (typeof link.target === 'object' ? link.target.id !== nodeId : link.target !== nodeId)
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
      (typeof link.source === 'object' ? link.source.id === sourceId : link.source === sourceId) && 
      (typeof link.target === 'object' ? link.target.id === targetId : link.target === targetId)
    );
  };

  // Function to add an edge between two nodes
  const addEdge = (sourceId, targetId) => {
    // Don't allow self-loops or duplicate edges
    if (sourceId === targetId || edgeExists(sourceId, targetId)) {
      return false;
    }

    const newLink = {
      source: sourceId,
      target: targetId,
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
      !(
        (typeof link.source === 'object' ? link.source.id === sourceId : link.source === sourceId) && 
        (typeof link.target === 'object' ? link.target.id === targetId : link.target === targetId)
      )
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
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (sourceId === node.id || targetId === node.id) {
          newHighlightLinks.add(link);
        }
      });
    }

    setHoverNode(node || null);
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, [data]);

  // Highlighted node and edges styling
  const paintRing = useCallback((node, ctx) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);
    
    // Change color based on node state
    if (addingEdge && edgeSource && edgeSource.id === node.id) {
      ctx.fillStyle = '#FF6347'; // Red for source node
    } else if (node === hoverNode) {
      ctx.fillStyle = color4;
    } else {
      ctx.fillStyle = color1;
    }
    
    ctx.fill();
    ctx.font = `8px monospace`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player === 1 ? 'I' : 'II', node.x, node.y + NODE_R + 10);
  }, [hoverNode, addingEdge, edgeSource]);

  // Handle node click for editing/deleting actions
  const handleNodeClick = (node) => {
    if (addingEdge) {
      // If we're adding an edge and click a different node, create the edge
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
      
      // If needed, refresh the simulation
      if (fgRef.current) {
        fgRef.current.refresh();
      }
    }
  };

  return (
    <>
    <div className="GraphDiv">
      {addingEdge && (
        <div className="manual-input-instruction">
          Select a node to connect to
        </div>
      )}
      <ForceGraph2D
        graphData={data}
        nodeRelSize={NODE_R}
        autoPauseRedraw={false}
        linkWidth={link => highlightLinks.has(link) ? 5 : 1}
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => 'rgba(0,0,0,0.6)'}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={paintRing}
        onNodeHover={handleNodeHover}
        onLinkHover={handleNodeHover}
        onNodeClick={handleNodeClick}  
        onBackgroundClick={handleBackgroundClick} 
      />
    </div>
    <div style={{ textAlign: "center", margin: "10px" }}>
        <button className="btn btn-primary mx-1" onClick={addNode}>Přidat uzel</button>
    </div>

    {selectedNode && !addingEdge && (
        <div style={{ textAlign: "center", margin: "10px", marginBottom: "50px" }}>
            <h3>Vybraný uzel: {selectedNode.id}</h3>
            <button className="btn btn-primary mx-1" onClick={changePlayer}>Změnit hráče</button>
            <button className="btn btn-danger mx-1" onClick={() => deleteNode(selectedNode.id)}>Smazat uzel</button>
            <button className="btn btn-success mx-1" onClick={startAddEdge}>Přidat hranu</button>
            
            {/* List of connected nodes with delete buttons */}
            <div style={{ marginTop: "10px" }}>
              <h4>Propojené uzly:</h4>
              <div className="d-flex flex-wrap justify-content-center">
                {graph.links
                  .filter(link => 
                    (typeof link.source === 'object' ? link.source.id === selectedNode.id : link.source === selectedNode.id) || 
                    (typeof link.target === 'object' ? link.target.id === selectedNode.id : link.target === selectedNode.id)
                  )
                  .map((link, index) => {
                    const connectedNodeId = 
                      (typeof link.source === 'object' ? link.source.id : link.source) === selectedNode.id
                        ? (typeof link.target === 'object' ? link.target.id : link.target)
                        : (typeof link.source === 'object' ? link.source.id : link.source);
                    
                    return (
                      <div key={index} className="m-1">
                        <button 
                          className="btn btn-outline-danger" 
                          onClick={() => deleteEdge(
                            typeof link.source === 'object' ? link.source.id : link.source,
                            typeof link.target === 'object' ? link.target.id : link.target
                          )}
                        >
                          Smazat hranu k {connectedNodeId}
                        </button>
                      </div>
                    );
                  })
                }
              </div>
            </div>
        </div>
    )}
    </>
  );
}