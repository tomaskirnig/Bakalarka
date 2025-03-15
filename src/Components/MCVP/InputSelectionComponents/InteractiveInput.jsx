import React, { useRef, useState, useEffect } from "react";
import { Node } from "../../../Utils/NodeClass";
import { evaluateTree } from "../../../Utils/EvaluateTree";


// Debug print of the tree structure
const printTree = (node, depth = 0) => {
  if (!node) return;

  const indentation = ' '.repeat(depth * 2);
  console.log(`${indentation}- ${node.value} ${node.varValue} `); // (x: ${node.x}, y: ${node.y})

  if (node.left) {
    printTree(node.left, depth + 1);
  }
  if (node.right) {
    printTree(node.right, depth + 1);
  }
};

// Unique ID Generator
let nextId = 1;
function generateId() {
  return nextId++;
}

// Helper Functions for Immutable Tree Updates

// cloneTree: Recursively clone a tree (or subtree)
function cloneTree(node, parent = null) {
  if (!node) return null;
  const newNode = new Node(node.value, null, null, node.varValue, parent, node.type);
  newNode.id = generateId();
  newNode.x = node.x;
  newNode.y = node.y;
  newNode.left = cloneTree(node.left, newNode);
  newNode.right = cloneTree(node.right, newNode);
  return newNode;
}

// Add a child node (or add a new parent) to the node with targetId.
function addChildToTree(node, targetId, position, childToAdd) {
  if (!node) return null;
  if (node.id === targetId) {
    const newNode = cloneTree(node);
    if (position === "parent") {
      // Create a new parent node; the current node becomes its left child.
      const newParent = cloneTree(childToAdd);
      newParent.left = newNode;
      newNode.parent = newParent;
      return newParent;
    } else if (position === "left") {
      if (newNode.left) {
        alert("Left child already exists.");
        return newNode;
      }
      childToAdd.parent = newNode;
      newNode.left = cloneTree(childToAdd, newNode);
    } else if (position === "right") {
      if (newNode.right) {
        alert("Right child already exists.");
        return newNode;
      }
      childToAdd.parent = newNode;
      newNode.right = cloneTree(childToAdd, newNode);
    }
    return newNode;
  }
  // Recurse on children.
  const newNode = cloneTree(node);
  newNode.left = addChildToTree(node.left, targetId, position, childToAdd);
  if (newNode.left) newNode.left.parent = newNode;
  newNode.right = addChildToTree(node.right, targetId, position, childToAdd);
  if (newNode.right) newNode.right.parent = newNode;
  return newNode;
}

// Update the node (identified by targetId) with new values.
function updateNodeInTree(node, targetId, newValue, newVarValue, getNextVariableName) {
  if (!node) return null;
  if (node.id === targetId) {
    const newNode = cloneTree(node);
    if (newValue === "variable") {
      if (newNode.type !== "variable") {
        // If the node isn’t already a variable, assign a new variable name.
        newNode.value = getNextVariableName();
      }
      newNode.type = "variable";
      newNode.varValue = newVarValue;
    } else {
      newNode.value = newValue;
      newNode.type = "operation";
      newNode.varValue = null;
    }
    return newNode;
  }
  const newNode = cloneTree(node);
  newNode.left = updateNodeInTree(node.left, targetId, newValue, newVarValue, getNextVariableName);
  if (newNode.left) newNode.left.parent = newNode;
  newNode.right = updateNodeInTree(node.right, targetId, newValue, newVarValue, getNextVariableName);
  if (newNode.right) newNode.right.parent = newNode;
  return newNode;
}

// Remove the node (and its subtree) identified by targetId.
function deleteNodeFromTree(node, targetId) {
  if (!node) return null;
  if (node.id === targetId) {
    return null;
  }
  const newNode = cloneTree(node);
  newNode.left = deleteNodeFromTree(node.left, targetId);
  if (newNode.left) newNode.left.parent = newNode;
  newNode.right = deleteNodeFromTree(node.right, targetId);
  if (newNode.right) newNode.right.parent = newNode;
  return newNode;
}

// Layout: Compute Render Data from the Tree

