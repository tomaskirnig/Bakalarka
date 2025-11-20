import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import PropTypes from 'prop-types';
import ForceGraph2D from "react-force-graph-2d";

// Colors
const highlightLinkColor = "red";
const defaultLinkColor = "rgba(0,0,0,0.5)";
const highlightNodeColor = "#90DDF0";
const defaultNodeColor = "#438c96"; 
const nodeStrokeColor = "#333";
const nodeTextColor = "#fff";

export function TreeCanvas({
  tree,
  highlightedNode = [],
  completedSteps = [],
}) {
  const fgRef = useRef();
  const idCounter = useRef(0);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
    
  // Convert tree structure to data structure for ForceGraph
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const visited = new Set();

    function traverse(current, parent) {
      if (!current || visited.has(current.id)) return;
      
      // Generate ID if not exists
      if (!current.id) {
        current.id = `n${idCounter.current++}`;
      }
      
      visited.add(current.id);
      
      nodes.push(current);
  
      // Link from parent -> current
      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }
  
      // Traverse children
      if (current.children && Array.isArray(current.children)) {
        current.children.forEach(child => {
          if (child) traverse(child, current);
        });
      } 
    }

    traverse(tree, null);

    // Process completed steps
    if (completedSteps && completedSteps.length > 0) {
      completedSteps.forEach((step) => {
        if (!step || !step.node) return;
        
        const n = step.node;
        const targetNode = nodes.find((nd) => nd.id === n.id);
        if (targetNode) {
          targetNode.rootLabel = step.result;
        }
      });
    }

    // Convert link endpoints to node objects and setup neighbor relationships
    const nodeMap = {};
    nodes.forEach(n => {
      nodeMap[n.id] = n;
      n.neighbors = [];
      n.links = [];
    });
    
    links.forEach(link => {
      const sourceNode = nodeMap[link.source];
      const targetNode = nodeMap[link.target];
      
      link.source = sourceNode;
      link.target = targetNode;
      
      // Setup bidirectional neighbors
      sourceNode.neighbors.push(targetNode);
      targetNode.neighbors.push(sourceNode);
      sourceNode.links.push(link);
      targetNode.links.push(link);
    });

    return { nodes, links };
  }, [tree, completedSteps]);
  
  // Node rendering 
  const paintNode = useCallback((node, ctx) => {
    if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;
    
    const r = 12; 
    const isHighlighted = highlightNodes.has(node);
    const isHovered = hoverNode && hoverNode.id === node.id;
    
    // Add glow effect for highlighted nodes
    if (isHighlighted || isHovered) {
      ctx.shadowColor = isHovered ? '#FFD700' : '#90DDF0';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

    // Color based on state
    if (highlightedNode && node.id === highlightedNode.id) {
      ctx.fillStyle = highlightNodeColor;
    } else if (isHovered) {
      ctx.fillStyle = '#FFD700'; // Gold for hovered
    } else if (isHighlighted) {
      ctx.fillStyle = '#90DDF0'; // Light blue for connected
    } else {
      ctx.fillStyle = defaultNodeColor;
    }
    
    ctx.fill();
    ctx.strokeStyle = isHighlighted || isHovered ? '#333' : nodeStrokeColor;
    ctx.lineWidth = isHighlighted || isHovered ? 2 : 1;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    let displayText = '';
    
    // Check if it's a variable (starts with x)
    if (typeof node.value === 'string' && node.value.startsWith('x')) {
      // Format as x1[0]
      displayText = `${node.value}${node.varValue !== undefined ? `[${node.varValue}]` : ''}`;
    } 
    // Check if it's an AND operation
    else if (node.value === 'AND' || node.value === '∧' || node.value === 'A') {
      displayText = 'A';
    }
    // Check if it's an OR operation
    else if (node.value === 'OR' || node.value === '∨' || node.value === 'O') {
      displayText = 'O';
    }
    // For other types, use the value as is
    else {
      displayText = node.value || '';
    }
    
    // Draw the text inside the circle
    ctx.fillStyle = nodeTextColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `monospace`;
    ctx.fillText(displayText, node.x, node.y);
    
    // If there's a root label, show it above the node
    if (node.rootLabel) {
      ctx.fillText(`=> ${node.rootLabel}`, node.x, node.y - 2 * r);
    }
    
  }, [highlightedNode, highlightNodes, hoverNode]); 

  const paintLink = useCallback((link, ctx) => {
    if (!link.source || !link.target) return;
    
    const isHighlighted = highlightLinks.has(link);
    
    ctx.strokeStyle = isHighlighted ? highlightLinkColor : defaultLinkColor;
    ctx.lineWidth = isHighlighted ? 3 : 1;
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  }, [highlightLinks]);

  const handleNodeHover = useCallback((node) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (node) {
      newHighlightNodes.add(node);
      
      // Add all neighbors
      if (node.neighbors) {
        node.neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
      }
      
      // Add all connected links
      if (node.links) {
        node.links.forEach(link => newHighlightLinks.add(link));
      }
    }

    setHoverNode(node || null);
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []); 

  const handleLinkHover = useCallback((link) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();
    
    if (link) {
      newHighlightLinks.add(link);
      if (link.source) newHighlightNodes.add(link.source);
      if (link.target) newHighlightNodes.add(link.target);
    }
    
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    setHoverNode(null);
  }, []);

  // Initialize graph
  useEffect(() => {
    if (fgRef.current) {
      // Set up forces once
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force('collision', window.d3.forceCollide(30).iterations(3)); 
      }
      
      fgRef.current.d3Force('link').distance(100);
      fgRef.current.d3Force('charge').strength(-200);
      
      // After initial layout, center the graph
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 50);
        }
      }, 3500);
    }
  }, [tree]);



  // Function for larger hitboxes
  const paintNodeHitbox = useCallback((node, color, ctx) => {
    const hitboxRadius = 15; 
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, hitboxRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }, []);

  // Add linkCanvasObjectMode and linkCanvasObject to ForceGraph2D
  return (
    <div className="GraphDiv">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        // onEngineStop={handleEngineStop}
        dagMode="td"
        dagLevelDistance={100}
        cooldownTime={3000}   
        d3AlphaDecay={0.02}    
        d3VelocityDecay={0.3}  
        nodeRelSize={8}
        autoPauseRedraw={false}
        // d3Force={configureForces}

        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        
        // Add these for custom link rendering
        linkCanvasObjectMode={() => "replace"}
        linkCanvasObject={paintLink}

        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={paintNode}

        // Custom node hitbox (invisible, larger area for mouse interaction)
        nodePointerAreaPaint={paintNodeHitbox}

        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}

        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        warmupTicks={100}
        cooldownTicks={0}
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
  highlightedNode: PropTypes.array,
  completedSteps: PropTypes.array
};

