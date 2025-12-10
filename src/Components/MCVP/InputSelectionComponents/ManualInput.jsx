import { useState } from 'react';
import PropTypes from 'prop-types';
import { parseExpressionToTree } from '../Utils/Parser'; 

import { toast } from 'react-toastify';

/**
 * Component for manually entering an MCVP expression string.
 * Parses the string into a tree structure.
 * 
 * @component
 * @param {Object} props - The component props
 * @param {function} props.onTreeUpdate - Callback function called when the expression is successfully parsed. Receives the root node of the parsed tree.
 */
export function ManualInput( {onTreeUpdate} ) {
  const [expression, setExpression] = useState('');

  const countNodes = (node) => {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
         count += countNodes(child);
      });
    }
    return count;
  };

  const handleParse = () => {
    const tree = parseExpressionToTree(expression);
    if (tree) {
       const nodeCount = countNodes(tree);
       if (nodeCount > 750) { // Limit for manual input (total nodes)
          toast.error(`Překročen limit uzlů! (Detekováno: ${nodeCount}, Limit: 750)`);
          return;
       }
       onTreeUpdate(tree);
    }
  };

  return (
    <div className="inputWindow">
      <h2>Parser výrazů</h2>
      <h3>Formát: (x1[0] O x2[1]) A (x3[1] A x4[1])</h3>
      <div>
        <input
          className='form-control'
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)} 
        /> 
      </div>
      <button className='btn btn-primary mt-3' onClick={handleParse}>Zpracovat</button> 
    </div>
  );
}

ManualInput.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired
};
