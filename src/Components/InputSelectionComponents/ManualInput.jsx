import React, { useState } from 'react';
import { parseExpressionToTree, printTree } from '../../Utils/Parser'; 

export function ManualInput( {onTreeUpdate} ) {
  const [expression, setExpression] = useState('');
  const [tree, setTree] = useState(null);

  const handleParse = () => {
    const parsedTree = parseExpressionToTree(expression);
    // setTree(parsedTree);
    onTreeUpdate(parsedTree);
  };

  return (
    <div className="inputWindow">
      <h2>Expression Parser</h2>
      <h3>Formát: (x1[0] O x2[1]) A (x3[1] A x4[1])</h3>
      <div>
        <input
          className='form-control'
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)} 
        /> 
      </div>
      <button className='btn btn-primary' onClick={handleParse}>Parse Expression</button> 

       {tree && printTree(tree)}
    </div>
  );
}
