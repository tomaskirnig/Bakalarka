import React, { useRef, useEffect, useState } from "react";

export function TreeCanvas({ tree, highlightedNode, evaluatedResult, completedSteps = [] , forceCenterNode }) {
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Compute Positions & Assign Parent Pointers 
  const computePositions = (node, depth = 0, nextPos = { value: 0 }) => {
    if (!node) return;
    const verticalSpacing = 100;  // vertical gap between levels
    const horizontalSpacing = 40; // horizontal gap between leaves

    // Process children first.
    if (node.left) {
      computePositions(node.left, depth + 1, nextPos);
      // Set parent pointer if needed.
      node.left.parent = node;
    }
    if (node.right) {
      computePositions(node.right, depth + 1, nextPos);
      node.right.parent = node;
    }

    // If the node is a leaf, assign an x based on the counter.
    if (!node.left && !node.right) {
      node.x = nextPos.value * horizontalSpacing;
      nextPos.value++;
    } else if (node.left && node.right) {
      // Center the node above its two children.
      node.x = (node.left.x + node.right.x) / 2;
    } else if (node.left) {
      // Only left child: position slightly to the right.
      node.x = node.left.x + horizontalSpacing / 2;
    } else if (node.right) {
      // Only right child: position slightly to the left.
      node.x = node.right.x - horizontalSpacing / 2;
    }
    // Y coordinate based on depth (with a top margin of 50).
    node.y = depth * verticalSpacing + 50;
  };

  const drawAllEdges = (ctx, node) => {
    if (!node) return; // If the node is null, exit
  
    const isSingleChild = (node.left && !node.right) || (!node.left && node.right);
    const leftOffset = isSingleChild ? 6 : 0;
    const rightOffset = isSingleChild ? -6 : 0;
  
    // Draw edges for left child
    if (node.left) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.left.x, node.left.y);
      ctx.strokeStyle = "#333"; 
      ctx.lineWidth = 1;
      ctx.stroke();
    
      // Draw second offset line for single-child nodes
      if (isSingleChild) {
        ctx.beginPath();
        ctx.moveTo(node.x + leftOffset, node.y + 2);
        ctx.lineTo(node.left.x + leftOffset, node.left.y + 2);
        ctx.stroke();
      }
  
      drawAllEdges(ctx, node.left); 
    }
  
    // Draw edges for right child
    if (node.right) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.right.x, node.right.y);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();
    
      // Draw second offset line for single-child nodes
      if (isSingleChild) {
        ctx.beginPath();
        ctx.moveTo(node.x + rightOffset, node.y + 2);
        ctx.lineTo(node.right.x + rightOffset, node.right.y + 2);
        ctx.stroke();
      }
  
      drawAllEdges(ctx, node.right); 
    }
  };
  
  // Draw Completed Labels
  // For every step in completedSteps, draw its evaluated result on the connecting edge.
  const drawCompletedLabels = (ctx) => {
    completedSteps.forEach((step) => {
      const node = step.node;
      if (node.parent) {
        ctx.fillStyle = "red";
        ctx.font = `${14 * scale}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          String(step.result),
          (node.parent.x + node.x) / 2,
          (node.parent.y + node.y) / 2 - 5
        );
      } else {
        // For the root node, draw the result above it.
        ctx.fillStyle = "red";
        ctx.font = `${14 * scale}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(step.result), node.x, node.y - 30);
      }
    });
  };

  // Draw Nodes 
  const drawNodes = (ctx, node) => {
    if (!node) return;
    const nodeRadius = 20 * scale;
    
    // Draw node circle.
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    // ctx.fillStyle = node === highlightedNode ? "#FFD700" : "#07393C";
    ctx.fillStyle = "#07393C";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw node value.
    ctx.fillStyle = "#F0EDEE";
    ctx.font = `${14 * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${node.value}${node.varValue !== null ? `[${node.varValue}]` : ""}`,
      node.x,
      node.y
    );

    drawNodes(ctx, node.left);
    drawNodes(ctx, node.right);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Clear canvas.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Compute positions for all nodes.
    if (tree) {
      computePositions(tree); //, canvas.width / 2 / scale, 50 / scale, 1, null
    } else {
      console.warn("Tree is null or undefined");
    }

    // Draw all normal edges.
    if (tree) drawAllEdges(ctx, tree, null);

    // Draw completed evaluated labels even from previous steps.
    drawCompletedLabels(ctx);

    // Overlay the current highlighted edge (if any).
    if (highlightedNode && highlightedNode.parent) {
      ctx.beginPath();
      ctx.moveTo(highlightedNode.parent.x, highlightedNode.parent.y);
      ctx.lineTo(highlightedNode.x, highlightedNode.y);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (highlightedNode && !highlightedNode.parent) {
      // If the root is highlighted, show its result above.
      ctx.fillStyle = "red";
      ctx.font = `${14 * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(evaluatedResult), highlightedNode.x, highlightedNode.y - 30);
    }

    // Draw nodes on top.
    if (tree) drawNodes(ctx, tree);

    ctx.restore();
  }, [tree, offset, scale, highlightedNode, evaluatedResult, completedSteps]);

  // Center on the highlighted node when it changes.
  useEffect(() => {
    if (highlightedNode && forceCenterNode.current === false) {
      const canvas = canvasRef.current;
      // const canvasWidth = canvas.width;
      // const canvasHeight = canvas.height;

      setOffset({
        x: canvas.width / 2 - highlightedNode.x * scale,
        y: canvas.height / 2 - highlightedNode.y * scale,
      });
      
      // Mark that we've performed the centering once.
      forceCenterNode.current = true;
    }
  }, [highlightedNode, forceCenterNode]);

  // Mouse and Zoom Handlers 
  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setDragging(false);

  const handleZoom = (direction) => {
    setScale((prevScale) => Math.max(0.1, prevScale + direction * 0.1));
  };

  const handleCenter = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div>
        <button className="btn btn-primary m-1 mb-2" onClick={() => handleZoom(1)}>
          +
        </button>
        <button className="btn btn-primary m-1 mb-2" onClick={() => handleZoom(-1)}>
          -
        </button>
        <button className="btn btn-primary m-1 mb-2" onClick={handleCenter}>
          Center
        </button>        
      </div>
      <canvas
        ref={canvasRef}
        width="1000"
        height="600"
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          cursor: dragging ? "grabbing" : "grab",
          marginBottom: "10px",
          transition: "transform 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      ></canvas>
    </div>
  );
}

export default TreeCanvas;
