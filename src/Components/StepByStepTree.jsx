import React, { useState, useEffect } from 'react';
import { evaluateTree } from '../Utils/EvaluateTree';
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
        
        const evaluateWithSteps = (node) => {
            if (!node) return null;
            
            if (node.varValue !== null) {
                return node.varValue;
            }
            
            const leftValue = evaluateWithSteps(node.left);
            const rightValue = evaluateWithSteps(node.right);
            
            const result = node.value === 'A' ? leftValue && rightValue : leftValue || rightValue;
            
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
            <h2>Step-by-Step Evaluation</h2>
            {steps.length > 0 && (
                <>
                    <p>Step {currentStep + 1} of {steps.length}</p>
                    <TreeCanvas tree={steps[currentStep].node} />
                    <p>Evaluating: {steps[currentStep].node.value}</p>
                    <p>Left Value: {steps[currentStep].leftValue}, Right Value: {steps[currentStep].rightValue}</p>
                    <p>Result: {steps[currentStep].result}</p>
                    <button onClick={goToPreviousStep} disabled={currentStep === 0}>Previous</button>
                    <button onClick={goToNextStep} disabled={currentStep === steps.length - 1}>Next</button>
                </>
            )}
        </div>
    );
}

export default StepByStepTree;
