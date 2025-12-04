import { useState } from 'react';
import PropTypes from 'prop-types';
import { parseExpressionToTree } from '../Utils/Parser'; 

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

  const handleParse = () => {
    onTreeUpdate(parseExpressionToTree(expression));
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
