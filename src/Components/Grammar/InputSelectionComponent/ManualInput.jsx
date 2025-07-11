import { useState } from 'react';
import { toast } from 'react-toastify';
import { parseGrammar } from '../Utils/GrammarParser';

export function ManualInput({ onGrammar }) {
  const [grammar, setGrammar] = useState(null);
  const [inputText, setinputText] = useState('');
  const [showLegend, setShowLegend] = useState(false);


  const handleParseGrammar = () => {
    try {
      const parsedGrammar = parseGrammar(inputText);
      setGrammar(parsedGrammar);
      // console.log(parsedGrammar);
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
        <div>Formát: S → aS | bA</div> 
        <div>A → aA | bS | ε</div>
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
      <div className='legend position-absolute top-0 end-0 p-2 m-2'
        onMouseEnter={() => setShowLegend(true)}
        onMouseLeave={() => setShowLegend(false)}
        >
        i
        {showLegend && (
          <div 
            className="legend-bubble position-absolute bg-white p-3 shadow rounded"
          >
            <h6 className="mb-2">Nápověda k zadávání gramatiky</h6>
            <ul className="ps-3 mb-0">
              <li>První řádek se považuje za počáteční symbol.</li>
              <li>Neterminály musí být velká písmena (A-Z).</li>
              <li>Terminály mohou být jakékoliv znaky kromě velkých písmen.</li>
              <li>Použijte symbol → mezi levou a pravou stranou pravidla.</li>
              <li>Použijte | pro oddělení alternativ.</li>
              <li>Použijte ε pro označení prázdného řetězce.</li>
              <li>Každé pravidlo musí být na novém řádku.</li>
              <li>Potřebné symboly mohou být zkopírovány z ukázky formátu.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}