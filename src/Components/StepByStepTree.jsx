import React, { useState, useEffect } from 'react';
import { TreeCanvas } from '../Utils/TreeRenderCanvas';

export function StepByStepTree({ tree }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (tree) {
      generateSteps(tree);
    }
  }, [tree]);

  const generateSteps = (node) => {
    const stepsArray = [];

    // Evaluates and collects a step for every non-leaf node.
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

        const result = node.value === 'A' ? leftValue && rightValue : leftValue || rightValue;
        
        // Mark the node as evaluated and attach its result.
        node.evaluated = true;
        node.result = result;
        
        // Record the evaluation step for this non-leaf node.
        stepsArray.push({ node, leftValue, rightValue, result });
        
        return result;
    };
    
    evaluateWithSteps(node);
    setSteps(stepsArray);
  };

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

  return (
    <div id='modal'>
      <h2>Postupné vyhodnocení</h2> 
      {steps.length > 0 ? (
        <>
          <p>Krok {currentStep + 1} z {steps.length}</p>
          <TreeCanvas 
            tree={tree} 
            highlightedNode={steps[currentStep].node} 
            evaluatedResult={steps[currentStep].result}
            completedSteps={steps.slice(0, currentStep + 1)}
          />
          <div className='step-info'>
            <p>Vyhodnocovaný uzel: {steps[currentStep].node.value === 'A' ? 'AND' : 'OR'}</p>
            <p>Levý potomek: {String(steps[currentStep].leftValue)}, Pravý potomek: {String(steps[currentStep].rightValue)}</p>
            <p>Výsledek: {String(steps[currentStep].result)}</p>
          </div>
          <button className='btn btn-primary mx-1' onClick={goToPreviousStep} disabled={currentStep === 0}>Previous</button>
          <button className='btn btn-primary mx-1' onClick={goToNextStep} disabled={currentStep === steps.length - 1}>Next</button>
        </>
      ) : (
        <p>Žádné kroky vyhodnocení pro zobrazení. Výsledek výrazu: {tree ? tree.varValue : "N/A"}</p>
      )}
    </div>
  );  
}

export default StepByStepTree;
