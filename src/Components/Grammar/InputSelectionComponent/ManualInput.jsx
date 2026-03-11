import { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { parseGrammar } from '../Utils/GrammarParser';

export function ManualInput({ onGrammar }) {
  const [inputText, setInputText] = useState('');


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
      <p className="small mb-1">Formát: S → a S | b A</p>
      <p className="small mb-2">A → a A | b S | ε</p>
      <div>
        <textarea
          className='form-control mt-3'
          rows="5"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
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