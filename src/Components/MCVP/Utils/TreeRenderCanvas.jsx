import React, { useRef, useEffect, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";

// Colors
const highlightLinkColor = "red";
const normalLinkColor = "rgba(0,0,0,0.5)";
const highlightNodeColor = "yellow";
const normalNodeColor = "#07393C";
const nodeStrokeColor = "#333";
const nodeTextColor = "#fff";
const playerLabelColor = "black";

// Link color function - determines if a link should be highlighted
const getLinkColor = (link, highlightedNode) => {
  if (
    highlightedNode &&
    highlightedNode.parent &&
    typeof link.source === 'object' && 
    typeof link.target === 'object' &&
    link.source.id === highlightedNode.parent.id &&
    link.target.id === highlightedNode.id
  ) {
    return highlightLinkColor;
  }
  return normalLinkColor;
};

// Link width function - determines if a link should be thicker
const getLinkWidth = (link, highlightedNode) => {
  if (
    highlightedNode &&
    highlightedNode.parent &&
    typeof link.source === 'object' && 
    typeof link.target === 'object' &&
    link.source.id === highlightedNode.parent.id &&
    link.target.id === highlightedNode.id
  ) {
    return 3;
  }
  return 1;
};

// Node canvas object function - draws the node and its labels
const renderNode = (node, ctx, globalScale, highlightedNode) => {
  if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;
  
  const r = 12; 
  
  // Draw circle
  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
  
  // Highlight node if it's the currently highlightedNode
  if (highlightedNode && node.id === highlightedNode.id) {
    ctx.fillStyle = highlightNodeColor;
  } else {
    ctx.fillStyle = normalNodeColor;
  }
  ctx.fill();
  ctx.strokeStyle = nodeStrokeColor;
  ctx.stroke();
  
  // Determine what text to display inside the node
  let displayText = '';
  
  // Check if it's a variable (starts with x)
  if (typeof node.value === 'string' && node.value.startsWith('x')) {
    // Format as x1[0]
    displayText = `${node.value}${node.varValue !== undefined ? `[${node.varValue}]` : ''}`;
  } 
  // Check if it's an AND operation
  else if (node.value === 'AND' || node.value === '∧') {
    displayText = 'A';
  }
  // Check if it's an OR operation
  else if (node.value === 'OR' || node.value === '∨') {
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
  
  // If there's a root label, show it above the node (don't show variable value again)
  if (node.rootLabel) {
    ctx.fillText(`=> ${node.rootLabel}`, node.x, node.y - 2 * r);
  }
  
  // Draw the player label below the node if applicable
  if (node.player) {
    ctx.font = `monospace`;
    ctx.fillStyle = playerLabelColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.player === 1 ? 'I' : node.player === 2 ? 'II' : '', node.x, node.y + r + 5);
  }
};

// Force configuration function to prevent node overlapping
const configureForces = (forceName, forceInstance) => {
  // Configure the link force for greater distance
  if (forceName === 'link') {
    forceInstance
      .distance(() => 120)  // Fixed distance between nodes
      .strength(0.8);       // Make links more rigid
  }
  
  // Configure charge force for node repulsion
  if (forceName === 'charge') {
    forceInstance.strength(-300);  // More negative = more repulsion
  }
  
  // Create collision force to prevent overlapping
  if (forceName === 'collision') {
    // Use this callback to create a new force if it doesn't exist
    return forceInstance || 
      (window.d3 && window.d3.forceCollide ? 
        window.d3.forceCollide(node => 30).iterations(3) : 
        null);
  }
  
  // Configure center force to keep graph centered
  if (forceName === 'center') {
    forceInstance.strength(0.4);  // Moderate pull to center
  }
};

export function TreeCanvas({
  tree,
  highlightedNode,
  evaluatedResult,
  completedSteps = [],
  forceCenterNode
}) {
  const fgRef = useRef();
  
  // Graph data construction with useMemo
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];

    function traverse(current, parent) {
      if (!current) return;
      
      // Give each node a unique ID if it doesn't have one
      if (!current.id) {
        current.id = Math.random().toString(36).substring(2, 9);
      }
      
      // Keep a reference to the parent if needed
      current.parent = parent;

      // Add this node to our node list
      nodes.push({
        id: current.id,
        value: current.value,
        varValue: current.varValue,
        nodeRef: current
      });

      // Link from parent -> current
      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }

      // Traverse children
      if (current.left) traverse(current.left, current);
      if (current.right) traverse(current.right, current);
    }

    traverse(tree, null);

    // Process completed steps - store results in the node rather than link labels
    if (completedSteps && completedSteps.length > 0) {
      completedSteps.forEach((step) => {
        if (!step || !step.node) return;
        
        const n = step.node;
        
        // Find the node and set its rootLabel directly
        const targetNode = nodes.find((nd) => nd.id === n.id);
        if (targetNode) {
          targetNode.rootLabel = step.result;
        }
      });
    }

    // Convert link endpoints to node objects
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    
    links.forEach(link => {
      link.source = nodeMap[link.source] || link.source;
      link.target = nodeMap[link.target] || link.target;
    });

    return { nodes, links };
  }, [tree, completedSteps]);

  // Collision detection to prevent node overlapping
  useEffect(() => {
    if (fgRef.current) {
      // window.d3 to avoid direct import
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force('collision', window.d3.forceCollide(node => {
          // Customize collision radius based on node depth in tree
          const depth = node.nodeRef ? 
            (node.nodeRef.parent ? 
              (node.nodeRef.parent.parent ? 30 : 25) : 20) : 25;
          return depth;
        }).iterations(3)); 
      }
      
      // Adjust link distance and charge forces for better spacing
      fgRef.current.d3Force('link').distance(100);
      fgRef.current.d3Force('charge').strength(-200);
      
      // Reheat the simulation to apply the new forces
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]); // Re-run when graphData changes

  // Focus on highlighted node
  useEffect(() => {
    if (!highlightedNode || !fgRef.current || !forceCenterNode) return;
    
    if (forceCenterNode.current === false) {
      const timer = setTimeout(() => {
        if (fgRef.current) {
          try {
            // Then zoom to the node
            // fgRef.current.zoomToFit(400, 400, node => 
            //   node.id === highlightedNode.id
            // );
            forceCenterNode.current = true;
          } catch (err) {
            console.error("Error zooming to node:", err);
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedNode?.id]);

  return (
    <div className="GraphDiv">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        dagMode="td"
        dagLevelDistance={100}
        cooldownTime={3000}   
        d3AlphaDecay={0.02}    
        d3VelocityDecay={0.3}  
        nodeRelSize={8}
        d3Force={configureForces}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkColor={(link) => getLinkColor(link, highlightedNode)}
        linkWidth={(link) => getLinkWidth(link, highlightedNode)}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node, ctx, globalScale) => 
          renderNode(node, ctx, globalScale, highlightedNode)}
      />
    </div>
  );
}
