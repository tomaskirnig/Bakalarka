import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import PropTypes from 'prop-types';
import ForceGraph2D from "react-force-graph-2d";
import { useGraphColors } from "../../Hooks/useGraphColors";
import { useGraphSettings } from "../../Hooks/useGraphSettings";

// Constant accessor functions to prevent re-renders of the graph engine
const MODE_REPLACE = () => "replace";
const MODE_AFTER = () => "after";

/**
 * Component for rendering a Grammar Derivation Tree.
 * 
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.tree - The derivation tree structure
 */
export function DerivationTreeVisual({ tree }) {
  const fgRef = useRef();
  const containerRef = useRef(); // Ref for the container div
  
  // Dimensions State
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Interaction State
  const hoverNode = useRef(null);
  
  const colors = useGraphColors();
  const settings = useGraphSettings();
  const { grammar: grammarSettings } = settings; // Use grammar settings

  // ResizeObserver to handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
    };

    // Initial call
    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
        updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 1. Prepare Graph Data
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const visited = new Set();
    
    function traverse(current, parent) {
      if (!current) return;
      
      if (visited.has(current.id)) return;
      visited.add(current.id);
      
      nodes.push(current);
  
      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }
  
      if (current.children && Array.isArray(current.children)) {
        current.children.forEach(child => {
          if (child) traverse(child, current);
        });
      } 
    }

    traverse(tree, null);

    return { nodes, links };
  }, [tree]);

  // 2. Interaction Handlers
  const handleNodeHover = useCallback((node) => {
    hoverNode.current = node || null;

    if (containerRef.current) {
        containerRef.current.style.cursor = node ? 'pointer' : 'grab';
    }
  }, []);

  const handleLinkHover = useCallback((link) => {
    if (containerRef.current) {
        containerRef.current.style.cursor = link ? 'pointer' : 'grab';
    }
  }, []);

  // 3. Paint Functions
  const paintNode = useCallback((node, ctx) => {
    if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;

    const isHovered = hoverNode.current === node;
    
    // Determine styles based on node type
    let fillColor = colors.defaultNode;
    let strokeColor = colors.nodeStroke;
    let textColor = colors.nodeText;

    if (node.attributes) {
        if (node.attributes.type === 'terminal') {
            fillColor = colors.accentYellow; // Terminals stand out
        } else if (node.attributes.type === 'epsilon') {
            fillColor = '#f0f0f0';
            textColor = '#999';
        } else if (node.attributes.type === 'non-terminal') {
            fillColor = colors.defaultNode;
        }
    }

    // Highlight override
    if (isHovered) {
        strokeColor = '#333';
        ctx.lineWidth = 2;
    } else {
        ctx.lineWidth = 1;
    }

    // Draw Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, grammarSettings.nodeRadius, 0, 2 * Math.PI, false);

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    // Text Label
    const displayText = node.name || '';
    
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = grammarSettings.labelFont;
    ctx.fillText(displayText, node.x, node.y);
    
  }, [colors, grammarSettings]);

  const paintLink = useCallback((link, ctx) => {
    if (!link.source || !link.target) return;
    
    ctx.strokeStyle = colors.defaultLink;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  }, [colors]);

  // 4. Effects
  // Initial Forces Setup
  useEffect(() => {
    if (fgRef.current) {
      if (window.d3 && window.d3.forceCollide) {
        fgRef.current.d3Force('collision', window.d3.forceCollide(grammarSettings.nodeRadius * 1.5).iterations(2)); 
      }
      fgRef.current.d3Force('link').distance(40);
      fgRef.current.d3Force('charge').strength(-100);
    }
  }, [tree, grammarSettings]);

  return (
    <div className="GraphDiv shadow-sm" ref={containerRef} style={{ backgroundColor: colors.canvasBackgroundColor, height: '500px' }}>
      <div className="graph-controls">
        <button 
          className="graph-btn" 
          onClick={() => fgRef.current?.zoomToFit(400, 50)}
          title="Fit Graph to Screen"
        >
          Vycentrovat
        </button>
      </div>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        
        // Layout
        dagMode="td"
        dagLevelDistance={50}
        
        // Physics
        cooldownTime={3000}
        d3AlphaDecay={0.02}
        
        // Interaction
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        minZoom={0.1}
        maxZoom={8}
        
        // Rendering Props
        nodeRelSize={grammarSettings.nodeRadius}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        
        // Custom Painters
        linkCanvasObjectMode={MODE_REPLACE}
        linkCanvasObject={paintLink}
        nodeCanvasObjectMode={MODE_AFTER}
        nodeCanvasObject={paintNode}
        
        // Events
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
      />
    </div>
  );
}

DerivationTreeVisual.propTypes = {
  tree: PropTypes.object
};
