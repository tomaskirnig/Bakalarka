import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide, forceCenter } from 'd3';
import { useGraphColors } from '../../Hooks/useGraphColors';
import { useGraphSettings } from '../../Hooks/useGraphSettings';
import { drawReversedArrowhead } from './Utils/drawReversedArrowhead';
import GraphLockButton from '../Common/GraphControls/GraphLockButton';

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
  lockOnFirstTick = false,
  onRegisterPositionSnapshotGetter,
  showLockControl = true,
  lockNodeAfterDrag = true,
}) {
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for the container div
  const idCounter = useRef(0);

  // Dimensions State
  const [internalDimensions, setInternalDimensions] = useState({ width: 0, height: 0 });
  const [isFlashing, setIsFlashing] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Start unlocked to allow initial layout
  const autoLockRef = useRef(defaultLocked);
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
      const { width: w, height: h } = containerRef.current.getBoundingClientRect();
      if (w > 0 && h > 0) {
        setInternalDimensions({ width: w, height: h });
      }
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

  const requestStableFit = useCallback((ms = 400) => {
    if (!fgRef.current) return;

    // Run fit on two consecutive frames to survive modal open animations
    // and late canvas size stabilization.
    requestAnimationFrame(() => {
      fgRef.current?.zoomToFit(ms, 50);
      requestAnimationFrame(() => {
        fgRef.current?.zoomToFit(ms, 50);
      });
    });
  }, []);

  const getCurrentNodePositionsSnapshot = useCallback(() => {
    if (!fgRef.current) return {};

    const engineNodes = fgRef.current.graphData()?.nodes;
    if (!Array.isArray(engineNodes) || engineNodes.length === 0) {
      return {};
    }

    const snapshot = {};
    engineNodes.forEach((node) => {
      const x = typeof node.x === 'number' ? node.x : node.fx;
      const y = typeof node.y === 'number' ? node.y : node.fy;

      if (typeof x === 'number' && typeof y === 'number') {
        snapshot[node.id] = { x, y };
      }
    });

    return snapshot;
  }, []);

  useEffect(() => {
    if (!onRegisterPositionSnapshotGetter) return;

    onRegisterPositionSnapshotGetter(getCurrentNodePositionsSnapshot);
    return () => {
      onRegisterPositionSnapshotGetter(null);
    };
  }, [onRegisterPositionSnapshotGetter, getCurrentNodePositionsSnapshot]);

  // Flash border when tree changes
  useEffect(() => {
    setIsFlashing(true);
    setIsLocked(false);
    autoLockRef.current = defaultLocked;
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
      const initialX = saved?.x ?? current.x;
      const initialY = saved?.y ?? current.y;
      nodes.push({
        ...current,
        rebuildVersion,
        x: initialX,
        y: initialY,
        // Never carry over pinned coordinates from a previous mount/session.
        // Locking is reapplied explicitly after layout settles.
        fx: undefined,
        fy: undefined,
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
      const isRoot = !node.parents || node.parents.length === 0;

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
        ctx.fillStyle = isRoot ? colors.accentRed : colors.highlightNode;
      } else if (isNeighbor) {
        ctx.fillStyle = colors.highlightNode;
      } else if (isRoot) {
        ctx.fillStyle = colors.accentRed;
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
      const sourceX = link.source.x;
      const sourceY = link.source.y;
      const targetX = link.target.x;
      const targetY = link.target.y;

      if (
        typeof sourceX !== 'number' ||
        typeof sourceY !== 'number' ||
        typeof targetX !== 'number' ||
        typeof targetY !== 'number'
      ) {
        return;
      }

      ctx.strokeStyle = isHighlighted ? colors.accentRed : colors.defaultLink;
      ctx.lineWidth = isHighlighted ? 3 : 1;

      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Keep link semantics parent->child, but draw reversed visual arrowheads.
      ctx.fillStyle = isHighlighted ? colors.accentRed : colors.defaultLink;
      drawReversedArrowhead(ctx, sourceX, sourceY, targetX, targetY, mcvp.nodeRadius);
    },
    [colors, mcvp.nodeRadius]
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
      fgRef.current.d3Force(
        'collision',
        forceCollide(collisionRadius)
          .strength(collisionStrength)
          .iterations(collisionIterations)
      );

      // Disable center force when DAG mode is active as it conflicts with hierarchical layout
      if (useTopDownLayout) {
        fgRef.current.d3Force('center', null);
      } else {
        fgRef.current.d3Force('center', forceCenter(0, 0));
      }
      const linkDistance = useTopDownLayout ? Math.max(130, mcvp.linkDistance) : mcvp.linkDistance;
      const chargeStrength = useTopDownLayout
        ? Math.min(-220, mcvp.chargeStrength)
        : mcvp.chargeStrength;
      fgRef.current.d3Force('link').distance(linkDistance).strength(mcvp.linkStrength);
      fgRef.current.d3Force('charge').strength(chargeStrength);
      fgRef.current.d3ReheatSimulation();
    }
  }, [tree, mcvp, graphData, useTopDownLayout, lockNodeAfterDrag]); // Re-run if tree, graphData, layout or drag-lock setting changes

  // Focus Camera on Active Node
  useEffect(() => {
    if (activeNode && fgRef.current && !disableAutoCenter) {
      // Resolve current node coordinates.
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
          requestStableFit(400);
        }
      }
    }
  }, [canvasWidth, canvasHeight, fitToScreen, fitTrigger, requestStableFit]);

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
        // Preserve current positions before dag layout reset.
        savedPositions.current.clear();
        graphData.nodes.forEach((n) => {
          if (typeof n.x === 'number') {
            savedPositions.current.set(n.id, { x: n.x, y: n.y });
          }
        });
        // Rebuild node objects and re-run dag layout.
        setUnlockVersion((v) => v + 1);
      }
      return locking;
    });
  }, [graphData.nodes]);

  // Keep lock active after coordinates are assigned.
  const handleEngineTick = useCallback(() => {
    if (lockOnFirstTick && autoLockRef.current) {
      const nodesWithCoords = graphData.nodes.filter(
        (n) => typeof n.x === 'number' && typeof n.y === 'number'
      );

      if (nodesWithCoords.length > 0) {
        setIsLocked(true);
        autoLockRef.current = false;
        nodesWithCoords.forEach((n) => {
          n.fx = n.x;
          n.fy = n.y;
          persistNodePosition(n);
        });
      }
    }

    if (!isLocked) return;

    graphData.nodes.forEach((n) => {
      if (typeof n.x === 'number' && typeof n.y === 'number') {
        n.fx = n.x;
        n.fy = n.y;
        persistNodePosition(n);
      }
    });
  }, [graphData.nodes, isLocked, persistNodePosition, lockOnFirstTick]);

  // Immediate fit when explicitly requested.
  const lastEffectFitTrigger = useRef(-1);
  const lastEngineFitTrigger = useRef(-1);

  useEffect(() => {
    const fitRequested = fitTrigger > lastEffectFitTrigger.current;
    const shouldFit = fitToScreen || fitRequested;

    if (!shouldFit) return;
    if (!fgRef.current) return;
    if (canvasWidth <= 0 || canvasHeight <= 0) return;
    if (!graphData.nodes || graphData.nodes.length === 0) return;

    requestStableFit(400);

    if (fitRequested) {
      lastEffectFitTrigger.current = fitTrigger;
    }
  }, [fitToScreen, fitTrigger, canvasWidth, canvasHeight, graphData.nodes, requestStableFit]);

  // Called by ForceGraph2D when the physics simulation stops.
  // Pins every node in place (keeps manually-dragged AND auto-settled positions).
  const handleEngineStop = useCallback(() => {
    graphData.nodes.forEach(persistNodePosition);

    // Auto-lock after initial layout if requested
    if (autoLockRef.current) {
      setIsLocked(true);
      autoLockRef.current = false;

      // Pin positions when auto-locking
      graphData.nodes.forEach((n) => {
        if (typeof n.x === 'number') {
          n.fx = n.x;
          n.fy = n.y;
        }
      });
    } else if (isLocked) {
      // Keep nodes pinned if already locked
      graphData.nodes.forEach((n) => {
        if (typeof n.x === 'number') {
          n.fx = n.x;
          n.fy = n.y;
        }
      });
    }

    /*
    // Ensure final settled layout is also centered/fitted when requested.
    const fitRequested = fitTrigger > lastEngineFitTrigger.current;
    if (fitToScreen || fitRequested) {
      requestStableFit(300);
      if (fitRequested) {
        lastEngineFitTrigger.current = fitTrigger;
      }
    }
    */
  }, [
    graphData.nodes,
    isLocked,
    persistNodePosition,
    fitToScreen,
    fitTrigger,
    requestStableFit,
  ]);

  const handleNodeDrag = useCallback(
    (node) => {
      if (lockNodeAfterDrag || isLocked) {
        node.fx = node.x;
        node.fy = node.y;
      }
      persistNodePosition(node);
    },
    [lockNodeAfterDrag, isLocked, persistNodePosition]
  );

  const handleNodeDragEnd = useCallback(
    (node) => {
      if (lockNodeAfterDrag || isLocked) {
        node.fx = node.x;
        node.fy = node.y;
      } else {
        node.fx = undefined;
        node.fy = undefined;
        fgRef.current?.d3ReheatSimulation();
      }
      persistNodePosition(node);
    },
    [lockNodeAfterDrag, isLocked, persistNodePosition]
  );

  return (
    <div
      className={`GraphDiv ${isFlashing ? 'flashing' : ''}`}
      ref={containerRef}
      style={{ backgroundColor: colors.canvasBackgroundColor }}
    >
      <div className="graph-controls">
        <button
          type="button"
          className="graph-btn"
          onClick={() => requestStableFit(400)}
          title="Fit Graph to Screen"
        >
          Vycentrovat
        </button>
        {showLockControl && <GraphLockButton isLocked={isLocked} onToggle={handleToggleLock} />}
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
        linkDirectionalArrowLength={0}
        // Custom Painters
        linkCanvasObjectMode={MODE_REPLACE}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={MODE_AFTER}
        nodeCanvasObject={paintNode}
        // Events
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
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
  lockOnFirstTick: PropTypes.bool,
  onRegisterPositionSnapshotGetter: PropTypes.func,
  showLockControl: PropTypes.bool,
  lockNodeAfterDrag: PropTypes.bool,
};