// (using BFS) assign each node a render position (renderX, renderY)
function getTreeLayout(root) {
  if (!root) return { nodes: [], edges: [] };
  const queue = [{ node: root, level: 0, index: 1 }];
  const levels = {};
  const nodes = [];
  const edges = [];
  
  while (queue.length > 0) {
    const { node, level, index } = queue.shift();
    if (!levels[level]) levels[level] = [];
    levels[level].push({ node, index });
    nodes.push(node);
    if (node.parent) {
      edges.push({ from: node.parent, to: node });
    }
    if (node.left) {
      queue.push({ node: node.left, level: level + 1, index: index * 2 });
    }
    if (node.right) {
      queue.push({ node: node.right, level: level + 1, index: index * 2 + 1 });
    }
  }
  
  const nodeSpacing = 120;
  const levelHeight = 100;
  
  Object.keys(levels).forEach(lvl => {
    const levelNodes = levels[lvl];
    levelNodes.sort((a, b) => a.index - b.index);
    const minIndex = levelNodes[0].index;
    const maxIndex = levelNodes[levelNodes.length - 1].index;
    const totalWidth = (maxIndex - minIndex) * nodeSpacing;
    levelNodes.forEach(({ node, index }) => {
      node.renderX = (index - minIndex) * nodeSpacing - totalWidth / 2 + root.x;
      node.renderY = parseInt(lvl, 10) * levelHeight + root.y;
    });
  });
  
  return { nodes, edges };
}

