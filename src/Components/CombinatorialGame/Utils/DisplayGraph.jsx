import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { computeWinner, getOptimalMoves } from './ComputeWinner';

// colors
const defaultNodeColor = '#438c96'; 
const highlightNodeColor = '#90DDF0';
const startingColor = '#FF6347';
const optimalLinkColor = '#FFD700'; 
const defaultLinkColor = '#999'; 

export function DisplayGraph({ graph }) {
  if (!graph || !graph.positions) {
    return <div>No graph data available.</div>;
  }

  // State to store analysis results
  const [analysisResult, setAnalysisResult] = useState(null);
  const [optimalMoves, setOptimalMoves] = useState({});
  
  // Analyze the graph when it changes
  useEffect(() => {
    if (graph && graph.positions) {
      const result = computeWinner(graph);
      const moves = getOptimalMoves(graph);
      setAnalysisResult(result);
      setOptimalMoves(moves);
    }
  }, [graph]);

  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    // Create nodes with a temporary "neighbors" as union of parents and children.
    const nodes = Object.values(graph.positions).map(node => ({
      id: node.id,
      player: node.player,
      isStartingPosition: node.id === graph.startingPosition.id,
      neighbors: [...(node.parents || []), ...(node.children || [])]
    }));

    // Build a mapping from node id to node object.
    const nodeMap = {};
    nodes.forEach(n => {
      nodeMap[n.id] = n;
    });

    // Replace neighbor IDs with actual node objects.
    nodes.forEach(n => {
      n.neighbors = n.neighbors.map(id => nodeMap[id]).filter(Boolean);
    });

    // Build links from each node's children.
    const links = [];
    Object.values(graph.positions).forEach(node => {
      if (node.children) {
        node.children.forEach(childId => {
          // Mark optimal moves for Player 1's winning strategy
          const isOptimal = node.player === 1 && optimalMoves[node.id] === childId;
          links.push({
            source: node.id,
            target: childId,
            isOptimal: isOptimal
          });
        });
      }
    });
    
    // Convert link endpoints to node objects.
    links.forEach(link => {
      link.source = nodeMap[link.source];
      link.target = nodeMap[link.target];
    });

    return { nodes, links };
  }, [graph, optimalMoves]);

  // State for highlighted nodes and links, and for the hovered node.
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const NODE_R = 8;

  // When a node is hovered, create new highlight sets.
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
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, [data]);

  const handleLinkHover = useCallback((link) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();
    if (link) {
      newHighlightLinks.add(link);
      newHighlightNodes.add(link.source);
      newHighlightNodes.add(link.target);
    }
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []);

  const paintRing = useCallback((node, ctx) => {
    // Draw a ring around highlighted nodes.
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);
    
    // Color nodes based on player and starting position
    let fillColor;
    if (node === hoverNode) {
      fillColor = highlightNodeColor;
    }else if (node.isStartingPosition) {
      fillColor = startingColor;
    }else {
      fillColor = defaultNodeColor;
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw the player label below the node.
    ctx.font = `8px monospace`; 
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player == 1 ? 'I' : 'II', node.x, node.y + NODE_R + 10);
  }, [hoverNode, highlightNodes]);

  return (
    <>
      <div className="GraphDiv">
        <ForceGraph2D
          graphData={data}
          nodeRelSize={NODE_R}
          autoPauseRedraw={false}
          linkWidth={link => highlightLinks.has(link) ? 5 : (link.isOptimal ? 3 : 1)}
          linkColor={link => link.isOptimal ? optimalLinkColor : defaultLinkColor}  
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={link => 'rgba(0,0,0,0.6)'}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={paintRing}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
        />
      </div>
      
      {/* Display analysis results */}
      {analysisResult && (
        <div className="card h-100 mt-3">
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
      )}
      
      <div style={{ height: '50px' }}></div>
    </>
  );
}

export default DisplayGraph;
