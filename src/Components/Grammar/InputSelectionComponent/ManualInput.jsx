import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { parseGrammar } from '../Utils/GrammarParser';

export function ManualInput({ onGrammar }) {
  const [inputText, setinputText] = useState('');


  const handleParseGrammar = () => {
    try {
      const parsedGrammar = parseGrammar(inputText);
      onGrammar(parsedGrammar); 
    } catch (error) {
      console.error('Chyba při zpracování gramatiky:', error);
      toast.error(`Chyba při zpracování gramatiky: ${error.message}`);
      return;
    }
  };

  return (
    <div className="inputWindow">
      <h2>Zadání gramatiky</h2>
      <h3>
        <div>Formát: S → a S | b A</div> 
        <div>A → a A | b S | ε</div>
      </h3>
      <div>
        <textarea
          className='form-control mt-3'
          rows="5"
          value={inputText}
          onChange={(e) => setinputText(e.target.value)}
          placeholder="Zadejte pravidla gramatiky (každé pravidlo na nový řádek)"
        />
      </div>
      <button className='btn btn-primary mt-3' onClick={handleParseGrammar}>Zpracovat</button>
    </div>
  );
}

ManualInput.propTypes = {
    onGrammar: PropTypes.func.isRequired
};