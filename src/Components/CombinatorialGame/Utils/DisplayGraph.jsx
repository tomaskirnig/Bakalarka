import React, { useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// colors
const color1 = '#438c96'; 
const color4 = '#90DDF0';
const startingColor = '#FF6347';

export function DisplayGraph({ graph }) {
  if (!graph || !graph.positions) {
    return <div>No graph data available.</div>;
  }

  // Memoize the conversion of your graph into the structure expected by react-force-graph-2d.
  const data = useMemo(() => {
    // Create nodes with a temporary "neighbors" as union of parents and children.
    const nodes = Object.values(graph.positions).map(node => ({
      id: node.id,
      player: node.player,
      isWinning: node.isWinning,
      neighbors: [...(node.parents || []), ...(node.children || [])],
      isStartingPosition: node.id === graph.startingPosition.id
    }));

    // Build a mapping from node id to node object.
    const nodeMap = {};
    nodes.forEach(n => {
      nodeMap[n.id] = n;
    });

    // Replace neighbor IDs with actual node objects.
    nodes.forEach(n => {
      n.neighbors = n.neighbors.map(id => nodeMap[id]).filter(Boolean);
    });

    // Build links from each node’s children.
    const links = [];
    Object.values(graph.positions).forEach(node => {
      if (node.children) {
        node.children.forEach(childId => {
          links.push({
            source: node.id,
            target: childId
          });
        });
      }
    });
    // Convert link endpoints to node objects.
    links.forEach(link => {
      link.source = nodeMap[link.source];
      link.target = nodeMap[link.target];
    });

    return { nodes, links };
  }, [graph]);

  // State for highlighted nodes and links, and for the hovered node.
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const NODE_R = 8;

  // When a node is hovered, create new highlight sets.
  const handleNodeHover = useCallback((node) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (node) {
      newHighlightNodes.add(node);
      if (node.neighbors) {
        node.neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
      }
      data.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          newHighlightLinks.add(link);
        }
      });
    }

    setHoverNode(node || null);
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, [data]);

  const handleLinkHover = useCallback((link) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();
    if (link) {
      newHighlightLinks.add(link);
      newHighlightNodes.add(link.source);
      newHighlightNodes.add(link.target);
    }
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []);

  const paintRing = useCallback((node, ctx) => {
    // Draw a ring around highlighted nodes.
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_R * 1.2, 0, 2 * Math.PI, false);
    //ctx.fillStyle = node === hoverNode ? color4 : color1; //orange
    ctx.fillStyle = node.isStartingPosition ? startingColor : (node === hoverNode ? color4 : color1); // Highlight the starting position
    ctx.fill();
    // Draw the player label below the node.
    ctx.font = `8px monospace`; //Sans-Serif
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.player == 1 ? 'I' : 'II', node.x, node.y + NODE_R + 10);
  }, [hoverNode,highlightNodes]);

  return (
    <div className="GraphDiv">
      <ForceGraph2D
        graphData={data}
        nodeRelSize={NODE_R}
        autoPauseRedraw={false}
        linkWidth={link => highlightLinks.has(link) ? 5 : 1}
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => 'rgba(0,0,0,0.6)'}
        // nodeCanvasObjectMode={node => highlightNodes.has(node) ? 'before' : undefined}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={paintRing}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
      />
    </div>
  );
}

export default DisplayGraph;
