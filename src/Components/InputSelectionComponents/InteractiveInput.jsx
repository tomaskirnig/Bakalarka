import React, { useRef, useState, useEffect } from "react";
import { Node } from "../../Utils/NodeClass";

const nodeRadius = 20;

const printTree = (node, depth = 0) => {
  if (!node) return;

  // Indent based on the depth of the node
  const indentation = ' '.repeat(depth * 2);
  console.log(`${indentation}- ${node.value} ${node.varValue} (x: ${node.x}, y: ${node.y})`);

  // Recursively print left and right children
  if (node.left) {
    printTree(node.left, depth + 1);
  }
  if (node.right) {
    printTree(node.right, depth + 1);
  }
};

export function TreeBuilderCanvas() {
  const canvasRef = useRef(null);
  const [rootNode, setRootNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [addingNode, setAddingNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [usedVariableIndices, setUsedVariableIndices] = useState(new Set()); // Track used variable indices
  
  // Set the root node when the nodes change
  useEffect(() => {
    const foundRoot = nodes.find((n) => n.parent === null);
    setRootNode(foundRoot || null);
    console.log("New root Node:", foundRoot);
  }, [nodes]);

  // Log the updated tree whenever nodes change
  useEffect(() => {
    console.log("--- Current Tree ---");
    console.log("Root Node:", rootNode);
    printTree(rootNode);
  }, [nodes, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations for movement and scaling
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw edges
    edges.forEach(({ from, to }) => {
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);

        // Double line for single child
        if (from.right === null ^ from.left === null) {
          ctx.lineTo(to.x - 3, to.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(from.x + 3, from.y);
        }

        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = "#333";
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      // Highlight selected node
      if (node === editingNode) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#2C666E"; // Highlight color
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#07393C"; // Consistent node color
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw node text
      ctx.fillStyle = "#F0EDEE";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        node.type === "variable"
          ? `${node.value}[${node.varValue}]`
          : node.value,
        node.x,
        node.y
      );

      // Draw "plus" signs
      if (node.type !== "variable" && node.left === null) {
        drawPlus(ctx, node.x - nodeRadius - 15, node.y + nodeRadius + 10, "left");
      }
      if (node.type !== "variable" && node.right === null) {
        drawPlus(ctx, node.x + nodeRadius + 15, node.y + nodeRadius + 10, "right");
      }
      if (!node.parent) {
        drawPlus(ctx, node.x, node.y - nodeRadius - 15, "parent");
      }
    });

    ctx.restore();
  }, [nodes, edges, editingNode, offset, scale]);

  const getNextVariableName = () => {
    let index = 1; // Start searching from x1
    while (usedVariableIndices.has(index)) {
      index++; // Increment until a free index is found
    }
    setUsedVariableIndices((prev) => new Set(prev).add(index)); // Mark index as used
    return `x${index}`;
  };  

  const releaseVariableName = (label) => {
    const match = label.match(/x(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10);
      setUsedVariableIndices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index); // Mark index as available
        return newSet;
      });
    }
  };
  
  const drawPlus = (ctx, x, y) => {
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("+", x, y);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Check if user clicked on a "plus" sign
    const clickedNode = nodes.find((node) => {
      const isParentPlus = !node.parent && Math.abs(node.x - x) <= 10 && Math.abs(node.y - nodeRadius - 15 - y) <= 10;
      const isLeftPlus = Math.abs(node.x - nodeRadius - 15 - x) <= 10 && Math.abs(node.y + nodeRadius + 10 - y) <= 10;
      const isRightPlus = Math.abs(node.x + nodeRadius + 15 - x) <= 10 && Math.abs(node.y + nodeRadius + 10 - y) <= 10;

      if (isParentPlus || isLeftPlus || isRightPlus) {
        setAddingNode({ node, type: isParentPlus ? "parent" : isLeftPlus ? "left" : "right" });
        setEditingNode(null);
        return true;
      }

      const isWithinNode = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) <= nodeRadius;
      if (isWithinNode) {
        setEditingNode(node);
        setAddingNode(null);
        return true;
      }
      return false;
    });

    if (!clickedNode && nodes.length === 0) {
      // Add a root node
      const rootNode = new Node("operation", null, null, null);
      rootNode.x = x;
      rootNode.y = y;
      rootNode.value = "+";
      setNodes([rootNode]);
      setRootNode(rootNode);
    }else if (!clickedNode && nodes.length > 0) {
      setAddingNode(null);
      setEditingNode(null);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    if (dragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset({ x: dx, y: dy });
    }

    // Change cursor to pointer if hovering over node or plus sign
    const isHovering = nodes.some((node) => {
      const isWithinNode = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) <= nodeRadius;
      const isParentPlus = !node.parent && Math.abs(node.x - x) <= 10 && Math.abs(node.y - nodeRadius - 15 - y) <= 10;
      const isLeftPlus = Math.abs(node.x - nodeRadius - 15 - x) <= 10 && Math.abs(node.y + nodeRadius + 10 - y) <= 10;
      const isRightPlus = Math.abs(node.x + nodeRadius + 15 - x) <= 10 && Math.abs(node.y + nodeRadius + 10 - y) <= 10;
      return isWithinNode || isParentPlus || isLeftPlus || isRightPlus;
    });

    setHovering(isHovering);
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleZoom = (direction) => {
    setScale((prevScale) => Math.max(0.1, prevScale + direction * 0.1));
  };

  const handleCenter = () => {
    setOffset({ x: 0, y: 0 }); // Reset offset to default
    setScale(1); // Reset scale to default
  };

  // const updateNode = (type, varValue = null) => {
  //   if (!editingNode) return;
  
  //   // Prevent changing a parent node with children to a variable
  //   if (
  //     type === "variable" &&
  //     (nodes.some((node) => node.parent === editingNode) || editingNode.left || editingNode.right)
  //   ) {
  //     alert("Cannot change a parent node to a variable.");
  //     return;
  //   }
  
  //   const updatedNodes = nodes.map((node) => {
  //     if (node === editingNode) {
  //       // Create a new node object with updated properties
  //       const updatedNode = {
  //         ...node,
  //         // type,
  //         value: type === "variable" ? node.value : type, // Keep or set label
  //         varValue: type === "variable" ? varValue : null, // Update value only for variables
  //       };
    
  //       if (type === "variable" && node.value === "+") {
  //         updatedNode.value = getNextVariableName();
  //       }
    
  //       return updatedNode; // Return the updated node
  //     }
    
  //     return node; // Return the unchanged node for other cases
  //   });    
  
  //   setNodes(updatedNodes);
  //   setEditingNode(null);
  // };

  const updateNode = (type, varValue = null) => {
    if (!editingNode) return;
  
    // Prevent changing a parent node with children to a variable
    // (this check is presumably still valid for your case)
    if (
      type === "variable" &&
      (nodes.some((node) => node.parent === editingNode) ||
       editingNode.left ||
       editingNode.right)
    ) {
      alert("Cannot change a parent node to a variable.");
      return;
    }
  
    const updatedNodes = nodes.map((node) => {
      if (node === editingNode) {
        const wasVariable = node.type === "variable";
        const isVariable = type === "variable";
  
        // Create a new node object
        const updatedNode = {
          ...node,
          type, // always update the type
          varValue: isVariable ? varValue : null, // if we're now a variable, keep varValue
        };
  
        if (isVariable) {
          // If old type was not variable, assign a new name
          if (!wasVariable) {
            updatedNode.value = getNextVariableName();
          } 
          // If old type was already variable, keep the same name
          else {
            updatedNode.value = node.value;
          }
        } else {
          // For an operator node, just use the type as the label, e.g. "OR"
          updatedNode.value = type;
        }
  
        return updatedNode;
      }
      return node;
    });
  
    setNodes(updatedNodes);
    setEditingNode(null);
  };
  
  
  const addNode = (type, varValue = null) => {
    if (!addingNode) return;
  
    const { node, type: position } = addingNode;
  
    // Ensure variables cannot have children
    if (node.type === "variable" && position !== "parent") {
      alert("Variables cannot have children.");
      return;
    }

    if (type === "variable" && position === "parent") {
      alert("Variables cannot be parent nodes.");
      return;
    }
  
    const newNode = new Node(type, null, null, varValue, null);
    newNode.x = position === "left" ? node.x - 60 : position === "right" ? node.x + 60 : node.x;
    newNode.y = position === "parent" ? node.y - 100 : node.y + 100;
  
    if (type === "variable") {
      newNode.value = getNextVariableName(); // Get next available variable name
      newNode.varValue = varValue;
    } else {
      newNode.value = type;
    }
  
    if (position === "parent") {
      node.parent = newNode;
      newNode.left = node;
      setRootNode(newNode);
      console.log("New root node:", newNode);
    } else {
      if (position === "left") node.left = newNode;
      if (position === "right") node.right = newNode;
    }
  
    setEdges([...edges, { from: node, to: newNode }]);
    setNodes([...nodes, newNode]);
    setAddingNode(null);
  };

  const deleteNode = (nodeToDelete) => {
    if (!nodeToDelete) return;
  
    const deleteRecursive = (node) => {
      // Release variable name if the node is a variable
      if (node.type === "variable") {
        releaseVariableName(node.value);
      }
      
      // Remove references from parent node
      if (node.parent) {
        if (node.parent.left === node) node.parent.left = null;
        if (node.parent.right === node) node.parent.right = null;
      }

      // Delete children recursively
      if (node.left) deleteRecursive(node.left);
      if (node.right) deleteRecursive(node.right);
  
      // Remove edges connected to this node
      setEdges((prevEdges) =>
        prevEdges.filter((edge) => edge.from !== node && edge.to !== node)
      );
  
      // Remove the node itself
      setNodes((prevNodes) => prevNodes.filter((n) => n !== node));
    };
  
    deleteRecursive(nodeToDelete);
  
    // If the node being deleted is the root, clear the root reference
    if (nodeToDelete === rootNode) {
      setRootNode(null);
    }

    // Clear editing state if the node being deleted is currently being edited
    if (editingNode === nodeToDelete) {
      setEditingNode(null);
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", margin: "10px" }}>
        <button className="btn btn-primary mx-1" onClick={() => handleZoom(1)}>Zoom In</button>
        <button className="btn btn-primary mx-1" onClick={() => handleZoom(-1)}>Zoom Out</button>
        <button className="btn btn-primary mx-1" onClick={handleCenter}>Center</button>
      </div>
      <canvas
        ref={canvasRef}
        width="800"
        height="600"
        style={{
          border: "1px solid #ccc",
          display: "block",
          margin: "20px auto",
          cursor: dragging ? "grabbing" : hovering ? "pointer" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      ></canvas>
      {editingNode && (
        <div style={{ textAlign: "center", margin: "10px" }}>
          <p>Editing Node: {editingNode.value}</p>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("AND")}>Change to AND</button>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("OR")}>Change to OR</button>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("variable", 0)}>Change to Variable (0)</button>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("variable", 1)}>Change to Variable (1)</button>
          <button className="btn btn-danger mx-1" onClick={() => deleteNode(editingNode)}>Delete Node</button>
        </div>
      )}
      {addingNode && (
        <div style={{ textAlign: "center", margin: "10px" }}>
          <button className="btn btn-primary mx-1" onClick={() => addNode("AND")}>Add AND</button>
          <button className="btn btn-primary mx-1" onClick={() => addNode("OR")}>Add OR</button>
          <button className="btn btn-primary mx-1" onClick={() => addNode("variable", 0)}>Add Variable (0)</button>
          <button className="btn btn-primary mx-1" onClick={() => addNode("variable", 1)}>Add Variable (1)</button>
        </div>
      )}
    </div>
  );
}
