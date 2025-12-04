import React, { useRef, useEffect, useState } from 'react';
import { useGraphColors } from '../../Hooks/useGraphColors';

/**
 * NetworkVisual component renders a canvas with animated network visualization
 */
const NetworkVisual = ({
  nodeCount = 30,
  connectDistance = 300,
  linkColor,
  nodeColor,
  backgroundColor,
  overlayColor = "rgba(0, 0, 0, 0.3)",
  zIndex = -1,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [nodes, setNodes] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const colors = useGraphColors();
  const effectiveLinkColor = linkColor || colors.linkColor;
  const effectiveNodeColor = nodeColor || colors.nodeColor;
  const effectiveBgColor = backgroundColor || colors.backgroundColor;

  class Node {
    constructor(x, y, radius, moveX, moveY) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.moveX = moveX;
      this.moveY = moveY;
    }

    draw(ctx, color) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      this.move();
    }

    move() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let finalX = this.x + this.moveX;
      let finalY = this.y + this.moveY;
      
      // X boundary
      if (finalX - this.radius < 0 || finalX + this.radius > canvas.width) {
        this.moveX *= -1;
        finalX = this.x + this.moveX;
      } 
      
      // Y boundary
      if (finalY - this.radius < 0 || finalY + this.radius > canvas.height) {
        this.moveY *= -1;
        finalY = this.y + this.moveY;
      } 

      if ((this.x < 0 || this.x > canvas.width) || (this.y < 0 || this.y > canvas.height)) {
        this.x = Math.random() * 10 + 20;
        this.y = Math.random() * 10 + 20;
      }
      
      this.x = finalX;
      this.y = finalY;
    }
  }

  // Initialize nodes
  const initNodes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newNodes = [];
    for (let i = 0; i < nodeCount; i++) {
      let x = Math.random() * canvas.width;
      let y = Math.random() * canvas.height;
      let radius = Math.random() * 8 + 10;
      let moveX = ((Math.random() * 2) - 1);
      let moveY = ((Math.random() * 2) - 1);
      
      newNodes.push(new Node(x, y, radius, moveX, moveY));
    }
    
    setNodes(newNodes);
  };

  // Resize handler
  const handleResize = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  // Draw all nodes
  const drawAll = (ctx) => {
    nodes.forEach(node => node.draw(ctx, effectiveNodeColor));
  };

  // Draw edges between nodes
  const drawEdges = (ctx) => {
    for (let i = 0; i < nodes.length; i++) {
      for (let ii = i+1; ii < nodes.length; ii++) {
        let dist = Math.sqrt(
          Math.pow(nodes[i].x - nodes[ii].x, 2) + 
          Math.pow(nodes[i].y - nodes[ii].y, 2)
        );

        if (dist < connectDistance) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[ii].x, nodes[ii].y);
          ctx.strokeStyle = effectiveLinkColor;
          ctx.lineWidth = 5 - ((dist / connectDistance) * 4);
          ctx.stroke();
        }
      }
    }
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawEdges(ctx);
    drawAll(ctx);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Animation frame reference for cleanup
  const animationRef = useRef();

  // Initialize on mount and handle cleanup
  useEffect(() => {
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Update canvas dimensions when container size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }
  }, [dimensions]);

  // Initialize nodes when canvas dimensions are set
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && nodes.length === 0) {
      initNodes();
    }
  }, [dimensions]);

  // Start animation when nodes are initialized
  useEffect(() => {
    if (nodes.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: zIndex,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          padding: 0,
          margin: 0,
          backgroundColor: effectiveBgColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: overlayColor,
        }}
      />
    </div>
  );
};

export default NetworkVisual;