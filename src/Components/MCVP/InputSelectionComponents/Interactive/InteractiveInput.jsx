import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { toast } from 'react-toastify';
import { useGraphColors } from '../../../../Hooks/useGraphColors';
import { useGraphSettings } from '../../../../Hooks/useGraphSettings';
import { graphDataToNodeClass, getNodeDisplayName } from './InteractiveInput.helpers';
import { createPaintLink, createPaintNode } from './InteractiveInput.renderers';
import { InteractiveSelectedNodeControls } from './InteractiveSelectedNodeControls';
import GraphLockButton from '../../../Common/GraphControls/GraphLockButton';

const MAX_INTERACTIVE_NODES = 750;

const getLinkEndpointId = (endpoint) =>
  typeof endpoint === 'object' && endpoint !== null ? endpoint.id : endpoint;

const CANVAS_MODE_AFTER = () => 'after';

/**
 * Component for interactively building and evaluating an MCVP graph.
 * Uses a force-directed graph to allow users to add nodes, edges, and modify values.
 * Automatically evaluates the circuit as it is built.
 *
 * @component
 */
export function InteractiveMCVPGraph({
  onTreeUpdate,
  useTopDownLayout = true,
  onRegisterPositionSnapshotGetter,
}) {
  const [graphData, setGraphData] = useState(() => ({
    nodes: [{ id: '0', type: 'operation', value: 'O', varValue: null }],
    links: [],
  }));
  const [isGraphLocked, setIsGraphLocked] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [addingEdge, setAddingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for container
  const nextNodeIdRef = useRef(1); // '0' is the initial OR node
  const nextLinkIdRef = useRef(0);
  const nextVarIdRef = useRef(1); // Separate counter for variable names, starting from 1
  const lastBroadcastedPositionsRef = useRef(new Map());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { mcvp } = settings;

  // ResizeObserver for responsive graph and color updates
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate unique ID function
  const generateNodeId = useCallback(() => {
    const id = nextNodeIdRef.current;
    nextNodeIdRef.current += 1;
    return String(id);
  }, []);

  const generateLinkId = useCallback(() => {
    const id = nextLinkIdRef.current;
    nextLinkIdRef.current += 1;
    return id;
  }, []);

  // Sync with parent component whenever graphData changes
  useEffect(() => {
    if (onTreeUpdate && graphData.nodes.length > 0) {
      const tree = graphDataToNodeClass(graphData);
      onTreeUpdate(tree);
    }
  }, [graphData, onTreeUpdate]);

  const pinNodePosition = useCallback((node) => {
    if (typeof node?.x === 'number' && typeof node?.y === 'number') {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);

  const unpinNodePosition = useCallback((node) => {
    if (!node) return;
    node.fx = undefined;
    node.fy = undefined;
  }, []);

  const handleToggleGraphLock = useCallback(() => {
    setIsGraphLocked((prevLocked) => {
      const nextLocked = !prevLocked;

      if (nextLocked) {
        graphData.nodes.forEach(pinNodePosition);
      } else {
        graphData.nodes.forEach(unpinNodePosition);
        fgRef.current?.d3ReheatSimulation();
      }

      return nextLocked;
    });
  }, [graphData.nodes, pinNodePosition, unpinNodePosition]);

  // Keep newly added nodes fixed while lock is enabled.
  useEffect(() => {
    if (!isGraphLocked) return;
    graphData.nodes.forEach(pinNodePosition);
  }, [graphData.nodes, isGraphLocked, pinNodePosition]);

  // --- Core Graph Functions ---

  const addNode = useCallback(
    (type, value = null, varValue = null) => {
      if (graphData.nodes.length >= MAX_INTERACTIVE_NODES) {
        toast.error(`Dosažen limit ${MAX_INTERACTIVE_NODES} uzlů.`);
        return null;
      }

      const newId = generateNodeId();
      let newNode;

      if (type === 'var') {
        const varName = `x${nextVarIdRef.current}`;
        nextVarIdRef.current += 1; // Increment for the next variable
        newNode = {
          id: newId,
          type: 'variable',
          value: value || varName,
          varValue: varValue === null ? 0 : varValue,
        };
      } else {
        newNode = {
          id: newId,
          type: 'operation',
          value: value,
          varValue: null,
        };
      }

      setGraphData((prevData) => ({
        nodes: [...prevData.nodes, newNode],
        links: prevData.links,
      }));
      return newNode;
    },
    [generateNodeId, graphData.nodes.length]
  );

  /**
   * Deletes a node and all connected edges from the graph.
   * @param {number|string} nodeId - The ID of the node to delete.
   */
  const deleteNode = (nodeId) => {
    setGraphData((prevData) => ({
      nodes: prevData.nodes.filter((node) => node.id !== nodeId),
      links: prevData.links.filter(
        (link) =>
          getLinkEndpointId(link.source) !== nodeId && getLinkEndpointId(link.target) !== nodeId
      ),
    }));

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
    setAddingEdge(false);
    setEdgeSource(null);
  };

  const edgeExists = useCallback(
    (sourceId, targetId) => {
      return graphData.links.some(
        (link) =>
          getLinkEndpointId(link.source) === sourceId && getLinkEndpointId(link.target) === targetId
      );
    },
    [graphData.links]
  );

  const getOutgoingEdgeCount = useCallback(
    (sourceId) => {
      return graphData.links.filter((link) => getLinkEndpointId(link.source) === sourceId).length;
    },
    [graphData.links]
  );

  /**
   * Adds a directed edge between two nodes.
   * @param {number|string} sourceId - The ID of the source node (parent).
   * @param {number|string} targetId - The ID of the target node (child).
   * @returns {boolean} True if the edge was added, false if it already exists or is invalid.
   */
  const addEdge = useCallback(
    (sourceId, targetId) => {
      if (sourceId === targetId || edgeExists(sourceId, targetId)) {
        console.warn('Edge already exists or is a self-loop.');
        return false;
      }

      const sourceNode = graphData.nodes.find((n) => n.id === sourceId);
      const targetNode = graphData.nodes.find((n) => n.id === targetId);

      if (!sourceNode || !targetNode) {
        console.warn('Source or target node not found');
        return false;
      }

      if (sourceNode.type !== 'operation') {
        toast.error('Hranu lze vést pouze z uzlu typu operace.');
        return false;
      }

      const outgoingCount = getOutgoingEdgeCount(sourceId);
      if (outgoingCount >= 2) {
        toast.error('Uzel operace může mít maximálně 2 potomky.');
        return false;
      }

      const newLink = {
        id: generateLinkId(),
        source: sourceNode,
        target: targetNode,
      };

      setGraphData((prevData) => ({
        nodes: prevData.nodes,
        links: [...prevData.links, newLink],
      }));
      return true;
    },
    [graphData.nodes, edgeExists, generateLinkId, getOutgoingEdgeCount]
  );

  /**
   * Deletes an edge between two nodes.
   * @param {number|string} sourceId - The ID of the source node.
   * @param {number|string} targetId - The ID of the target node.
   */
  const deleteEdge = (sourceId, targetId) => {
    setGraphData((prevData) => ({
      nodes: prevData.nodes,
      links: prevData.links.filter(
        (link) =>
          !(
            getLinkEndpointId(link.source) === sourceId &&
            getLinkEndpointId(link.target) === targetId
          )
      ),
    }));
  };

  const handleDagError = (error) => {
    console.error('DAG Error:', error);
    toast.error('Chyba v DAG struktuře: Cyklus detekován nebo neplatná struktura.');
    setGraphData((prevData) => ({
      nodes: prevData.nodes,
      links: prevData.links.slice(0, -1),
    }));
  };

  /**
   * Updates properties of a specific node.
   * @param {number|string} nodeId - The ID of the node to update.
   * @param {Object} updates - An object containing the properties to update.
   */
  const updateNodeValue = (nodeId, updates) => {
    setGraphData((prevData) => {
      const updatedNodes = prevData.nodes.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, ...updates };

          if (updatedNode.type === 'operation') {
            updatedNode.varValue = null;
          } else if (updatedNode.type === 'variable' && updatedNode.varValue === null) {
            updatedNode.value = `x${nodeId}`;
            updatedNode.varValue = 0;
          }
          return updatedNode;
        }
        return node;
      });

      return {
        nodes: updatedNodes,
        links: remapLinksToCurrentNodes(prevData.links, updatedNodes),
      };
    });

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode((prevSelNode) => ({ ...prevSelNode, ...updates }));
    }
  };

  // --- Interaction Handlers ---

  const handleNodeClick = useCallback(
    (node) => {
      if (addingEdge && edgeSource) {
        if (edgeSource.id !== node.id) {
          addEdge(edgeSource.id, node.id);
        }
        setAddingEdge(false);
        setEdgeSource(null);
        setSelectedNode(node);
      } else {
        setSelectedNode(node);
      }
    },
    [addingEdge, edgeSource, addEdge]
  );

  const handleBackgroundClick = useCallback(() => {
    if (addingEdge) {
      setAddingEdge(false);
      setEdgeSource(null);
    }
    setSelectedNode(null);
  }, [addingEdge]);

  const startAddEdge = () => {
    if (selectedNode) {
      if (selectedNode.type !== 'operation') {
        toast.error('Hranu lze přidat pouze z uzlu operace.');
        return;
      }
      if (getOutgoingEdgeCount(selectedNode.id) >= 2) {
        toast.error('Vybraný uzel už má 2 potomky.');
        return;
      }
      setAddingEdge(true);
      setEdgeSource(selectedNode);
      setSelectedNode(null);
    }
  };

  const hasChildren = (nodeId) => {
    return graphData.links.some((link) => getLinkEndpointId(link.source) === nodeId);
  };

  const canAddChild = (nodeId) => {
    return getOutgoingEdgeCount(nodeId) < 2;
  };

  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
  }, []);

  const remapLinksToCurrentNodes = useCallback((links, nodes) => {
    const nodeMap = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});

    return links
      .map((link) => ({
        ...link,
        source: nodeMap[getLinkEndpointId(link.source)],
        target: nodeMap[getLinkEndpointId(link.target)],
      }))
      .filter((link) => link.source && link.target);
  }, []);

  const persistNodePositionInGraphData = useCallback(
    (node) => {
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;

      setGraphData((prevData) => {
        const updatedNodes = prevData.nodes.map((n) =>
          n.id === node.id ? { ...n, x: node.x, y: node.y, fx: node.x, fy: node.y } : n
        );

        return {
          ...prevData,
          nodes: updatedNodes,
          links: remapLinksToCurrentNodes(prevData.links, updatedNodes),
        };
      });
    },
    [remapLinksToCurrentNodes]
  );

  const syncAllNodePositionsInGraphData = useCallback(() => {
    const engineNodes = graphData.nodes;
    if (!Array.isArray(engineNodes) || engineNodes.length === 0) return;

    const nextPositions = new Map();
    let hasChanges = false;

    engineNodes.forEach((node) => {
      if (typeof node.x !== 'number' || typeof node.y !== 'number') return;

      const id = String(node.id);
      const x = node.x;
      const y = node.y;
      nextPositions.set(id, { x, y });

      const previous = lastBroadcastedPositionsRef.current.get(id);
      if (!previous || previous.x !== x || previous.y !== y) {
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    lastBroadcastedPositionsRef.current = nextPositions;
    setGraphData((prevData) => {
      const updatedNodes = prevData.nodes.map((node) => {
        const position = nextPositions.get(String(node.id));
        if (!position) return node;

        if (isGraphLocked) {
          return { ...node, x: position.x, y: position.y, fx: position.x, fy: position.y };
        }

        return { ...node, x: position.x, y: position.y };
      });

      return {
        ...prevData,
        nodes: updatedNodes,
        links: remapLinksToCurrentNodes(prevData.links, updatedNodes),
      };
    });
  }, [graphData.nodes, isGraphLocked, remapLinksToCurrentNodes]);

  const getCurrentNodePositionsSnapshot = useCallback(() => {
    const engineNodes = graphData.nodes;
    if (!Array.isArray(engineNodes) || engineNodes.length === 0) {
      return {};
    }

    const snapshot = {};
    engineNodes.forEach((node) => {
      const x = typeof node.x === 'number' ? node.x : node.fx;
      const y = typeof node.y === 'number' ? node.y : node.fy;

      if (typeof x === 'number' && typeof y === 'number') {
        snapshot[node.id] = { x, y };
      }
    });

    return snapshot;
  }, [graphData.nodes]);

  useEffect(() => {
    if (!onRegisterPositionSnapshotGetter) return;

    onRegisterPositionSnapshotGetter(getCurrentNodePositionsSnapshot);
    return () => {
      onRegisterPositionSnapshotGetter(null);
    };
  }, [onRegisterPositionSnapshotGetter, getCurrentNodePositionsSnapshot]);

  // --- Canvas/Rendering Functions ---
  const paintNode = useMemo(
    () => createPaintNode({ selectedNode, hoverNode, edgeSource, colors, mcvp }),
    [selectedNode, hoverNode, edgeSource, colors, mcvp]
  );

  const paintLink = useMemo(
    () =>
      createPaintLink({
        selectedNode,
        nodeRadius: mcvp.nodeRadius,
        linkIdFont: mcvp.linkIdFont,
      }),
    [selectedNode, mcvp.nodeRadius, mcvp.linkIdFont]
  );

  // Force setup for collision and stable centering (without repulsion drift)
  useEffect(() => {
    if (fgRef.current) {
      // Add collision force to prevent overlap
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force(
          'collision',
          window.d3
            .forceCollide()
            .radius(() =>
              Math.max(mcvp.nodeRadius * mcvp.collisionRadiusMultiplier, mcvp.nodeRadius + 6)
            )
            .strength(Math.max(0.95, mcvp.collisionStrength))
            .iterations(Math.max(6, mcvp.collisionIterations))
        );
      }

      // Disable repulsive force to avoid disconnected components drifting apart.
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(0);
      }

      // Keep the whole graph centered in the viewport simulation space.
      if (window.d3 && window.d3.forceCenter) {
        fgRef.current.d3Force('center', window.d3.forceCenter(0, 0));
      }

      // Link force to keep connected nodes at appropriate distance
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(mcvp.linkDistance).strength(mcvp.linkStrength);
      }
    }
  }, [mcvp]);
  // Re-run if mcvp settings changes

  return (
    <div>
      {/*Instructions*/}
      <div
        style={{
          textAlign: 'center',
          margin: '5px',
          minHeight: '24px',
          color: 'var(--color-grey-medium)',
        }}
      >
        {addingEdge &&
          edgeSource &&
          `Přidávání hrany z uzlu ${getNodeDisplayName(edgeSource)}. Klikněte na cílový uzel nebo na pozadí pro zrušení.`}
        {selectedNode && !addingEdge && `Uzel ${getNodeDisplayName(selectedNode)} vybrán.`}
        {!selectedNode &&
          !addingEdge &&
          'Klikněte na pozadí pro zrušení výběru. Klikněte na uzel pro výběr.'}
      </div>

      {/* ForceGraph Canvas */}
      <div className="GraphDiv" ref={containerRef} style={{ height: '60vh', minHeight: '500px' }}>
        <div className="graph-controls">
          <button
            type="button"
            className="graph-btn"
            onClick={() => fgRef.current?.zoomToFit(400, 50)}
            title="Fit Graph to Screen"
          >
            Vycentrovat
          </button>
          <GraphLockButton isLocked={isGraphLocked} onToggle={handleToggleGraphLock} />
        </div>
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          // Layout
          dagMode={useTopDownLayout ? 'td' : undefined}
          dagLevelDistance={useTopDownLayout ? mcvp.dagLevelDistance : undefined}
          // Physics
          cooldownTime={mcvp.cooldownTime}
          d3AlphaDecay={mcvp.d3AlphaDecay}
          d3VelocityDecay={mcvp.d3VelocityDecay}
          // Nodes
          nodeRelSize={mcvp.nodeRadius} // Use fixed radius for consistency
          nodeId="id"
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={CANVAS_MODE_AFTER} // Draw text after circle
          nodePointerAreaPaint={(node, color, ctx) => {
            // Make the whole rendered circle clickable/hoverable.
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, mcvp.nodeRadius + 2, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          // Links
          linkCanvasObject={paintLink} // Custom link renderer
          linkCanvasObjectMode={CANVAS_MODE_AFTER} // Draw custom object after link line
          linkDirectionalArrowLength={0}
          onDagError={useTopDownLayout ? handleDagError : undefined}
          // Interaction
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeHover={handleNodeHover} // Update hover state
          onEngineStop={syncAllNodePositionsInGraphData}
          enablePanInteraction={true}
          enableZoomInteraction={true}
          enableNodeDrag={true} // Keep dragging enabled even when graph is locked
          onNodeDrag={(node) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          onNodeDragEnd={(node) => {
            // Fix node position after dragging
            node.fx = node.x;
            node.fy = node.y;
            persistNodePositionInGraphData(node);
          }}
        />
      </div>

      {/* Control Buttons */}
      <div className="py-3">
        <button type="button" className="btn add-btn mx-1" onClick={() => addNode('op', 'A')}>
          Přidat AND uzel
        </button>
        <button type="button" className="btn add-btn mx-1" onClick={() => addNode('op', 'O')}>
          Přidat OR uzel
        </button>
        <button type="button" className="btn add-btn mx-1" onClick={() => addNode('var')}>
          Přidat uzel s proměnou
        </button>
      </div>

      {/* Selected Node Controls */}
      {selectedNode && !addingEdge && (
        <InteractiveSelectedNodeControls
          selectedNode={selectedNode}
          graphLinks={graphData.links}
          hasChildren={hasChildren}
          canAddChild={canAddChild}
          onUpdateNodeValue={updateNodeValue}
          onStartAddEdge={startAddEdge}
          onDeleteNode={deleteNode}
          onDeleteEdge={deleteEdge}
        />
      )}
    </div>
  );
}

InteractiveMCVPGraph.propTypes = {
  onTreeUpdate: PropTypes.func,
  useTopDownLayout: PropTypes.bool,
  onRegisterPositionSnapshotGetter: PropTypes.func,
};
