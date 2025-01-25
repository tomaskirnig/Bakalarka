import React, { useRef, useEffect, useState } from "react";

export function TreeCanvas({ tree }) {
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const drawTree = (ctx, node, x, y, level = 1) => {
    if (!node) return;
  
    const nodeRadius = 20 * scale;
    const verticalSpacing = 100 * scale; // Vertical distance between levels
    const horizontalSpacing = 300 / level * scale; // Horizontal distance
  
    const childY = y + verticalSpacing; // Child node vertical position
    const leftX = x - horizontalSpacing; // Left child horizontal position
    const rightX = x + horizontalSpacing; // Right child horizontal position
  
    // Draw connections to children
    if (node.left && node.right) {
      // Case: Node has two children
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(leftX, childY);
      ctx.stroke();
  
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(rightX, childY);
      ctx.stroke();
    } else if (node.left || node.right) {
      // Case: Node has only one child
      const singleChildX = node.left ? leftX : rightX;
  
      // Draw first line (left offset)
      ctx.beginPath();
      ctx.moveTo(x - 6, y); // Larger left offset
      ctx.lineTo(singleChildX - 6, childY);
      ctx.strokeStyle = "#333";
      ctx.stroke();
  
      // Draw second line (right offset)
      ctx.beginPath();
      ctx.moveTo(x + 6, y); // Larger right offset
      ctx.lineTo(singleChildX + 6, childY);
      ctx.stroke();
    }
  
    // Draw node circle
    ctx.beginPath();
    ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#07393C";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();
  
    // Draw node value
    ctx.fillStyle = "#F0EDEE";
    ctx.font = `${14 * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${node.value}${node.varValue !== null ? `[${node.varValue}]` : ""}`,
      x,
      y
    );
  
    // Recursively draw children
    if (node.left) drawTree(ctx, node.left, leftX, childY, level + 1);
    if (node.right) drawTree(ctx, node.right, rightX, childY, level + 1);
  };
  

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw the tree
    if (tree) {
      drawTree(ctx, tree, canvas.width / 2 / scale, 50 / scale);
    } else {
      console.warn("Tree is null or undefined");
    }

    ctx.restore();
  }, [tree, offset, scale]);

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
    setOffset({ x: 0, y: 0 }); // Reset offset to the default
    setScale(1); // Reset scale to the default
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <button className="btn btn-primary" onClick={() => handleZoom(1)}>
          +
        </button>
        <button className="btn btn-primary" onClick={() => handleZoom(-1)}>
          -
        </button>
        <button className="btn btn-secondary" onClick={handleCenter}>
          Center
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width="800"
        height="600"
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      ></canvas>
    </div>
  );
}

