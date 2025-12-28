import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphColors } from '../../../Hooks/useGraphColors';
import { useGraphSettings } from '../../../Hooks/useGraphSettings';

export function DisplayGraph({ graph, optimalMoves = new Set(), width, height, fitToScreen, highlightedNode = null, winningPlayerMap = {} }) {
  // State for highlighted nodes and links, and for the hovered node.
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());
  const hoverNode = useRef(null);
  const [internalDimensions, setInternalDimensions] = useState({ width: 0, height: 0 });
  const fgRef = useRef();
  const containerRef = useRef();

  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { game } = settings;

  // ResizeObserver to handle responsive sizing
  useEffect(() => {
    if (width && height) return; // specific dimensions provided, don't observe
    if (!containerRef.current) return;

    const updateDimensions = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        setInternalDimensions({ width, height });
    };

    // Initial call
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
        updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);
  
  const graphWidth = width || internalDimensions.width;
  const graphHeight = height || internalDimensions.height;
  
  const nodesRef = useRef([]);

  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    const prevNodesMap = new Map(nodesRef.current.map(n => [n.id, n]));

    // Create nodes with a temporary "neighbors" as union of parents and children.
    const nodes = Object.values(graph.positions).map(node => {
      const prev = prevNodesMap.get(node.id);
      return {
        id: node.id,
        player: node.player,
        x: prev ? prev.x : node.x,
        y: prev ? prev.y : node.y,
        vx: prev ? prev.vx : undefined,
        vy: prev ? prev.vy : undefined,
        isStartingPosition: node.id === graph.startingPosition.id,
        neighbors: [...(node.parents || []), ...(node.children || [])]
      };
    });

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
        const isOptimal = optimalMoves.has(`${link.source}-${link.target}`);
        
        return {
            source,
            target,
            isOptimal
        };
    });
    
    const newData = { nodes, links: linksWithOptimal };
    nodesRef.current = newData.nodes;
    return newData;
  }, [graph, optimalMoves]);

  // When a node is hovered, create new highlight sets.
  const handleNodeHover = useCallback((node) => {
    highlightNodes.current.clear();
    highlightLinks.current.clear();

    if (node) {
      highlightNodes.current.add(node);
      if (node.neighbors) {
        node.neighbors.forEach(neighbor => highlightNodes.current.add(neighbor));
      }
      data.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.current.add(link);
        }
      });
    }

    hoverNode.current = node || null;

    if (containerRef.current) {
        containerRef.current.style.cursor = node ? 'pointer' : 'grab';
    }
  }, [data]);

  const handleLinkHover = useCallback((link) => {
    highlightNodes.current.clear();
    highlightLinks.current.clear();

    if (link) {
      highlightLinks.current.add(link);
      if (link.source) highlightNodes.current.add(link.source);
      if (link.target) highlightNodes.current.add(link.target);
    }
    hoverNode.current = null;

    if (containerRef.current) {
        containerRef.current.style.cursor = link ? 'pointer' : 'grab';
    }
  }, []);

  const paintRing = useCallback((node, ctx) => {
    // Determine opacity
    const isHoverActive = hoverNode.current !== null;
    const isHighlighted = highlightNodes.current.has(node);
    
    ctx.globalAlpha = isHoverActive && !isHighlighted ? 0.15 : 1;

    // Draw a ring around highlighted nodes.
    ctx.beginPath();
    ctx.arc(node.x, node.y, game.nodeRadius * game.highlightScale, 0, 2 * Math.PI, false);
    
    // Color nodes based on player and starting position
    let fillColor;
    if (hoverNode.current === node) {
      fillColor = colors.highlightNode;
    } else if (highlightedNode && node.id === highlightedNode) {
      // Step-by-step highlighted node
      fillColor = colors.accentBlue;
    } else if (node.isStartingPosition) {
      fillColor = colors.accentRed;
    } else {
      fillColor = colors.defaultNode;
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw the player label below the node.
    ctx.font = game.labelFont; 
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player === 1 ? 'I' : 'II', node.x, node.y + game.nodeRadius + 10);
    
    // Draw winning player info if available
    if (winningPlayerMap && winningPlayerMap[node.id]) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#198754'; // Bootstrap success green
        ctx.fillText(winningPlayerMap[node.id] === 1 ? 'I' : 'II', node.x, node.y - game.nodeRadius - 10);
    }

    // Draw node ID above the node
    // ctx.font = '10px monospace';
    // ctx.fillStyle = 'red';
    // ctx.fillText(node.id, node.x, node.y - game.nodeRadius - 12);
    
    // Reset alpha
    ctx.globalAlpha = 1;
  }, [colors, game, highlightedNode, winningPlayerMap]);

  // Adjust link distance based on edge count
  useEffect(() => {
    if (fgRef.current && graph && graph.positions) {
      // Calculate total number of edges
      const edgeCount = Object.values(graph.positions).reduce((sum, node) => {
        return sum + (node.children ? node.children.length : 0);
      }, 0);

      // Base distance + (edgeCount * factor)
      // This increases distance as the graph complexity grows.
      const dynamicDistance = Math.min(20 + edgeCount / 5, 200); 
      
      fgRef.current.d3Force('link').distance(dynamicDistance);
      
      // Re-heat simulation to apply changes smoothly
      fgRef.current.d3ReheatSimulation();
    }
  }, [graph]);

  // Zoom to fit when triggered
  useEffect(() => {
    if (fitToScreen && fgRef.current) {
        fgRef.current.zoomToFit(400, 50);
    }
  }, [fitToScreen]);

  const getLinkWidth = useCallback((link) => {
    return highlightLinks.current.has(link) ? 5 : (link.isOptimal ? 3 : 1);
  }, []);

  const getLinkColor = useCallback((link) => {
    // Base color logic
    let color = link.isOptimal ? colors.accentYellow : colors.defaultLink;
    
    // Opacity logic
    if (hoverNode.current) {
        if (highlightLinks.current.has(link)) {
            return color; // Full opacity for highlighted
        } else {
            return colors.dimmedLink; 
        }
    }
    return color;
  }, [colors]);

  if (!graph || !graph.positions) {
    return <div>Žádná data grafu nejsou k dispozici.</div>;
  }

  return (
    <>
      <div className="GraphDiv shadow-sm" ref={containerRef} style={{ backgroundColor: colors.canvasBackgroundColor }}>
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
          width={graphWidth}
          height={graphHeight}
          enablePanInteraction={true}
          enableZoomInteraction={true}
          graphData={data}
          nodeRelSize={game.nodeRadius}
          autoPauseRedraw={false}
          linkWidth={getLinkWidth}
          linkColor={getLinkColor} 
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={link => highlightLinks.current.has(link) ? 4 : 0}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => 'rgba(0,0,0,0.6)'}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={paintRing}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
        />
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
  }),
  optimalMoves: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
  fitToScreen: PropTypes.bool,
  highlightedNode: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default DisplayGraph;
