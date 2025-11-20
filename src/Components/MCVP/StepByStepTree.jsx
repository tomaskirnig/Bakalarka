import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import ForceGraph2D from 'react-force-graph-2d';

// Colors
const highlightLinkColor = "red";
const defaultLinkColor = "rgba(0,0,0,0.5)";
const highlightNodeColor = "#90DDF0";
const defaultNodeColor = "#438c96";
const nodeStrokeColor = "#333";
const nodeTextColor = "#fff";

// Still dont work
const configureForces = (forceName, forceInstance) => {
  // Collision force to prevent overlapping
  if (forceName === 'collision') {
    return forceInstance || 
      (window.d3 && window.d3.forceCollide ? 
        window.d3.forceCollide(50).iterations(3) : // Collision radius of 50
        null);
  }
  
  // Link force for greater distance
  if (forceName === 'link') {
    forceInstance
      .distance(() => 120) 
      .strength(0.7);       
  }
  
  // Charge force for node repulsion
  if (forceName === 'charge') {
    forceInstance.strength(-300);
  }
  
  // Configure center force
  if (forceName === 'center') {
    forceInstance.strength(0.3);
  }
};

export function StepByStepTree({ tree }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Graph rendering references
  const fgRef = useRef();
  const idCounter = useRef(0);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  
  useEffect(() => {
    if (tree) {
      generateSteps(tree);
    }
  }, [tree]);

  // Generate evaluation steps using the new NodeClass structure
  const generateSteps = (rootNode) => {
    const stepsArray = [];

    const evaluateWithSteps = (node) => {
      if (!node) return null;
      
      // If it's a variable node with a value, return it
      if (node.type === "variable" && node.varValue !== null && node.varValue !== undefined) {
        return node.varValue;
      }
      
      // If no children, tree is incomplete for this node
      if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
        return null;
      }

      // Evaluate all children
      const childValues = [];
      for (const child of node.children) {
        const childResult = evaluateWithSteps(child);
        if (childResult !== null) {
          childValues.push(childResult);
        }
      }

      // If no child values, can't evaluate
      if (childValues.length === 0) {
        return null;
      }

      // Operations with children
      let result;
      if (node.value === 'AND' || node.value === '∧' || node.value === 'A') {
        // AND: all children must be 1
        result = childValues.every(val => val === 1) ? 1 : 0;
      } else if (node.value === 'OR' || node.value === '∨' || node.value === 'O') {
        // OR: at least one child must be 1
        result = childValues.some(val => val === 1) ? 1 : 0;
      } else {
        // Unknown operator
        return null;
      }
      
      // Add step with all child values
      stepsArray.push({ 
        node, 
        childValues, 
        result 
      });
      
      return result;
    };
    
    evaluateWithSteps(rootNode);
    setSteps(stepsArray);
    setCurrentStep(0);
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Graph data preparation - adapted from TreeRenderCanvas
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const visited = new Set();

    function traverse(current, parent) {
      if (!current || visited.has(current.id)) return;
      
      // Generate ID if not exists
      if (!current.id) {
        current.id = `n${idCounter.current++}`;
      }
      
      visited.add(current.id);
      nodes.push(current);
  
      // Link from parent -> current
      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }
  
      // Traverse children using the new NodeClass structure
      if (current.children && Array.isArray(current.children)) {
        current.children.forEach(child => {
          if (child) traverse(child, current);
        });
      } 
    }

    traverse(tree, null);

    // Process completed steps to show results on nodes
    if (currentStep >= 0 && steps.length > 0) {
      steps.slice(0, currentStep + 1).forEach((step) => {
        if (!step || !step.node) return;
        
        const n = step.node;
        const targetNode = nodes.find((nd) => nd.id === n.id);
        if (targetNode) {
          targetNode.currentResult = step.result;
        }
      });
    }

    // Convert link endpoints to node objects
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);
    
    links.forEach(link => {
      link.source = nodeMap[link.source];
      link.target = nodeMap[link.target];
    });

    return { nodes, links };
  }, [tree, currentStep, steps]);

  // Node rendering - adapted from TreeRenderCanvas
  const paintNode = useCallback((node, ctx) => {
    if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;
    
    const r = 12;
    const isCurrentNode = steps.length > 0 && 
                         currentStep < steps.length && 
                         steps[currentStep].node.id === node.id;
    const isHighlighted = highlightNodes.has(node);
    const isHovered = hoverNode && hoverNode.id === node.id;
    
    // Add glow effect for highlighted nodes
    if (isHighlighted || isHovered || isCurrentNode) {
      ctx.shadowColor = isCurrentNode ? '#FFD700' : (isHovered ? '#FFD700' : '#90DDF0');
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    
    // Color based on state
    if (isCurrentNode) {
      ctx.fillStyle = '#FFD700'; // Gold for current step
    } else if (isHovered) {
      ctx.fillStyle = '#FFD700'; // Gold for hovered
    } else if (isHighlighted) {
      ctx.fillStyle = '#90DDF0'; // Light blue for connected
    } else {
      ctx.fillStyle = defaultNodeColor;
    }
    
    ctx.fill();
    ctx.strokeStyle = (isHighlighted || isHovered || isCurrentNode) ? '#333' : nodeStrokeColor;
    ctx.lineWidth = (isHighlighted || isHovered || isCurrentNode) ? 2 : 1;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    let displayText = '';
    
    // Check if it's a variable (starts with x)
    if (typeof node.value === 'string' && node.value.startsWith('x')) {
      displayText = `${node.value}${node.varValue !== undefined ? `[${node.varValue}]` : ''}`;
    } 
    // Check if it's an AND operation
    else if (node.value === 'AND' || node.value === '∧' || node.value === 'A') {
      displayText = 'A';
    }
    // Check if it's an OR operation
    else if (node.value === 'OR' || node.value === '∨' || node.value === 'O') {
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
    
    // Draw evaluation result above the node
    if (node.currentResult !== undefined) {
      ctx.fillStyle = 'red';
      ctx.fillText(`${node.currentResult}`, node.x, node.y - 1.7 * r);
    }
  }, [currentStep, steps, highlightNodes, hoverNode]);

  // Link rendering - adapted from TreeRenderCanvas
  const paintLink = useCallback((link, ctx) => {
    if (!link.source || !link.target) return;
    
    const isHighlighted = highlightLinks.has(link);
    
    ctx.strokeStyle = isHighlighted ? highlightLinkColor : defaultLinkColor;
    ctx.lineWidth = isHighlighted ? 3 : 1;
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  }, [highlightLinks]);

  // Hover functionality - adapted from TreeRenderCanvas
  const handleNodeHover = useCallback((node) => {
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (node) {
      newHighlightNodes.add(node);

      const neighbors = [];
      
      // Add parents as neighbors
      if (node.parents && Array.isArray(node.parents)) {
        neighbors.push(...node.parents);
      }
      
      // Add children as neighbors  
      if (node.children && Array.isArray(node.children)) {
        neighbors.push(...node.children);
      }
      
      // Add all neighbor nodes to highlight set
      neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
      
      // Add all connected links
      graphData.links.forEach(link => {
        if (link.source === node || link.target === node) {
          newHighlightLinks.add(link);
        }
      });
    }

    setHoverNode(node || null);
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, []);

  // Focus on highlighted node when step changes
  useEffect(() => {
    if (!steps.length || currentStep < 0 || currentStep >= steps.length || !fgRef.current) {
      return;
    }

    const node = graphData.nodes.find(n => n.id === steps[currentStep].node.id);
    if (node && node.x && node.y) {
      fgRef.current.centerAt(node.x, node.y, 400);
    }
  }, [currentStep, graphData.nodes, steps]);

  // Function for larger hitboxes
  const paintNodeHitbox = useCallback((node, color, ctx) => {
    const hitboxRadius = 15; 
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, hitboxRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }, []);

  return (
    <div id='modal'>
      <h2>Postupné vyhodnocení</h2> 
      {steps.length > 0 ? (
        <>
          <p>Krok {currentStep + 1} z {steps.length}</p>
          
          <div className="GraphDiv">
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              dagMode="td"
              dagLevelDistance={100}
              cooldownTime={3000}   
              d3AlphaDecay={0.02}    
              d3VelocityDecay={0.3}  
              nodeRelSize={8}
              d3Force={configureForces}  // Add this line
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              
              // Custom rendering
              linkCanvasObjectMode={() => "replace"}
              linkCanvasObject={paintLink}
              nodeCanvasObjectMode={() => "after"}
              nodeCanvasObject={paintNode}
              nodePointerAreaPaint={paintNodeHitbox}
              
              // Hover functionality
              onNodeHover={handleNodeHover}
              
              enableNodeDrag={true}
              enablePanInteraction={true}
              enableZoomInteraction={true}
              minZoom={0.1}
              maxZoom={8}
            />
          </div>
          
          <div className='step-controls-info row align-items-center'>
            <div className='step-info col-md-7 mt-3'>
              <p>Vyhodnocovaný uzel: {steps[currentStep].node.value === 'A' ? 'AND' : 'OR'}</p>
              <p>Hodnoty potomků: {steps[currentStep].childValues.join(', ')}</p>
              <p>Výsledek: {String(steps[currentStep].result)}</p>
            </div>
            <div className='step-controls col-md-5'>
              <button className='btn btn-primary mx-1' onClick={goToPreviousStep} disabled={currentStep === 0}>Předchozí</button>
              <button className='btn btn-primary mx-1' onClick={goToNextStep} disabled={currentStep === steps.length - 1}>Další</button>
            </div>
          </div>
        </>
      ) : (
        <p>Žádné kroky vyhodnocení pro zobrazení.</p>
      )}
    </div>
  );  
}

StepByStepTree.propTypes = {
  tree: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    value: PropTypes.any,
    varValue: PropTypes.any,
    children: PropTypes.array
  })
};