import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import PropTypes from 'prop-types';
import ForceGraph2D from "react-force-graph-2d";
import { useGraphColors } from "../../Hooks/useGraphColors";

// Constants for visual consistency
const NODE_R = 12;

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
}) {
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for the container div
  const idCounter = useRef(0);
  
  // Dimensions State
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Interaction State
  const [hoverNode, setHoverNode] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  const colors = useGraphColors();

  // ResizeObserver to handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
    };

    // Initial call
    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
        updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 1. Prepare Graph Data
  // useMemo ensures we only regenerate the graph topology when tree/steps change.
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const visited = new Set();

    // Reset ID counter only if we were to generate fresh IDs for a fresh tree, 
    // but we write IDs to the tree objects, so they persist.
    
    function traverse(current, parent) {
      if (!current) return;
      
      // Ensure ID exists on the node object itself
      if (!current.id) {
        current.id = `n${idCounter.current++}`;
      }
      
      if (visited.has(current.id)) return;
      visited.add(current.id);
      
      // Reset ephemeral display properties
      current.evaluationResult = undefined;
      
      nodes.push(current);
  
      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }
  
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
    // We map IDs to node objects first
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
  }, [tree, completedSteps]);

  // 2. Interaction Handlers
  const handleNodeHover = useCallback((node) => {
    if (!node) {
      setHoverNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    newHighlightNodes.add(node);
    if (node.neighbors) {
      node.neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
    }
    if (node.links) {
      node.links.forEach(link => newHighlightLinks.add(link));
    }

    setHoverNode(node);
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []);

  const handleLinkHover = useCallback((link) => {
    if (!link) {
      setHoverNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();
    
    newHighlightLinks.add(link);
    if (link.source) newHighlightNodes.add(link.source);
    if (link.target) newHighlightNodes.add(link.target);
    
    setHoverNode(null);
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []);

  // 3. Paint Functions
  // These depend on the interaction state (hoverNode, etc.)
  // When state changes, these functions update. ForceGraph detects the prop change and repaints.
  
  const paintNode = useCallback((node, ctx) => {
    if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;

    // State-based Styling logic
    const isHovered = hoverNode === node;
    const isNeighbor = highlightNodes.has(node) && !isHovered; 
    const isExternalHighlight = highlightedNode && node.id === highlightedNode.id;
    const isActive = activeNode && node.id === activeNode.id;
    
    const shouldHighlight = isHovered || isNeighbor || isExternalHighlight || isActive;

    // Draw Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI, false);

    // Fill Color
    if (isActive) {
        ctx.fillStyle = colors.activeNode;
    } else if (isHovered) {
        ctx.fillStyle = colors.activeNode;
    } else if (isExternalHighlight) {
        ctx.fillStyle = colors.highlightNode;
    } else if (isNeighbor) {
        ctx.fillStyle = colors.highlightNode;
    } else {
        ctx.fillStyle = colors.defaultNode;
    }
    
    ctx.fill();

    // Stroke
    ctx.strokeStyle = shouldHighlight ? '#333' : colors.nodeStroke;
    ctx.lineWidth = shouldHighlight ? 2 : 1;
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
    ctx.font = `monospace`;
    ctx.fillText(displayText, node.x, node.y);
    
    // Result Label (above node)
    if (node.evaluationResult !== undefined) {
      ctx.fillStyle = 'red';
      ctx.fillText(`${node.evaluationResult}`, node.x, node.y - 1.8 * NODE_R);
    } else if (node.rootLabel !== undefined) {
      ctx.fillStyle = 'red';
      ctx.fillText(`${node.rootLabel}`, node.x, node.y - 1.8 * NODE_R);
    }
    
  }, [hoverNode, highlightNodes, highlightedNode, activeNode, colors]);

  const paintLink = useCallback((link, ctx) => {
    if (!link.source || !link.target) return;
    
    const isHighlighted = highlightLinks.has(link);
    
    ctx.strokeStyle = isHighlighted ? colors.highlightLink : colors.defaultLink;
    ctx.lineWidth = isHighlighted ? 3 : 1;
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  }, [highlightLinks, colors]);

  // 4. Effects
  
  // Initial Forces Setup
  useEffect(() => {
    if (fgRef.current) {
      // Add collision force to prevent overlap
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force('collision', window.d3.forceCollide(NODE_R * 2).iterations(2)); 
      }
      fgRef.current.d3Force('link').distance(100);
      fgRef.current.d3Force('charge').strength(-200);
    }
  }, [tree]); // Re-run if tree changes (new simulation)

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
    <div className="GraphDiv" ref={containerRef}>
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
        graphData={graphData}
        
        // Layout
        dagMode="td"
        dagLevelDistance={100}
        
        // Physics
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        
        // Interaction
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        
        // Rendering Props
        nodeRelSize={NODE_R} // Matches paintNode radius
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
  completedSteps: PropTypes.array
};