// ─── Main React Component ───────────────────────────────────────────────────
export function TreeBuilderCanvas( {onTreeUpdate} ) {
  const canvasRef = useRef(null);
  const [tree, setTree] = useState(null);                     // The entire tree is stored as a single root node.
  const [editingNodeId, setEditingNodeId] = useState(null);   // To know which node is being edited (by its id).
  const [addingNode, setAddingNode] = useState(null);         // When adding a node, store the target node id and the desired position.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  
  // Keep track of used variable names.
  const usedVariableIndicesRef = useRef(new Set());
  
  const getNextVariableName = () => {
    let availableIndices = Array.from(usedVariableIndicesRef.current).sort((a, b) => a - b);
    let index = 1;
    for (let i = 0; i < availableIndices.length; i++) {
      if (availableIndices[i] !== index) break;
      index++;
    }
    usedVariableIndicesRef.current.add(index);
    return `x${index}`;
  };
  
  const releaseVariableName = (label) => {
    const match = label.match(/x(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10);
      usedVariableIndicesRef.current.delete(index);
    }
  };
  
  // Recompute the evaluation result whenever the tree changes.
  useEffect(() => {
    if (tree) {
      try {
        console.log("Evaluationg tree:");
        const result = evaluateTree(tree);
        setEvaluationResult(result);
      } catch (error) {
        console.error("Error evaluating tree:", error);
        setEvaluationResult(null);
      }
    } else {
      setEvaluationResult(null);
    }
  }, [tree]);
  
  // ─── Canvas Rendering ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear the canvas.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    const { nodes: derivedNodes, edges } = tree ? getTreeLayout(tree) : { nodes: [], edges: [] };
    
    // Draw edges.
    edges.forEach(({ from, to }) => {
      if (from && to) {
        if ((from.left === null) !== (from.right === null)) {
          // Draw left offset line.
          ctx.beginPath();
          ctx.moveTo(from.renderX - 3, from.renderY);
          ctx.lineTo(to.renderX - 3, to.renderY);
          ctx.strokeStyle = "#333";
          ctx.stroke();
        
          // Draw right offset line.
          ctx.beginPath();
          ctx.moveTo(from.renderX + 3, from.renderY);
          ctx.lineTo(to.renderX + 3, to.renderY);
          ctx.stroke();
        } else {
          // For nodes with two children, draw a single line.
          ctx.beginPath();
          ctx.moveTo(from.renderX, from.renderY);
          ctx.lineTo(to.renderX, to.renderY);
          ctx.strokeStyle = "#333";
          ctx.stroke();
        }        
      }
    });
    
    const nodeRadius = 25;
    
    // Draw nodes.
    derivedNodes.forEach(node => {
      // Highlight the node if it is currently being edited.
      if (node.id === editingNodeId) {
        ctx.beginPath();
        ctx.arc(node.renderX, node.renderY, nodeRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#2C666E";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Draw the node circle.
      ctx.beginPath();
      ctx.arc(node.renderX, node.renderY, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#07393C";
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw the node text.
      ctx.fillStyle = "#F0EDEE";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (node.type === "variable") ctx.fillText(`${node.value}[${node.varValue}]`, node.renderX, node.renderY);
      else ctx.fillText(node.value, node.renderX, node.renderY);
      
      // Draw plus signs for adding children (if the node isn’t a variable).
      if (node.type !== "variable") {
        if (!node.left) {
          drawPlus(ctx, node.renderX - nodeRadius - 15, node.renderY + nodeRadius + 10);
        }
        if (!node.right) {
          drawPlus(ctx, node.renderX + nodeRadius + 15, node.renderY + nodeRadius + 10);
        }
      }
      // Draw a plus sign for adding a parent (only for the current root).
      if (!node.parent) {
        drawPlus(ctx, node.renderX, node.renderY - nodeRadius - 15);
      }
    });
    
    ctx.restore();
  }, [tree, editingNodeId, offset, scale]);
  
  // Helper to draw a “plus” sign.
  const drawPlus = (ctx, x, y) => {
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("+", x, y);
  };
  
  // ─── Mouse and Interaction Handlers ─────────────────────────────
  
  // Get a node at a given canvas position.
  const getNodeAtPosition = (x, y) => {
    if (!tree) return null;
    const { nodes: derivedNodes } = getTreeLayout(tree);
    const nodeRadius = 25;
    return derivedNodes.find(node => {
      const dx = node.renderX - x;
      const dy = node.renderY - y;
      return Math.sqrt(dx * dx + dy * dy) <= nodeRadius;
    });
  };
  
  // Check if a plus sign is at the given position.
  const getPlusSignAtPosition = (x, y) => {
    if (!tree) return null;
    const { nodes: derivedNodes } = getTreeLayout(tree);
    const nodeRadius = 25;
    for (let node of derivedNodes) {
      // Parent plus (for the root).
      if (
        !node.parent &&
        Math.abs(node.renderX - x) <= 10 &&
        Math.abs((node.renderY - nodeRadius - 15) - y) <= 10
      ) {
        return { nodeId: node.id, position: "parent" };
      }
      // Left plus.
      if (
        Math.abs((node.renderX - nodeRadius - 15) - x) <= 10 &&
        Math.abs((node.renderY + nodeRadius + 10) - y) <= 10
      ) {
        return { nodeId: node.id, position: "left" };
      }
      // Right plus.
      if (
        Math.abs((node.renderX + nodeRadius + 15) - x) <= 10 &&
        Math.abs((node.renderY + nodeRadius + 10) - y) <= 10
      ) {
        return { nodeId: node.id, position: "right" };
      }
    }
    return null;
  };
  
  // When the canvas is clicked.
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Convert screen coordinates to canvas coordinates.
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    
    const plusData = getPlusSignAtPosition(x, y);
    if (plusData) {
      setAddingNode(plusData);
      setEditingNodeId(null);
      return;
    }
    
    const clickedNode = getNodeAtPosition(x, y);
    if (clickedNode) {
      setEditingNodeId(clickedNode.id);
      console.log("Clicked node:", clickedNode);
      setAddingNode(null);
      return;
    }
    
    // If there’s no tree yet, create a root node.
    if (!tree) {
      const newRoot = new Node("+");
      newRoot.id = generateId();
      newRoot.x = x;
      newRoot.y = y;
      setTree(newRoot);
      onTreeUpdate(newRoot);
      console.log("Created root node:", newRoot);
    } else {
      setAddingNode(null);
      setEditingNodeId(null);
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
    
    const node = getNodeAtPosition(x, y);
    const plus = getPlusSignAtPosition(x, y);
    setHovering(!!node || !!plus);
  };
  
  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  
  const handleMouseUp = () => {
    setDragging(false);
  };
  
  const handleZoom = (direction) => {
    setScale(prev => Math.max(0.1, prev + direction * 0.1));
  };
  
  const handleCenter = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };
  
  // ─── Button Actions for Editing and Adding Nodes ─────────────────────
  
  const updateNode = (newValue, newVarValue = null) => {
    if (!editingNodeId || !tree) return;
    const updatedTree = updateNodeInTree(
      tree,
      editingNodeId,
      newValue,
      newVarValue,
      getNextVariableName
    );
    setTree(updatedTree);
    onTreeUpdate(updatedTree);
    console.log("Updated tree:", updatedTree);
    setEditingNodeId(null);
  };
  
  const addNode = (value, varValue = null) => {
    if (!addingNode || !tree) return;
    const { nodeId, position } = addingNode;
    const { nodes: derivedNodes } = getTreeLayout(tree);
    const targetNode = derivedNodes.find(n => n.id === nodeId);
    if (!targetNode) return;
    if (targetNode.type === "variable" && position !== "parent") {
      alert("Variables cannot have children.");
      return;
    }
    if (value === "variable" && position === "parent") {
      alert("Variables cannot be parent nodes.");
      return;
    }
    const newNode = new Node(value, null, null, varValue, null, value === "variable" ? "variable" : "operation");
    newNode.id = generateId();
    if (position === "left") {
      newNode.x = targetNode.renderX - 60;
      newNode.y = targetNode.renderY + 100;
    } else if (position === "right") {
      newNode.x = targetNode.renderX + 60;
      newNode.y = targetNode.renderY + 100;
    } else if (position === "parent") {
      newNode.x = targetNode.renderX;
      newNode.y = targetNode.renderY - 100;
    }
    if (value === "variable") {
      newNode.value = getNextVariableName();
      newNode.varValue = varValue;
    }
    const updatedTree = addChildToTree(tree, nodeId, position, newNode);
    setTree(updatedTree);
    onTreeUpdate(updatedTree);
    setAddingNode(null);
  };
  
  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ textAlign: "center", margin: "10px" }}>
        <button className="btn btn-primary mx-1" onClick={() => handleZoom(1)}>+</button>
        <button className="btn btn-primary mx-1" onClick={() => handleZoom(-1)}>-</button>
        <button className="btn btn-primary mx-1" onClick={handleCenter}>Center</button>
      </div>
      <div style={{ textAlign: "center", margin: "10px" }}>
        <span>
          Result: {evaluationResult !== null ? String(Boolean(evaluationResult)) : "Tree not complete"}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width="1000"
        height="600"
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          display: "block",
          margin: "20px auto",
          cursor: dragging ? "grabbing" : hovering ? "pointer" : "grab"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      ></canvas>
      {editingNodeId && (
        <div style={{ textAlign: "center", margin: "10px" }}>
          <p>Editing Node: {editingNodeId}</p>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("A")}>Change to AND</button>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("O")}>Change to OR</button>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("variable", 0)}>Change to Variable (0)</button>
          <button className="btn btn-primary mx-1" onClick={() => updateNode("variable", 1)}>Change to Variable (1)</button>
          <button className="btn btn-danger mx-1"
            onClick={() => {
              const updatedTree = deleteNodeFromTree(tree, editingNodeId);
              setTree(updatedTree);
              onTreeUpdate(updatedTree);
              setEditingNodeId(null);
            }}
          >
            Delete Node
          </button>
        </div>
      )}
      {addingNode && (
        <div style={{ textAlign: "center", margin: "10px" }}>
          <button className="btn btn-primary mx-1" onClick={() => addNode("A")}>Add AND</button>
          <button className="btn btn-primary mx-1" onClick={() => addNode("O")}>Add OR</button>
          <button className="btn btn-primary mx-1" onClick={() => addNode("variable", 0)}>Add Variable (0)</button>
          <button className="btn btn-primary mx-1" onClick={() => addNode("variable", 1)}>Add Variable (1)</button>
        </div>
      )}
      <div>
        <table className="table table-bordered mb-3" style={{ width: "50%", margin: "auto" }}>
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Value</th>
              <th>Type</th>
              <th>Variable Value</th>
            </tr>
          </thead>
          <tbody>
            {tree &&
              (() => {
                const { nodes } = getTreeLayout(tree);
                return nodes.map(node => (
                  <tr key={node.id}>
                    <td>{node.id}</td>
                    <td>{node.value}</td>
                    <td>{node.type}</td>
                    <td>{node.varValue}</td>
                  </tr>
                ));
              })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
