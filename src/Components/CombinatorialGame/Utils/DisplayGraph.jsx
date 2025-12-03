import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { computeWinner, getOptimalMoves } from './ComputeWinner';

// colors
const defaultNodeColor = '#438c96'; 
const highlightNodeColor = '#90DDF0';
const startingColor = '#FF6347';
const defaultLinkColor = '#999'; 
const optimalLinkColor = '#FFD700'; 

export function DisplayGraph({ graph }) {
  // State for highlighted nodes and links, and for the hovered node.
  const [, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const NODE_R = 8;
  const fgRef = useRef();
  const containerRef = useRef();

  // ResizeObserver to handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const { analysisResult, optimalMoves } = useMemo(() => {
    if (!graph || !graph.positions) {
      return { analysisResult: null, optimalMoves: {} };
    }

    const result = computeWinner(graph);
    const moves = getOptimalMoves(graph, result);

    return { analysisResult: result, optimalMoves: moves };
  }, [graph]);
  
  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    // Create nodes with a temporary "neighbors" as union of parents and children.
    const nodes = Object.values(graph.positions).map(node => ({
      id: node.id,
      player: node.player,
      x: node.x,
      y: node.y,
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
          links.push({
            source: node.id,
            target: childId
          });
        });
      }
    });
    
    // Convert link endpoints to node objects.
    const linksWithOptimal = links.map(link => {
        const source = nodeMap[link.source];
        const target = nodeMap[link.target];
        const isOptimal = optimalMoves[link.source] === link.target;
        
        return {
            source,
            target,
            isOptimal
        };
    });

    return { nodes, links: linksWithOptimal };
  }, [graph, optimalMoves]);

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
    ctx.fillText(node.player === 1 ? 'I' : 'II', node.x, node.y + NODE_R + 10);
  }, [hoverNode]);

  if (!graph || !graph.positions) {
    return <div>Žádná data grafu nejsou k dispozici.</div>;
  }

  return (
    <>
      <div className="GraphDiv shadow-sm" ref={containerRef}>
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
          enablePanInteraction={true}
          enableZoomInteraction={true}
          graphData={data}
          nodeRelSize={NODE_R}
          autoPauseRedraw={false}
          linkWidth={link => highlightLinks.has(link) ? 5 : (link.isOptimal ? 3 : 1)}
          linkColor={link => link.isOptimal ? optimalLinkColor : defaultLinkColor} 
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => 'rgba(0,0,0,0.6)'}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={paintRing}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
        />
      </div>
      
      {/* Analysis Results */}
      <div className="card mt-4 shadow-sm mx-auto" style={{ maxWidth: '800px' }}>
          <div className="card-header bg-light fw-bold text-start">
              Analýza hry
          </div>
          <div className="card-body text-start">
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
                  <p className="text-muted">Probíhá analýza...</p>
              )}
          </div>
      </div>
    </>
  );
}

DisplayGraph.propTypes = {
  graph: PropTypes.shape({
    positions: PropTypes.object,
    startingPosition: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  })
};

export default DisplayGraph;
