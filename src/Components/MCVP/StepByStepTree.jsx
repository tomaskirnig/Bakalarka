import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// Colors
const highlightLinkColor = "red";
const normalLinkColor = "rgba(0,0,0,0.5)";
const highlightNodeColor = "#90DDF0";
const normalNodeColor = "#438c96";
const nodeStrokeColor = "#333";
const nodeTextColor = "#fff";

export function StepByStepTree({ tree }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Graph rendering references
  const fgRef = useRef();
  const nodePositions = useRef(new Map());
  
  useEffect(() => {
    if (tree) {
      generateSteps(tree);
    }
  }, [tree]);

  // Generate evaluation steps
  const generateSteps = (node) => {
    const stepsArray = [];

    const evaluateWithSteps = (node) => {
        if (!node) return null;
        
        if (node.varValue !== null && node.varValue !== undefined) {
          return node.varValue;
        }
        
        let leftValue = evaluateWithSteps(node.left);
        let rightValue = evaluateWithSteps(node.right);

        if (leftValue === null && rightValue !== null) {
          leftValue = rightValue;
        } else if (rightValue === null && leftValue !== null) {
          rightValue = leftValue;
        }

        const result = node.value === 'A' ? 
          (leftValue && rightValue ? 1 : 0) : 
          (leftValue || rightValue ? 1 : 0);
        
        node.evaluated = true;
        node.result = result;
        
        stepsArray.push({ node, leftValue, rightValue, result });
        
        return result;
    };
    
    evaluateWithSteps(node);
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

  // Graph data preparation with useMemo
  const graphData = useMemo(() => {
    if (!tree) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];

    function traverse(current, parent) {
      if (!current) return;
      
      if (!current.id) {
        current.id = Math.random().toString(36).substring(2, 9);
      }
      
      current.parent = parent;

      // Create node with saved position if available
      const node = {
        id: current.id,
        value: current.value,
        varValue: current.varValue,
        nodeRef: current
      };
      
      // Apply saved position if we have one
      if (nodePositions.current.has(current.id)) {
        const pos = nodePositions.current.get(current.id);
        node.x = pos.x;
        node.y = pos.y;
        node.fx = pos.x;  // Fixed position X
        node.fy = pos.y;  // Fixed position Y
      }
      
      nodes.push(node);

      if (parent) {
        links.push({
          source: parent.id,
          target: current.id
        });
      }

      if (current.left) traverse(current.left, current);
      if (current.right) traverse(current.right, current);
    }

    traverse(tree, null);

    // Process completed steps to show results on nodes
    if (currentStep >= 0 && steps.length > 0) {
      steps.slice(0, currentStep + 1).forEach((step) => {
        if (!step || !step.node) return;
        
        const n = step.node;
        const targetNode = nodes.find((nd) => nd.id === n.id);
        if (targetNode) {
          targetNode.rootLabel = step.result;
        }
      });
    }

    // Convert link endpoints to node objects
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    
    links.forEach(link => {
      link.source = nodeMap[link.source] || link.source;
      link.target = nodeMap[link.target] || link.target;
    });

    return { nodes, links };
  }, [tree, currentStep, steps]);

  // Determine which link should be highlighted based on current step
  const getHighlightedLink = useCallback(() => {
    if (!steps.length || currentStep < 0 || currentStep >= steps.length) {
      return null;
    }
    
    const currentNode = steps[currentStep].node;
    if (!currentNode || !currentNode.parent) return null;
    
    const sourceId = currentNode.parent.id;
    const targetId = currentNode.id;
    
    return graphData.links.find(link => {
      if (typeof link.source === 'object' && typeof link.target === 'object') {
        return link.source.id === sourceId && link.target.id === targetId;
      }
      return false;
    });
  }, [graphData.links, steps, currentStep]);
  
  // Node rendering function
  const paintNode = useCallback((node, ctx, globalScale) => {
    if (!node || typeof node.x !== "number" || typeof node.y !== "number") return;
    
    const r = 12;
    const isCurrentNode = steps.length > 0 && 
                         currentStep < steps.length && 
                         steps[currentStep].node.id === node.id;
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = isCurrentNode ? highlightNodeColor : normalNodeColor;
    ctx.fill();
    ctx.strokeStyle = nodeStrokeColor;
    ctx.stroke();
    
    // Determine text to display
    let displayText = '';
    
    if (typeof node.value === 'string' && node.value.startsWith('x')) {
      displayText = `${node.value}${node.varValue !== undefined ? `[${node.varValue}]` : ''}`;
    } 
    else if (node.value === 'AND' || node.value === '∧') {
      displayText = 'A';
    }
    else if (node.value === 'OR' || node.value === '∨') {
      displayText = 'O';
    }
    else {
      displayText = node.value || '';
    }
    
    // Draw node text
    ctx.fillStyle = nodeTextColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `monospace`;
    ctx.fillText(displayText, node.x, node.y);
    
    // Draw evaluation result above the node
    if (node.rootLabel !== undefined) {
      ctx.fillStyle = 'red';
      ctx.fillText(`${node.rootLabel}`, node.x, node.y - 2 * r);
    }
  }, [currentStep, steps]);

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

  // Calculate the highlighted link for current step
  const highlightedLink = getHighlightedLink();

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
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              
              // Apply highlighting based on current step
              linkColor={link => link === highlightedLink ? highlightLinkColor : normalLinkColor}
              linkWidth={link => link === highlightedLink ? 3 : 1}
              
              nodeCanvasObjectMode={() => "after"}
              nodeCanvasObject={paintNode}
              
              // Allow node dragging with position memory
              onNodeDragEnd={(node) => {
                nodePositions.current.set(node.id, { x: node.x, y: node.y });
                node.fx = node.x;
                node.fy = node.y;
              }}
            />
          </div>
          
          <div className='step-controls-info row align-items-center'>
            <div className='step-info col-md-7 mt-3'>
              <p>Vyhodnocovaný uzel: {steps[currentStep].node.value === 'A' ? 'AND' : 'OR'}</p>
              <p>Levý potomek: {String(steps[currentStep].leftValue)}, Pravý potomek: {String(steps[currentStep].rightValue)}</p>
              <p>Výsledek: {String(steps[currentStep].result)}</p>
            </div>
            <div className='step-controls col-md-5'>
              <button className='btn btn-primary mx-1' onClick={goToPreviousStep} disabled={currentStep === 0}>Předchozí</button>
              <button className='btn btn-primary mx-1' onClick={goToNextStep} disabled={currentStep === steps.length - 1}>Další</button>
            </div>
          </div>
        </>
      ) : (
        <p>Žádné kroky vyhodnocení pro zobrazení. Výsledek výrazu: {tree ? tree.varValue : "N/A"}</p>
      )}
    </div>
  );  
}