import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';
import { useGraphColors } from '../../../../Hooks/useGraphColors';
import { useGraphSettings } from '../../../../Hooks/useGraphSettings';
import { toast } from 'react-toastify';
import {
  buildNodeMap,
  mapInitialGraphToState,
  resolveNodeId,
  toFormattedGraph,
} from './ManualInput.helpers';
import { createGetLinkLabel, createPaintLink, createPaintRing } from './ManualInput.renderers';
import { ManualInputPanels } from './ManualInputPanels';

/**
 * Interactive graph editor for manual combinatorial game input.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Manual input editor with graph canvas and controls.
 */
export function ManualInput({
  initialGraph,
  onGraphUpdate,
  analysisResult,
  optimalMoves,
  onExplain,
}) {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [isGraphLocked, setIsGraphLocked] = useState(false);
  const [hoverNode, setHoverNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null); // Track selected node
  const [addingEdge, setAddingEdge] = useState(false); // Track if in edge adding mode
  const [edgeSource, setEdgeSource] = useState(null); // Track source node for edge
  const [startingNodeId, setStartingNodeId] = useState(null); // Track starting node ID, initialized to null
  const fgRef = useRef(); // Reference to ForceGraph component
  const containerRef = useRef(); // Reference to the graph container div
  const isInternalUpdate = useRef(false); // Track if update originated internally
  const hasInitialized = useRef(false); // Track if initial node has been added
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { game } = settings;

  // Map to store node references
  const nodeMap = useMemo(() => {
    return buildNodeMap(graph.nodes);
  }, [graph.nodes]);

  // Derived state: Formatted graph for analysis and parent update
  const formattedGraph = useMemo(() => {
    return toFormattedGraph(graph, startingNodeId);
  }, [graph, startingNodeId]);

  // ResizeObserver for responsive graph and color updates
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
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

  // Initialize from initialGraph if provided
  useEffect(() => {
    // Prevent infinite loop if update came from this component
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const mappedState = mapInitialGraphToState(initialGraph);
    if (mappedState) {
      setGraph(mappedState.graph);
      if (mappedState.startingNodeId) {
        setStartingNodeId(mappedState.startingNodeId);
      }
    }
  }, [initialGraph]);

  // Effect to notify parent about graph updates
  useEffect(() => {
    if (onGraphUpdate && formattedGraph) {
      isInternalUpdate.current = true; // Mark as internal update
      onGraphUpdate(formattedGraph);
    } else if (onGraphUpdate && !formattedGraph) {
      onGraphUpdate(null); // Notify parent if graph is not valid for analysis
    }
  }, [formattedGraph, onGraphUpdate]);

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
        graph.nodes.forEach(pinNodePosition);
      } else {
        graph.nodes.forEach(unpinNodePosition);
        fgRef.current?.d3ReheatSimulation();
      }

      return nextLocked;
    });
  }, [graph.nodes, pinNodePosition, unpinNodePosition]);

  useEffect(() => {
    if (!isGraphLocked) return;
    graph.nodes.forEach(pinNodePosition);
  }, [graph.nodes, isGraphLocked, pinNodePosition]);

  // Memoize graph data for react-force-graph-2d.
  const data = useMemo(() => {
    const currentNodesById = new Map(graph.nodes.map((node) => [String(node.id), node]));
    const normalizedLinks = graph.links.map((link) => {
      const sourceId = String(resolveNodeId(link.source));
      const targetId = String(resolveNodeId(link.target));
      return {
        ...link,
        source: currentNodesById.get(sourceId) || sourceId,
        target: currentNodesById.get(targetId) || targetId,
      };
    });

    return {
      nodes: graph.nodes,
      links: normalizedLinks,
    };
  }, [graph]);

  // Add the first node when the component loads ONLY if empty and no initial graph
  useEffect(() => {
    if (!initialGraph && !hasInitialized.current) {
      hasInitialized.current = true;
      const newId = '0'; // First node ID
      const newNode = { id: newId, player: 1, neighbors: [] };
      setGraph({
        nodes: [newNode],
        links: [],
      });
      setStartingNodeId(newId);
    }
  }, [initialGraph]);

  // Function to add a node
  const addNode = () => {
    // console.log("Adding node...");
    if (graph.nodes.length >= 750) {
      toast.error('Dosažen limit 750 uzlů.');
      return;
    }

    const maxId = graph.nodes.reduce((max, node) => {
      const idNum = parseInt(node.id, 10);
      return isNaN(idNum) ? max : Math.max(max, idNum);
    }, -1);
    const newId = (maxId + 1).toString();

    const newNode = {
      id: newId,
      player: 1,
      neighbors: [],
    };

    setGraph((prevGraph) => ({
      nodes: [...prevGraph.nodes, newNode],
      links: [...prevGraph.links],
    }));

    // If no starting node is set, set the first added node as starting
    if (!startingNodeId) {
      setStartingNodeId(newId);
    }
  };

  // Function to delete a node and its associated edges
  const deleteNode = (nodeId) => {
    const updatedNodes = graph.nodes.filter((node) => node.id !== nodeId);
    const updatedLinks = graph.links.filter(
      (link) => resolveNodeId(link.source) !== nodeId && resolveNodeId(link.target) !== nodeId
    );

    setGraph({
      nodes: updatedNodes,
      links: updatedLinks,
    });
    setSelectedNode(null);
    setAddingEdge(false);

    // If the deleted node was the starting node, clear startingNodeId
    if (startingNodeId === nodeId) {
      setStartingNodeId(null);
      // If there are other nodes, try to set a new starting node automatically
      if (updatedNodes.length > 0) {
        setStartingNodeId(updatedNodes[0].id);
      }
    }
  };

  // Function to check if an edge already exists between two nodes
  const edgeExists = (sourceId, targetId) => {
    return graph.links.some(
      (link) => resolveNodeId(link.source) === sourceId && resolveNodeId(link.target) === targetId
    );
  };

  // Function to add an edge between two nodes
  const addEdge = (sourceId, targetId) => {
    // Don't allow self-loops or duplicate edges
    if (sourceId === targetId) {
      toast.error('Nelze přidat hranu: Smyčky (hrany z uzlu na sebe sama) nejsou povoleny.');
      return false;
    }
    if (edgeExists(sourceId, targetId)) {
      toast.error('Nelze přidat hranu: Hrana mezi těmito uzly již existuje.');
      return false;
    }

    const source = nodeMap[sourceId];
    const target = nodeMap[targetId];

    if (!source || !target) {
      toast.error('Nelze přidat hranu: Zdrojový nebo cílový uzel nebyl nalezen.');
      return false;
    }

    const newLink = {
      source: source.id,
      target: target.id,
    };

    setGraph((prevGraph) => ({
      nodes: prevGraph.nodes,
      links: [...prevGraph.links, newLink],
    }));
    return true;
  };

  // Function to delete an edge between two nodes
  const deleteEdge = (sourceId, targetId) => {
    const updatedLinks = graph.links.filter((link) => {
      const linkSourceId = resolveNodeId(link.source);
      const linkTargetId = resolveNodeId(link.target);
      return !(linkSourceId === sourceId && linkTargetId === targetId);
    });

    setGraph({
      nodes: graph.nodes,
      links: updatedLinks,
    });
  };

  // Start the edge adding process
  const startAddEdge = () => {
    if (selectedNode) {
      setAddingEdge(true);
      setEdgeSource(selectedNode);
    }
  };

  // Cancel the edge adding process
  const cancelAddEdge = () => {
    setAddingEdge(false);
    setEdgeSource(null);
  };

  // Handle hover on nodes
  const handleNodeHover = useCallback((node) => {
    setHoverNode(node || null);
  }, []);

  const handleLinkHover = useCallback(() => {
    // Link hover handler
  }, []);

  const paintRing = useMemo(
    () =>
      createPaintRing({
        game,
        selectedNode,
        hoverNode,
        addingEdge,
        edgeSource,
        colors,
        startingNodeId,
      }),
    [game, selectedNode, hoverNode, addingEdge, edgeSource, colors, startingNodeId]
  );

  const getLinkLabel = useMemo(() => createGetLinkLabel({ selectedNode }), [selectedNode]);

  const paintLink = useMemo(() => createPaintLink({ selectedNode }), [selectedNode]);

  // Handle node click for editing/deleting actions
  const handleNodeClick = (node) => {
    if (addingEdge) {
      // Create edge when a different target node is selected.
      if (edgeSource && node.id !== edgeSource.id) {
        const success = addEdge(edgeSource.id, node.id);
        if (success) {
          setAddingEdge(false);
          setEdgeSource(null);
        }
      } else {
        // Cancel when source node is clicked again.
        cancelAddEdge();
      }
    } else {
      setSelectedNode(node);
    }
  };

  // Clear selection or cancel pending edge creation.
  const handleBackgroundClick = () => {
    if (addingEdge) {
      cancelAddEdge();
    } else {
      setSelectedNode(null);
    }
  };
  const changePlayer = () => {
    if (selectedNode) {
      setGraph((prevGraph) => {
        const updatedNodes = prevGraph.nodes.map((n) =>
          n.id === selectedNode.id ? { ...n, player: n.player === 1 ? 2 : 1 } : n
        );
        return { ...prevGraph, nodes: updatedNodes };
      });
      // Update selectedNode to match the new state
      setSelectedNode((prev) => (prev ? { ...prev, player: prev.player === 1 ? 2 : 1 } : prev));

      if (fgRef.current) {
        fgRef.current.d3ReheatSimulation();
      }
    }
  };

  const setAsStartingNode = () => {
    if (selectedNode) {
      setStartingNodeId(selectedNode.id);
      // toast.success(`Uzel ${selectedNode.id} nastaven jako startovní.`);
    }
  };

  const isEdgeOptimal = useCallback(
    (link) => {
      if (!optimalMoves) return false;
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return optimalMoves.has(`${sourceId}-${targetId}`);
    },
    [optimalMoves]
  );

  const persistNodePositionInState = useCallback((node) => {
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;

    setGraph((prevGraph) => ({
      ...prevGraph,
      nodes: prevGraph.nodes.map((n) => (n.id === node.id ? { ...n, x: node.x, y: node.y } : n)),
    }));
  }, []);

  // Force setup to avoid drift while keeping overlap prevention
  useEffect(() => {
    if (fgRef.current) {
      // Add collision force to prevent overlap
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force(
          'collision',
          window.d3
            .forceCollide()
            .radius(() => game.nodeRadius * game.manualInputCollisionRadiusMultiplier)
            .strength(game.manualInputCollisionStrength)
            .iterations(game.manualInputCollisionIterations)
        );
      }

      // Disable repulsive force so disconnected components do not keep drifting apart.
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(0);
      }

      // Keep the graph centered in simulation space.
      if (window.d3 && window.d3.forceCenter) {
        fgRef.current.d3Force('center', window.d3.forceCenter(0, 0));
      }

      // Keep connected nodes closer
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(game.manualInputLinkDistance).strength(game.manualInputLinkStrength);
      }

      fgRef.current.d3ReheatSimulation();
    }
  }, [game]);

  const handleEngineStop = useCallback(() => {
    if (!isGraphLocked) return;
    data.nodes.forEach(pinNodePosition);
  }, [isGraphLocked, data.nodes, pinNodePosition]);

  return (
    <>
      <div
        className="GraphDiv mb-3 shadow-sm"
        ref={containerRef}
        style={{ height: '60vh', minHeight: '500px' }}
      >
        <div className="graph-controls">
          <button
            className="graph-btn"
            onClick={() => fgRef.current?.zoomToFit(400, 50)}
            title="Fit Graph to Screen"
          >
            Vycentrovat
          </button>
          <button
            className="graph-btn"
            onClick={handleToggleGraphLock}
            title={isGraphLocked ? 'Odemknout pozice uzlů' : 'Zamknout pozice uzlů'}
          >
            {isGraphLocked ? 'Odemknout graf' : 'Zamknout graf'}
          </button>
        </div>
        {addingEdge && (
          <div className="manual-input-instruction">
            Vyberte uzel pro přidání hrany. Klikněte na pozadí pro zrušení.
          </div>
        )}
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          enablePanInteraction={true}
          enableZoomInteraction={true}
          graphData={data}
          nodeRelSize={game.nodeRadius}
          autoPauseRedraw={false}
          linkWidth={(link) => (isEdgeOptimal(link) ? 5 : 3)}
          linkColor={(link) => (isEdgeOptimal(link) ? colors.accentYellow : colors.defaultLink)}
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={0}
          linkDirectionalArrowLength={game.linkDirectionalArrowLength}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => 'rgba(0,0,0,0.6)'}
          linkLabel={getLinkLabel}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={paintLink}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={paintRing}
          nodePointerAreaPaint={(node, color, ctx) => {
            // Make the full node circle an interaction hitbox.
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, game.nodeRadius + 2, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeDrag={(node) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          onNodeDragEnd={(node) => {
            persistNodePositionInState(node);

            if (isGraphLocked) {
              node.fx = node.x;
              node.fy = node.y;
            } else {
              node.fx = undefined;
              node.fy = undefined;
              fgRef.current?.d3ReheatSimulation();
            }
          }}
          onEngineStop={handleEngineStop}
        />
      </div>

      <div className="d-flex justify-content-center my-3">
        <button className="btn-control" onClick={addNode}>
          Přidat uzel
        </button>
      </div>

      <ManualInputPanels
        analysisResult={analysisResult}
        startingNodeId={startingNodeId}
        selectedNode={selectedNode}
        addingEdge={addingEdge}
        links={graph.links}
        onChangePlayer={changePlayer}
        onSetAsStartingNode={setAsStartingNode}
        onDeleteNode={deleteNode}
        onStartAddEdge={startAddEdge}
        onDeleteEdge={deleteEdge}
      />

      {analysisResult && onExplain && (
        <div className="mt-3">
          <button className="btn btn-primary" onClick={onExplain}>
            Vysvětlit
          </button>
        </div>
      )}
    </>
  );
}

ManualInput.propTypes = {
  initialGraph: PropTypes.object,
  onGraphUpdate: PropTypes.func,
  analysisResult: PropTypes.object,
  optimalMoves: PropTypes.instanceOf(Set),
  onExplain: PropTypes.func,
};
