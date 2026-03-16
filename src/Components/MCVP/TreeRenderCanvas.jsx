import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphColors } from '../../Hooks/useGraphColors';
import { useGraphSettings } from '../../Hooks/useGraphSettings';

// Constant accessor functions to prevent re-renders of the graph engine
const MODE_REPLACE = () => 'replace';
const MODE_AFTER = () => 'after';

/**
 * Component for rendering an MCVP tree using a force-directed graph.
 * Supports visualization of evaluation results and highlighting specific nodes.
 *
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.tree - The MCVP tree to display
 * @param {Object} [props.highlightedNode] - A specific node to highlight (e.g. from conversion)
 * @param {Object} [props.activeNode] - The node currently being evaluated (for step-by-step)
 * @param {Array} [props.completedSteps] - Array of evaluation steps to display intermediate results
 */
export function TreeRenderCanvas({
  tree,
  highlightedNode = null, // Node to highlight (e.g. from converter)
  activeNode = null, // Node currently being evaluated (step-by-step)
  completedSteps = [], // Steps with results to display
  width,
  height,
  fitToScreen,
  fitTrigger = 0,
  disableAutoCenter = false, // Disable auto-centering on active node
  useTopDownLayout = true,
  defaultLocked = false,
}) {
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for the container div
  const idCounter = useRef(0);

  // Dimensions State
  const [internalDimensions, setInternalDimensions] = useState({ width: 0, height: 0 });
  const [isFlashing, setIsFlashing] = useState(false);
  const [isLocked, setIsLocked] = useState(defaultLocked);
  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const [unlockVersion, setUnlockVersion] = useState(0);
  const savedPositions = useRef(new Map());
  const sourceNodesByIdRef = useRef(new Map());

  // Interaction State
  const hoverNode = useRef(null);
  const highlightNodes = useRef(new Set());
  const highlightLinks = useRef(new Set());

  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { mcvp } = settings;

  // ResizeObserver to handle responsive sizing
  useEffect(() => {
    if (width && height) return;
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

  const canvasWidth = width || internalDimensions.width;
  const canvasHeight = height || internalDimensions.height;

  // Flash border when tree changes
  useEffect(() => {
    setIsFlashing(true);
    setIsLocked(defaultLocked);
    savedPositions.current.clear();
    const timer = setTimeout(() => setIsFlashing(false), 600);
    return () => clearTimeout(timer);
  }, [tree, defaultLocked]);

  // 1. Prepare Graph Data
  // Depends only on `tree` — completedSteps are visualised via resultsMap without
  // recreating node objects, so positions (fx/fy) survive step navigation.
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    const rebuildVersion = unlockVersion;

    const nodes = [];
    const links = [];
    const visited = new Set();
    const sourceNodesById = new Map();

    function traverse(current, parent) {
      if (!current) return;

      // Ensure ID exists on the node object itself
      if (current.id === undefined || current.id === null) {
        current.id = idCounter.current++;
      }

      if (parent) {
        links.push({
          source: parent.id,
          target: current.id,
        });
      }

      if (visited.has(current.id)) return;
      visited.add(current.id);
      sourceNodesById.set(current.id, current);

      // Restore x/y from saved positions (set on unlock) so the simulation
      // starts from the current visual position, avoiding a jarring jump.
      const saved = savedPositions.current.get(current.id);
      nodes.push({
        ...current,
        rebuildVersion,
        x: saved?.x,
        y: saved?.y,
        evaluationResult: undefined,
        neighbors: [],
        links: [],
      });

      if (current.children && Array.isArray(current.children)) {
        current.children.forEach((child) => {
          if (child) traverse(child, current);
        });
      }
    }

    traverse(tree, null);

    // Pre-calculate neighbors for efficient hover lookup
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Populate relationships
    links.forEach((link) => {
      // ForceGraph2D might replace source/target with objects, but initially they are IDs
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);

      if (sourceNode && targetNode) {
        sourceNode.neighbors.push(targetNode);
        targetNode.neighbors.push(sourceNode);
        sourceNode.links.push(link);
        targetNode.links.push(link);
      }
    });

    sourceNodesByIdRef.current = sourceNodesById;
    return { nodes, links };
  }, [tree, unlockVersion]);

  const persistNodePosition = useCallback((node) => {
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;

    const sourceNode = sourceNodesByIdRef.current.get(node.id);
    if (!sourceNode) return;

    sourceNode.x = node.x;
    sourceNode.y = node.y;
    sourceNode.fx = node.x;
    sourceNode.fy = node.y;
  }, []);
  // Map of evaluation results for quick lookup in paintNode
  const resultsMap = useMemo(() => {
    const map = new Map();
    if (completedSteps && completedSteps.length > 0) {
      completedSteps.forEach((step) => {
        if (!step || !step.node) return;
        map.set(step.node.id, step.result);
      });
    }
    return map;
  }, [completedSteps]);

  // 2. Interaction Handlers
  const handleNodeHover = useCallback((node) => {
    hoverNode.current = node;
    highlightNodes.current.clear();
    highlightLinks.current.clear();

    if (node) {
      highlightNodes.current.add(node);
      if (node.neighbors) {
        node.neighbors.forEach((neighbor) => highlightNodes.current.add(neighbor));
      }
      if (node.links) {
        node.links.forEach((link) => highlightLinks.current.add(link));
      }
    }
  }, []);

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

  // 3. Paint Functions

  const paintNode = useCallback(
    (node, ctx) => {
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;

      // State-based Styling logic
      const isHovered = hoverNode.current === node;
      const isNeighbor = highlightNodes.current.has(node) && !isHovered;
      const isExternalHighlight = highlightedNode && node.id === highlightedNode.id;
      const isActive = activeNode && node.id === activeNode.id;

      const Highlighted = isHovered || isNeighbor || isExternalHighlight || isActive;

      // Draw Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, mcvp.nodeRadius, 0, 2 * Math.PI, false);

      // Fill Color
      if (isActive) {
        ctx.fillStyle = colors.accentYellow;
      } else if (isHovered) {
        ctx.fillStyle = colors.accentYellow;
      } else if (isExternalHighlight) {
        ctx.fillStyle = colors.highlightNode;
      } else if (isNeighbor) {
        ctx.fillStyle = colors.highlightNode;
      } else {
        ctx.fillStyle = colors.defaultNode;
      }

      ctx.fill();

      // Stroke
      ctx.strokeStyle = Highlighted ? '#333' : colors.nodeStroke;
      ctx.lineWidth = Highlighted ? 2 : 1;
      ctx.stroke();

      // Text Label
      let displayText = '';
      if (typeof node.value === 'string' && node.value.startsWith('x')) {
        displayText = `${node.value}${node.varValue !== undefined ? `[${node.varValue}]` : ''}`;
      } else if (node.value === 'AND' || node.value === '∧' || node.value === 'A') {
        displayText = 'A';
      } else if (node.value === 'OR' || node.value === '∨' || node.value === 'O') {
        displayText = 'O';
      } else {
        displayText = node.value || '';
      }

      ctx.fillStyle = colors.nodeText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = mcvp.labelFont;
      ctx.fillText(displayText, node.x, node.y);

      // Result Label (above node)
      const result = resultsMap.get(node.id);
      if (result !== undefined) {
        ctx.fillStyle = 'red';
        ctx.fillText(
          `${result}`,
          node.x,
          node.y - mcvp.resultLabelOffsetMultiplier * mcvp.nodeRadius
        );
      } else if (node.rootLabel !== undefined) {
        ctx.fillStyle = 'red';
        ctx.fillText(
          `${node.rootLabel}`,
          node.x,
          node.y - mcvp.resultLabelOffsetMultiplier * mcvp.nodeRadius
        );
      }
    },
    [highlightedNode, activeNode, colors, mcvp, resultsMap]
  );

  const paintLink = useCallback(
    (link, ctx) => {
      if (!link.source || !link.target) return;

      const isHighlighted = highlightLinks.current.has(link);

      ctx.strokeStyle = isHighlighted ? colors.accentRed : colors.defaultLink;
      ctx.lineWidth = isHighlighted ? 3 : 1;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.stroke();
    },
    [colors]
  );

  // 4. Effects

  // Initial Forces Setup
  useEffect(() => {
    if (fgRef.current) {
      const collisionRadius = useTopDownLayout
        ? Math.max(mcvp.nodeRadius * mcvp.collisionRadiusMultiplier, mcvp.nodeRadius + 10)
        : mcvp.nodeRadius * mcvp.collisionRadiusMultiplier;
      const collisionIterations = useTopDownLayout
        ? Math.max(6, mcvp.collisionIterations)
        : mcvp.collisionIterations;
      const collisionStrength = useTopDownLayout
        ? Math.max(0.95, mcvp.collisionStrength)
        : mcvp.collisionStrength;

      // Add collision force to prevent overlap
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force(
          'collision',
          window.d3
            .forceCollide(collisionRadius)
            .strength(collisionStrength)
            .iterations(collisionIterations)
        );
      }
      const linkDistance = useTopDownLayout ? Math.max(130, mcvp.linkDistance) : mcvp.linkDistance;
      const chargeStrength = useTopDownLayout
        ? Math.min(-220, mcvp.chargeStrength)
        : mcvp.chargeStrength;
      fgRef.current.d3Force('link').distance(linkDistance).strength(mcvp.linkStrength);
      fgRef.current.d3Force('charge').strength(chargeStrength);
      fgRef.current.d3ReheatSimulation();
    }
  }, [tree, mcvp, graphData, useTopDownLayout]); // Re-run if tree or graphData changes (new simulation)

  // Focus Camera on Active Node
  useEffect(() => {
    if (activeNode && fgRef.current && !disableAutoCenter) {
      // We need to find the node object in the current graph data to get (x,y)
      const node = graphData.nodes.find((n) => n.id === activeNode.id);
      if (node && typeof node.x === 'number' && typeof node.y === 'number') {
        fgRef.current.centerAt(node.x, node.y, 500);
      }
    }
  }, [activeNode, graphData, disableAutoCenter]);

  // When the canvas starts at 0×0 (e.g. inside an unsized modal), the initial
  // fitTrigger fires before valid dimensions exist and zoomToFit is a no-op.
  // Reheat and perform immediate fit once dimensions become valid.
  const dimensionsWereZeroRef = useRef(canvasWidth === 0 || canvasHeight === 0);
  useEffect(() => {
    if (!dimensionsWereZeroRef.current) return;
    if (canvasWidth > 0 && canvasHeight > 0) {
      dimensionsWereZeroRef.current = false;
      if (fgRef.current) {
        // Reset the camera to the physics origin so nodes are visible while the
        // simulation runs. The degenerate 0×0 canvas leaves the transform at
        // (0,0) which maps physics-origin to the top-left corner of the new
        // larger canvas. centerAt(0,0,0) remaps it to the canvas centre.
        fgRef.current.centerAt(0, 0, 0);
        fgRef.current.zoom(1, 0);
        fgRef.current.d3ReheatSimulation();
        // Fit immediately when explicitly requested.
        if (fitToScreen || fitTrigger > 0) {
          fgRef.current.zoomToFit(400, 50);
        }
      }
    }
  }, [canvasWidth, canvasHeight, fitToScreen, fitTrigger]);

  const handleToggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const locking = !prev;
      if (locking) {
        graphData.nodes.forEach((n) => {
          if (typeof n.x === 'number') {
            n.fx = n.x;
            n.fy = n.y;
          }
        });
      } else {
        // Save current positions before rebuilding graphData so nodes start
        // from where they are (no visual jump) while dagMode re-initializes.
        savedPositions.current.clear();
        graphData.nodes.forEach((n) => {
          if (typeof n.x === 'number') {
            savedPositions.current.set(n.id, { x: n.x, y: n.y });
          }
        });
        // Incrementing unlockVersion causes graphData useMemo to re-run,
        // giving ForceGraph2D fresh node objects so dagMode re-initializes.
        // The force-setup useEffect then reheats the simulation automatically.
        setUnlockVersion((v) => v + 1);
      }
      return locking;
    });
  }, [graphData.nodes]);

  // Ensure lock applies even if nodes get coordinates after initial render.
  const handleEngineTick = useCallback(() => {
    if (!isLocked) return;

    graphData.nodes.forEach((n) => {
      if (typeof n.x === 'number' && typeof n.y === 'number') {
        n.fx = n.x;
        n.fy = n.y;
        persistNodePosition(n);
      }
    });
  }, [graphData.nodes, isLocked, persistNodePosition]);

  // Immediate fit when explicitly requested.
  useEffect(() => {
    if (fitToScreen || fitTrigger > 0) {
      fgRef.current?.zoomToFit(400, 50);
    }
  }, [fitToScreen, fitTrigger]);

  // Called by ForceGraph2D when the physics simulation stops.
  // Pins every node in place (keeps manually-dragged AND auto-settled positions).
  const handleEngineStop = useCallback(() => {
    graphData.nodes.forEach(persistNodePosition);

    if (isLocked) {
      graphData.nodes.forEach((n) => {
        if (typeof n.x === 'number') {
          n.fx = n.x;
          n.fy = n.y;
        }
      });
    }
  }, [graphData.nodes, isLocked, persistNodePosition]);

  return (
    <div
      className={`GraphDiv ${isFlashing ? 'flashing' : ''}`}
      ref={containerRef}
      style={{ backgroundColor: colors.canvasBackgroundColor }}
    >
      <div className="graph-controls">
        <button
          className="graph-btn"
          onClick={() => fgRef.current?.zoomToFit(400, 50)}
          title="Fit Graph to Screen"
        >
          Vycentrovat
        </button>
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowLockTooltip(true)}
          onMouseLeave={() => setShowLockTooltip(false)}
        >
          <button
            className="graph-btn"
            onClick={handleToggleLock}
            style={
              isLocked
                ? { color: 'var(--color2)', borderColor: 'var(--color2)', fontWeight: 700 }
                : undefined
            }
          >
            {isLocked ? '🔒 Zamčeno' : '🔓 Zamknout'}
          </button>
          {showLockTooltip && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: 'rgba(7, 57, 60, 0.95)',
                color: 'white',
                fontSize: '0.75rem',
                padding: '5px 9px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                border: '1px solid rgba(144, 221, 240, 0.3)',
                zIndex: 10,
              }}
            >
              {isLocked ? 'Odemknout pozice všech uzlů' : 'Zamknout pozice všech uzlů na místě'}
            </div>
          )}
        </div>
      </div>
      <ForceGraph2D
        ref={fgRef}
        width={canvasWidth}
        height={canvasHeight}
        graphData={graphData}
        // Layout
        dagMode={useTopDownLayout ? 'td' : undefined}
        dagLevelDistance={useTopDownLayout ? mcvp.dagLevelDistance : undefined}
        // Physics
        autoPauseRedraw={false}
        onEngineTick={handleEngineTick}
        onEngineStop={handleEngineStop}
        // Interaction
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        // Rendering Props
        nodeRelSize={mcvp.nodeRadius} // Matches paintNode radius
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0}
        // Custom Painters
        linkCanvasObjectMode={MODE_REPLACE}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={MODE_AFTER}
        nodeCanvasObject={paintNode}
        // Events
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        onNodeDrag={(node) => {
          node.fx = node.x;
          node.fy = node.y;
          persistNodePosition(node);
        }}
        onNodeDragEnd={(node) => {
          node.fx = node.x;
          node.fy = node.y;
          persistNodePosition(node);
        }}
        onBackgroundClick={() => {
          hoverNode.current = null;
        }}
      />
    </div>
  );
}

TreeRenderCanvas.propTypes = {
  tree: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    value: PropTypes.any,
    varValue: PropTypes.any,
    children: PropTypes.array,
  }),
  highlightedNode: PropTypes.object,
  activeNode: PropTypes.object,
  completedSteps: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  fitToScreen: PropTypes.bool,
  fitTrigger: PropTypes.number,
  disableAutoCenter: PropTypes.bool,
  useTopDownLayout: PropTypes.bool,
  defaultLocked: PropTypes.bool,
};
