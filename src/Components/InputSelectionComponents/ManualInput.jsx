import React, { useState } from 'react';
import { parseExpressionToTree, printTree } from './Parser'; // Import your parsing logic

export function ManualInput() {
  const [expression, setExpression] = useState('');
  const [tree, setTree] = useState(null);

  const handleParse = () => {
    const parsedTree = parseExpressionToTree(expression);
    setTree(parsedTree);
  };

  return (
    <div className="inputWindow">
      <h2>Expression Parser</h2>
      <h3>Formát: (x1[0] O x2[1]) A (x3[1] A x4[1])</h3>
      <input
        type="text"
        value={expression}
        onChange={(e) => setExpression(e.target.value)} 
      /> 
      <button onClick={handleParse}>Parse Expression</button> 

       {tree && (
        <pre>{printTree(tree)}</pre> // You can format the tree or visualize it better
      )}
    </div>
  );
}
