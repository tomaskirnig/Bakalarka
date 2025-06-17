import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";

// Colors
const highlightLinkColor = "red";
const normalLinkColor = "rgba(0,0,0,0.5)";
const highlightNodeColor = "#90DDF0";
const normalNodeColor = "#438c96"; 
const nodeStrokeColor = "#333";
const nodeTextColor = "#fff";

// Force configuration function to prevent node overlapping
const configureForces = (forceName, forceInstance) => {
  // Link force for greater distance
  if (forceName === 'link') {
    forceInstance
      .distance(() => 150)  // Increased from 120
      .strength(0.7);       // Slightly reduced for more flexibility
  }
  
  // Charge force for node repulsion
  if (forceName === 'charge') {
    forceInstance.strength(-400);  // Increased from -300
  }
  
  // Collision force to prevent overlapping
  if (forceName === 'collision') {
    // Use this callback to create a new force if it doesn't exist
    return forceInstance || 
      (window.d3 && window.d3.forceCollide ? 
        window.d3.forceCollide(node => 35).iterations(5) : // Increased from 30, iterations from 3
        null);
  }
  
  // Configure center force to keep graph centered
  if (forceName === 'center') {
    forceInstance.strength(0.3);  // Reduced slightly from 0.4
  }
};

export function TreeCanvas({
  tree,
  highlightedNode,
  completedSteps = [],
}) {
  const fgRef = useRef();
  const idCounter = useRef(0);
  
  // Track highlighted links separately to avoid re-renders
  // const [highlightLinks, setHighlightLinks] = useState(new Set());
  
  // Graph data construction with useMemo
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];

    function traverse(current, parent) {
      if (!current) return;
      
      if (!current.id) {
        current.id = `n${idCounter.current++}`;
      }
      
      // Add this node to node list
      const node = {
        id: current.id, 
        value: current.value,
        varValue: current.varValue,
        nodeRef: current,
        parentId: parent ? parent.id : null
      };
      
      nodes.push(node);
    
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

    // Process completed steps
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
  
  // Update highlight links when highlighted node changes
  // but with proper dependencies to avoid render loops
  // useEffect(() => {
  //   // Skip if no highlighted node
  //   if (!highlightedNode) {
  //     setHighlightLinks(new Set());
  //     return;
  //   }
    
  //   // Extract primitives to work with
  //   const nodeId = highlightedNode.id;
  //   const parentId = highlightedNode.parent?.id;
    
  //   if (!parentId) {
  //     setHighlightLinks(new Set());
  //     return;
  //   }
    
  //   // Find the link between highlightedNode and its parent
  //   const highlightedLink = graphData.links.find(link => {
  //     if (typeof link.source === 'object' && typeof link.target === 'object') {
  //       return link.source.id === parentId && link.target.id === nodeId;
  //     }
  //     return false;
  //   });
    
  //   // Update the highlights set instead of rerendering everything
  //   if (highlightedLink) {
  //     setHighlightLinks(new Set([highlightedLink]));
  //   } else {
  //     setHighlightLinks(new Set());
  //   }
  // }, [highlightedNode?.id, highlightedNode?.parent?.id]); // Just use IDs, not object references

  // Node rendering 
  const paintNode = useCallback((node, ctx) => {
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
    
    // If there's a root label, show it above the node
    if (node.rootLabel) {
      ctx.fillText(`=> ${node.rootLabel}`, node.x, node.y - 2 * r);
    }
    
  }, [highlightedNode?.id]); 

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
  }, [graphData]);

  // Focus on highlighted node
  // useEffect(() => {
  //   if (!highlightedNode || !fgRef.current || !forceCenterNode) return;
    
  //   if (forceCenterNode.current === false) {
  //     const timer = setTimeout(() => {
  //       if (fgRef.current) {
  //         try {
  //           fgRef.current.zoomToFit(400, 480, node => 
  //             node.id === highlightedNode.id
  //           );
  //           forceCenterNode.current = true;
  //         } catch (err) {
  //           console.error("Error zooming to node:", err);
  //         }
  //       }
  //     }, 300);
      
  //     return () => clearTimeout(timer);
  //   }
  // }, [highlightedNode?.id]);

  return (
    <div className="GraphDiv">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        dagMode="td"
        centerAt = {{ }}
        dagLevelDistance={100}
        cooldownTime={3000}   
        d3AlphaDecay={0.02}    
        d3VelocityDecay={0.3}  
        nodeRelSize={8}
        d3Force={configureForces}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        
        // linkColor={link => highlightLinks.has(link) ? highlightLinkColor : normalLinkColor}
        // linkWidth={link => highlightLinks.has(link) ? 3 : 1}
        
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={paintNode}
      />
    </div>
  );
}
