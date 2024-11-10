import React, { useState } from 'react';
import { InputMethodSelector } from './InputSelectionComponents/InputMethodSelector';
import { renderTree } from '../Utils/TreeRender';
import { TreeSVG } from '../Utils/TreeRenderSVG';
import { evaluateTree } from '../Utils/EvaluateTree';

export function MCVP() {
    const [tree, setTree] = useState(null); 

    // Function to update the tree
    const handleTreeUpdate = (newTree) => {
        setTree(newTree);
    };

    return (
        <div className='div-content'>
            <h1 className='display-4'>MCVP</h1>
            <p>This is the MCVP Page</p>

            {/* Pass the handleTreeUpdate function to InputMethodSelector */}
            <InputMethodSelector onTreeUpdate={handleTreeUpdate} />
            {tree && <p>Result: {evaluateTree(tree) ? 'True' : 'False'}</p>}
            {/* Render the tree if it exists */}
            {tree && <TreeSVG tree={tree} />}
        </div>
    );
}

export default MCVP;
