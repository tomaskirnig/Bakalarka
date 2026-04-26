import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3';
import { useGraphColors } from '../../Hooks/useGraphColors';
import { useGraphSettings } from '../../Hooks/useGraphSettings';

// Constant accessor functions to prevent re-renders of the graph engine
const MODE_REPLACE = () => 'replace';
const MODE_AFTER = () => 'after';

/**
 * Component for rendering a Grammar Derivation Tree.
 *
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.tree - The derivation tree structure
 */
export function DerivationTreeVisual({ tree, fitTrigger = 0, lockNodeAfterDrag = true }) {
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for the container div

  // Dimensions State
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const dimensionsWereZeroRef = useRef(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Interaction State
  const hoverNode = useRef(null);

  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { grammar: grammarSettings } = settings;

  // 1. Prepare Graph Data
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };

    const nodes = [];
    const links = [];

    // Calculate fixed positions (fx, fy) so that children are ordered from left to right as they appear in the tree.

    // Determine the "width" of each subtree to allocate space
    const subtreeWidths = new Map();
    function calculateWidth(node) {
      if (!node.children || node.children.length === 0) {
        subtreeWidths.set(node.id, 1);
        return 1;
      }
      let width = 0;
      node.children.forEach((child) => {
        width += calculateWidth(child);
      });
      subtreeWidths.set(node.id, width);
      return width;
    }
    calculateWidth(tree);

    // Traverse and assign positions based on allocated width
    // Level distance and horizontal scale
    const levelDist = grammarSettings.dagLevelDistance || 50;
    const siblingDist = 40;

    function assignPositions(node, xOffset, depth, parentPos) {
      const myWidth = subtreeWidths.get(node.id);

      // Position this node in the middle of its allocated width
      const x = xOffset + (myWidth * siblingDist) / 2;
      const y = depth * levelDist;

      // Assign fixed positions to prevent physics from shuffling order
      node.fx = x;
      node.fy = y;

      nodes.push(node);

      if (parentPos) {
        links.push({ source: parentPos.id, target: node.id });
      }

      if (node.children && node.children.length > 0) {
        let currentX = xOffset;
        node.children.forEach((child) => {
          assignPositions(child, currentX, depth + 1, node);
          currentX += subtreeWidths.get(child.id) * siblingDist;
        });
      }
    }

    assignPositions(tree, 0, 0, null);

    return { nodes, links };
  }, [tree, grammarSettings]);

  const handleFitToScreen = useCallback(() => {
    fgRef.current?.zoomToFit(400, 50);
  }, []);

  // Fit to screen when fitTrigger changes
  const lastFitTrigger = useRef(-1);
  useEffect(() => {
    if (fitTrigger > lastFitTrigger.current && fgRef.current && dimensions.width > 0) {
      // Small delay to allow engine to settle before fitting
      requestAnimationFrame(() => {
        fgRef.current?.zoomToFit(400, 50);
      });
      lastFitTrigger.current = fitTrigger;
    }
  }, [fitTrigger, dimensions.width]);

  // Recover from initial 0x0 canvas mounts by recentering and reheating once dimensions are ready.
  useEffect(() => {
    if (!dimensionsWereZeroRef.current) return;
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    dimensionsWereZeroRef.current = false;

    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 0);
      fgRef.current.zoom(1, 0);
      fgRef.current.d3ReheatSimulation();

      // Auto-fit on first valid dimensions if tree exists
      if (graphData.nodes.length > 0) {
        requestAnimationFrame(() => {
          fgRef.current?.zoomToFit(400, 50);
        });
      }
    }
  }, [dimensions.width, dimensions.height, graphData.nodes.length]);

  // Flash border when tree changes
  useEffect(() => {
    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), 600);
    return () => clearTimeout(timer);
  }, [tree]); // Use grammar settings

  // ResizeObserver to handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
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
  }, []);

  // 2. Interaction Handlers
  const handleNodeHover = useCallback((node) => {
    hoverNode.current = node || null;
  }, []);

  // 3. Paint Functions
  const paintNode = useCallback(
    (node, ctx) => {
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;

      const isHovered = hoverNode.current === node;

      // Determine styles based on node type
      let fillColor = colors.defaultNode;
      let strokeColor = colors.nodeStroke;
      let textColor = colors.nodeText;

      if (node.attributes) {
        if (node.attributes.type === 'terminal') {
          fillColor = colors.accentYellow; // Terminals stand out
        } else if (node.attributes.type === 'epsilon') {
          fillColor = '#f0f0f0';
          textColor = '#999';
        } else if (node.attributes.type === 'non-terminal') {
          fillColor = colors.defaultNode;
        }
      }

      // Highlight override
      if (isHovered) {
        strokeColor = '#333';
        ctx.lineWidth = 2;
      } else {
        ctx.lineWidth = 1;
      }

      // Draw Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, grammarSettings.nodeRadius, 0, 2 * Math.PI, false);

      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Text Label
      const displayText = node.name || '';

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = grammarSettings.labelFont;

      // Add shadow/halo effect for better visibility when text extends beyond node
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw text
      ctx.fillStyle = textColor;
      ctx.fillText(displayText, node.x, node.y);

      // Reset shadow for other elements
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    },
    [colors, grammarSettings]
  );

  const paintLink = useCallback(
    (link, ctx) => {
      if (!link.source || !link.target) return;

      ctx.strokeStyle = colors.defaultLink;
      ctx.lineWidth = 1;

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
      fgRef.current.d3Force(
        'collision',
        forceCollide(
          grammarSettings.nodeRadius * grammarSettings.collisionRadiusMultiplier
        ).iterations(grammarSettings.collisionIterations)
      );
      // Disable center force in DAG mode to avoid conflicts
      fgRef.current.d3Force('center', null);
      fgRef.current.d3Force('link').distance(grammarSettings.linkDistance);
      fgRef.current.d3Force('charge').strength(grammarSettings.chargeStrength);
      fgRef.current.d3ReheatSimulation();
    }
  }, [tree, grammarSettings, lockNodeAfterDrag]);

  const handleNodeDrag = useCallback(
    (node) => {
      if (lockNodeAfterDrag) {
        node.fx = node.x;
        node.fy = node.y;
      }
    },
    [lockNodeAfterDrag]
  );

  const handleNodeDragEnd = useCallback(
    (node) => {
      if (lockNodeAfterDrag) {
        node.fx = node.x;
        node.fy = node.y;
      } else {
        node.fx = undefined;
        node.fy = undefined;
        fgRef.current?.d3ReheatSimulation();
      }
    },
    [lockNodeAfterDrag]
  );

  return (
    <div
      className={`GraphDiv shadow-sm ${isFlashing ? 'flashing' : ''}`}
      ref={containerRef}
      style={{ backgroundColor: colors.canvasBackgroundColor, height: '500px' }}
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
      </div>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        // Layout
        dagMode="td"
        dagLevelDistance={grammarSettings.dagLevelDistance}
        // Physics
        cooldownTime={grammarSettings.cooldownTime}
        d3AlphaDecay={grammarSettings.d3AlphaDecay}
        // Interaction
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        // Rendering Props
        nodeRelSize={grammarSettings.nodeRadius}
        linkDirectionalArrowLength={grammarSettings.linkDirectionalArrowLength}
        linkDirectionalArrowRelPos={1}
        // Custom Painters
        linkCanvasObjectMode={MODE_REPLACE}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={MODE_AFTER}
        nodeCanvasObject={paintNode}
        // Events
        onNodeHover={handleNodeHover}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
      />
    </div>
  );
}

DerivationTreeVisual.propTypes = {
  tree: PropTypes.object,
  fitTrigger: PropTypes.number,
  lockNodeAfterDrag: PropTypes.bool,
};
