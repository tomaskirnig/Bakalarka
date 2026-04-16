import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphColors } from '../../../Hooks/useGraphColors';
import { useGraphSettings } from '../../../Hooks/useGraphSettings';
import GraphLockButton from '../../Common/GraphControls/GraphLockButton';

const EMPTY_SET = new Set();
const MODE_AFTER = () => 'after';

/**
 * Force-graph visualization for combinatorial game positions and moves.
 * Supports highlighting, optimal move rendering, and optional lock controls.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Graph visualization canvas.
 */
export function DisplayGraph({
  graph,
  optimalMoves = EMPTY_SET,
  width,
  height,
  fitToScreen,
  fitTrigger = 0,
  highlightedNode = null,
  winningPlayerMap = {},
  trackHighlightedNode = false,
  showLockControl = false,
  defaultLocked = false,
  lockOnFirstTick = false,
  showNodeIdsAlways = false,
}) {
  // State for highlighted nodes and links, and for the hovered node.
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());
  const hoverNode = useRef(null);
  const [internalDimensions, setInternalDimensions] = useState({ width: 0, height: 0 });
  const [isFlashing, setIsFlashing] = useState(false);
  const [isGraphLocked, setIsGraphLocked] = useState(false);
  const autoLockRef = useRef(defaultLocked);
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

  const handleFitToScreen = useCallback(() => {
    fgRef.current?.zoomToFit(400, 50);
  }, []);

  const nodesRef = useRef([]);

  // Flash border when graph changes
  useEffect(() => {
    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), 600);
    return () => clearTimeout(timer);
  }, [graph]);

  useEffect(() => {
    setIsGraphLocked(false);
    autoLockRef.current = defaultLocked;
  }, [graph, defaultLocked]);

  // Memoize graph data for react-force-graph-2d.
  const data = useMemo(() => {
    const prevNodesMap = new Map(nodesRef.current.map((n) => [n.id, n]));

    // Create nodes with a temporary "neighbors" as union of parents and children.
    const nodes = Object.values(graph.positions).map((node) => {
      const prev = prevNodesMap.get(node.id);
      return {
        id: node.id,
        player: node.player,
        x: prev ? prev.x : node.x,
        y: prev ? prev.y : node.y,
        vx: prev ? prev.vx : undefined,
        vy: prev ? prev.vy : undefined,
        fx: prev ? prev.fx : undefined,
        fy: prev ? prev.fy : undefined,
        isStartingPosition: node.id === graph.startingPosition.id,
        neighbors: [...(node.parents || []), ...(node.children || [])],
      };
    });

    // Build a mapping from node id to node object.
    const nodeMap = {};
    nodes.forEach((n) => {
      nodeMap[n.id] = n;
    });

    // Replace neighbor IDs with actual node objects.
    nodes.forEach((n) => {
      n.neighbors = n.neighbors.map((id) => nodeMap[id]).filter(Boolean);
    });

    // Build links from each node's children.
    const links = [];
    Object.values(graph.positions).forEach((node) => {
      if (node.children) {
        node.children.forEach((childId) => {
          links.push({
            source: node.id,
            target: childId,
          });
        });
      }
    });

    // Convert link endpoints to node objects.
    const linksWithOptimal = links.map((link) => {
      const source = nodeMap[link.source];
      const target = nodeMap[link.target];
      const isOptimal = optimalMoves.has(`${link.source}-${link.target}`);

      return {
        source,
        target,
        isOptimal,
      };
    });

    const newData = { nodes, links: linksWithOptimal };
    nodesRef.current = newData.nodes;
    return newData;
  }, [graph, optimalMoves]);

  // When a node is hovered, create new highlight sets.
  const handleNodeHover = useCallback(
    (node) => {
      highlightNodes.current.clear();
      highlightLinks.current.clear();

      if (node) {
        highlightNodes.current.add(node);
        if (node.neighbors) {
          node.neighbors.forEach((neighbor) => highlightNodes.current.add(neighbor));
        }
        data.links.forEach((link) => {
          if (link.source.id === node.id || link.target.id === node.id) {
            highlightLinks.current.add(link);
          }
        });
      }

      hoverNode.current = node || null;
    },
    [data]
  );

  const handleLinkHover = useCallback((link) => {
    highlightNodes.current.clear();
    highlightLinks.current.clear();

    if (link) {
      highlightLinks.current.add(link);
      if (link.source) highlightNodes.current.add(link.source);
      if (link.target) highlightNodes.current.add(link.target);
    }
    hoverNode.current = null;
  }, []);

  const paintRing = useCallback(
    (node, ctx) => {
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
        // Step-by-step highlighted node - use same color as hover
        fillColor = colors.highlightNode;
      } else if (node.isStartingPosition) {
        fillColor = colors.accentRed;
      } else {
        fillColor = colors.defaultNode;
      }

      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw node ID in center when hovered, tracked, or explicitly always enabled.
      if (
        showNodeIdsAlways ||
        hoverNode.current !== null ||
        (highlightedNode && node.id === highlightedNode)
      ) {
        ctx.font = game.nodeIdFont;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);
      }

      // Draw the player label below the node.
      ctx.font = game.labelFont;
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        node.player === 1 ? 'I' : 'II',
        node.x,
        node.y + game.nodeRadius + game.playerLabelOffset
      );

      // Draw winning player info if available
      if (winningPlayerMap && winningPlayerMap[node.id]) {
        ctx.font = game.winningLabelFont;
        ctx.fillStyle = game.winningLabelColor;
        ctx.fillText(
          winningPlayerMap[node.id] === 1 ? 'I' : 'II',
          node.x,
          node.y - game.nodeRadius - game.playerLabelOffset
        );
      }

      // Reset alpha
      ctx.globalAlpha = 1;
    },
    [colors, game, highlightedNode, showNodeIdsAlways, winningPlayerMap]
  );

  // Adjust link distance based on edge count
  useEffect(() => {
    if (fgRef.current && graph && graph.positions) {
      // Calculate total number of edges
      const edgeCount = Object.values(graph.positions).reduce((sum, node) => {
        return sum + (node.children ? node.children.length : 0);
      }, 0);

      // Base distance + (edgeCount * factor)
      // Increase distance as the graph complexity grows.
      const dynamicDistance = Math.min(
        game.dynamicLinkDistanceBase + edgeCount * game.dynamicLinkDistancePerEdge,
        game.dynamicLinkDistanceMax
      );

      fgRef.current.d3Force('link').distance(dynamicDistance);

      // Re-heat simulation to apply changes smoothly
      fgRef.current.d3ReheatSimulation();
    }
  }, [graph, game]);

  const persistGraphPosition = useCallback(
    (node) => {
      if (!graph?.positions || !node || typeof node.x !== 'number' || typeof node.y !== 'number')
        return;

      const position = graph.positions[node.id];
      if (!position) return;

      position.x = node.x;
      position.y = node.y;
    },
    [graph]
  );

  const pinNodePosition = useCallback((node) => {
    if (typeof node?.x === 'number' && typeof node?.y === 'number') {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);

  const unpinNodePosition = useCallback((node) => {
    if (!node) return;
    node.fx = undefined;
    node.fy = undefined;
  }, []);

  const handleToggleGraphLock = useCallback(() => {
    setIsGraphLocked((prevLocked) => {
      const nextLocked = !prevLocked;

      if (nextLocked) {
        data.nodes.forEach(pinNodePosition);
      } else {
        data.nodes.forEach(unpinNodePosition);
        fgRef.current?.d3ReheatSimulation();
      }

      return nextLocked;
    });
  }, [data.nodes, pinNodePosition, unpinNodePosition]);

  // Apply lock as soon as node coordinates are available from the engine.
  const handleEngineTick = useCallback(() => {
    if (lockOnFirstTick && autoLockRef.current) {
      const nodesWithCoords = data.nodes.filter(
        (n) => typeof n.x === 'number' && typeof n.y === 'number'
      );
      if (nodesWithCoords.length > 0) {
        setIsGraphLocked(true);
        autoLockRef.current = false;
        nodesWithCoords.forEach((n) => {
          n.fx = n.x;
          n.fy = n.y;
          persistGraphPosition(n);
        });
      }
    }

    if (!isGraphLocked) return;

    data.nodes.forEach((n) => {
      if (typeof n.x === 'number' && typeof n.y === 'number') {
        n.fx = n.x;
        n.fy = n.y;
        persistGraphPosition(n);
      }
    });
  }, [data.nodes, isGraphLocked, persistGraphPosition, lockOnFirstTick]);

  // Immediate fit when explicitly requested.
  useEffect(() => {
    if (fitToScreen || fitTrigger > 0) {
      fgRef.current?.zoomToFit(400, 50);
    }
  }, [fitToScreen, fitTrigger]);

  // Persist coordinates after simulation settles.
  // Only pin nodes when lock mode is enabled.
  const handleEngineStop = useCallback(() => {
    // Auto-lock after initial layout if requested
    if (autoLockRef.current) {
      setIsGraphLocked(true);
      autoLockRef.current = false;

      data.nodes.forEach(pinNodePosition);
    } else {
      data.nodes.forEach((n) => {
        if (typeof n.x === 'number') {
          if (isGraphLocked) {
            n.fx = n.x;
            n.fy = n.y;
          } else {
            n.fx = undefined;
            n.fy = undefined;
          }
        }
      });
    }

    data.nodes.forEach(persistGraphPosition);
  }, [data.nodes, isGraphLocked, pinNodePosition, persistGraphPosition]);

  // Center camera on highlighted node when tracking is enabled
  useEffect(() => {
    if (trackHighlightedNode && highlightedNode && fgRef.current && data.nodes) {
      const node = data.nodes.find((n) => n.id === highlightedNode);
      if (node && node.x !== undefined && node.y !== undefined) {
        // Center on the node with smooth transition
        fgRef.current.centerAt(node.x, node.y, 800);
        // Optionally zoom in slightly for better focus, but not too much
        const currentZoom = fgRef.current.zoom();
        if (currentZoom < 2) {
          fgRef.current.zoom(2, 800);
        }
      }
    }
  }, [highlightedNode, trackHighlightedNode, data.nodes]);

  const getLinkWidth = useCallback((link) => {
    return highlightLinks.current.has(link) ? 5 : link.isOptimal ? 3 : 1;
  }, []);

  const getLinkColor = useCallback(
    (link) => {
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
    },
    [colors]
  );

  if (!graph || !graph.positions) {
    return <div>Žádná data grafu nejsou k dispozici.</div>;
  }

  return (
    <>
      <div
        className={`GraphDiv shadow-sm ${isFlashing ? 'flashing' : ''}`}
        ref={containerRef}
        style={{ backgroundColor: colors.canvasBackgroundColor }}
      >
        <div className="graph-controls">
          <button
            type="button"
            className="graph-btn"
            onClick={handleFitToScreen}
            title="Fit Graph to Screen"
          >
            Vycentrovat
          </button>
          {showLockControl && (
            <GraphLockButton isLocked={isGraphLocked} onToggle={handleToggleGraphLock} />
          )}
        </div>
        <ForceGraph2D
          ref={fgRef}
          width={graphWidth}
          height={graphHeight}
          enablePanInteraction={true}
          enableZoomInteraction={true}
          enableNodeDrag={true}
          graphData={data}
          nodeRelSize={game.nodeRadius}
          autoPauseRedraw={false}
          linkWidth={getLinkWidth}
          linkColor={getLinkColor}
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={(link) => (highlightLinks.current.has(link) ? 4 : 0)}
          linkDirectionalArrowLength={game.linkDirectionalArrowLength}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => 'rgba(0,0,0,0.6)'}
          nodeCanvasObjectMode={MODE_AFTER}
          nodeCanvasObject={paintRing}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          onEngineTick={handleEngineTick}
          onEngineStop={handleEngineStop}
          onNodeDrag={(node) => {
            node.fx = node.x;
            node.fy = node.y;
            persistGraphPosition(node);
          }}
          onNodeDragEnd={(node) => {
            if (isGraphLocked) {
              node.fx = node.x;
              node.fy = node.y;
            } else {
              node.fx = undefined;
              node.fy = undefined;
              fgRef.current?.d3ReheatSimulation();
            }
            persistGraphPosition(node);
          }}
        />
      </div>
    </>
  );
}

DisplayGraph.propTypes = {
  trackHighlightedNode: PropTypes.bool,
  graph: PropTypes.shape({
    positions: PropTypes.object,
    startingPosition: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
  optimalMoves: PropTypes.instanceOf(Set),
  width: PropTypes.number,
  height: PropTypes.number,
  fitToScreen: PropTypes.bool,
  fitTrigger: PropTypes.number,
  highlightedNode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  winningPlayerMap: PropTypes.objectOf(PropTypes.oneOf([1, 2])),
  showLockControl: PropTypes.bool,
  defaultLocked: PropTypes.bool,
  lockOnFirstTick: PropTypes.bool,
  showNodeIdsAlways: PropTypes.bool,
};

export default DisplayGraph;
