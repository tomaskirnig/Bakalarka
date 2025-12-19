import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import PropTypes from 'prop-types';
import ForceGraph2D from "react-force-graph-2d";
import { useGraphColors } from "../../Hooks/useGraphColors";
import { useGraphSettings } from "../../Hooks/useGraphSettings";

// Constant accessor functions to prevent re-renders of the graph engine
const MODE_REPLACE = () => "replace";
const MODE_AFTER = () => "after";

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
export function TreeCanvas({
  tree,
  highlightedNode = null, // Node to highlight (e.g. from converter)
  activeNode = null,      // Node currently being evaluated (step-by-step)
  completedSteps = [],    // Steps with results to display
  width,
  height
}) {
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for the container div
  const idCounter = useRef(0);
  
  // Dimensions State
  const [internalDimensions, setInternalDimensions] = useState({ width: 0, height: 0 });

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

  // 1. Prepare Graph Data
  // useMemo ensures we only regenerate the graph topology when tree/steps change.
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const visited = new Set();
    
    function traverse(current, parent) {
      if (!current) return;
      
      // Ensure ID exists on the node object itself
      if (current.id === undefined || current.id === null) {
        current.id = idCounter.current++;
      }

      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }
      
      if (visited.has(current.id)) return;
      visited.add(current.id);
      
      // Reset temporary display properties
      current.evaluationResult = undefined;
      
      nodes.push(current);
  
      if (current.children && Array.isArray(current.children)) {
        current.children.forEach(child => {
          if (child) traverse(child, current);
        });
      } 
    }

    traverse(tree, null);

    // Apply evaluation results from completed steps
    if (completedSteps && completedSteps.length > 0) {
      completedSteps.forEach((step) => {
        if (!step || !step.node) return;
        const targetNode = nodes.find((nd) => nd.id === step.node.id);
        if (targetNode) {
          targetNode.evaluationResult = step.result;
        }
      });
    }

    // Pre-calculate neighbors for efficient hover lookup
    // Map IDs to node objects first
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Initialize neighbor arrays
    nodes.forEach(n => {
      n.neighbors = [];
      n.links = [];
    });

    // Populate relationships
    links.forEach(link => {
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

    return { nodes, links };
  }, [tree]);

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
    hoverNode.current = node || null;
    highlightNodes.current.clear();
    highlightLinks.current.clear();

    if (node) {
      highlightNodes.current.add(node);
      if (node.neighbors) {
        node.neighbors.forEach(neighbor => highlightNodes.current.add(neighbor));
      }
      if (node.links) {
        node.links.forEach(link => highlightLinks.current.add(link));
      }
    }

    if (containerRef.current) {
        containerRef.current.style.cursor = node ? 'pointer' : 'grab';
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
    
    if (containerRef.current) {
        containerRef.current.style.cursor = link ? 'pointer' : 'grab';
    }
  }, []);

  // 3. Paint Functions
  
  const paintNode = useCallback((node, ctx) => {
    if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;

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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = mcvp.labelFont;
    ctx.fillText(displayText, node.x, node.y);
    
    // Result Label (above node)
    const result = resultsMap.get(node.id);
    if (result !== undefined) {
      ctx.fillStyle = 'red';
      ctx.fillText(`${result}`, node.x, node.y - mcvp.resultLabelOffsetMultiplier * mcvp.nodeRadius);
    } else if (node.rootLabel !== undefined) {
      ctx.fillStyle = 'red';
      ctx.fillText(`${node.rootLabel}`, node.x, node.y - mcvp.resultLabelOffsetMultiplier * mcvp.nodeRadius);
    }
    
  }, [highlightedNode, activeNode, colors, mcvp, resultsMap]);

  const paintLink = useCallback((link, ctx) => {
    if (!link.source || !link.target) return;
    
    const isHighlighted = highlightLinks.current.has(link);
    
    ctx.strokeStyle = isHighlighted ? colors.accentRed : colors.defaultLink;
    ctx.lineWidth = isHighlighted ? 3 : 1;
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  }, [colors]);

  // 4. Effects
  
  // Initial Forces Setup
  useEffect(() => {
    if (fgRef.current) {
      // Add collision force to prevent overlap
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force('collision', window.d3.forceCollide(mcvp.nodeRadius * graphData.nodes.length * mcvp.collisionRadiusMultiplier).iterations(graphData.nodes.length)); 
      }
      fgRef.current.d3Force('link').distance(mcvp.linkDistance);
      fgRef.current.d3Force('charge').strength(mcvp.chargeStrength);
    }
  }, [tree, mcvp, graphData]); // Re-run if tree or graphData changes (new simulation)

  // Focus Camera on Active Node
  useEffect(() => {
    if (activeNode && fgRef.current) {
         // We need to find the node object in the current graph data to get (x,y)
         const node = graphData.nodes.find(n => n.id === activeNode.id);
         if (node && typeof node.x === 'number' && typeof node.y === 'number') {
             fgRef.current.centerAt(node.x, node.y, 500);
         }
    }
  }, [activeNode, graphData]);

  return (
    <div className="GraphDiv" ref={containerRef} style={{ backgroundColor: colors.canvasBackgroundColor }}>
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
        width={canvasWidth}
        height={canvasHeight}
        graphData={graphData}
        
        // Layout
        dagMode="td"
        dagLevelDistance={mcvp.dagLevelDistance}
        
        // Physics
        cooldownTime={mcvp.cooldownTime}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        autoPauseRedraw={false}
        
        // Interaction
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        
        // Rendering Props
        nodeRelSize={mcvp.nodeRadius} // Matches paintNode radius
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        
        // Custom Painters
        linkCanvasObjectMode={MODE_REPLACE}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={MODE_AFTER}
        nodeCanvasObject={paintNode}
        
        // Events
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
      />
    </div>
  );
}

TreeCanvas.propTypes = {
  tree: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    value: PropTypes.any,
    varValue: PropTypes.any,
    children: PropTypes.array
  }),
  highlightedNode: PropTypes.object,
  activeNode: PropTypes.object,
  completedSteps: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number
};
