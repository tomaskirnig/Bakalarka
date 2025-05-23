import React, { useState } from 'react';

export function ManualInput({ onGrammar }) {
  const [grammarText, setGrammarText] = useState('');

  const handleParseGrammar = () => {
    const parsedGrammar = {
      rules: grammarText.split('\n').filter(rule => rule.trim()),
      input: grammarText
    };
    console.log(parsedGrammar);
    onGrammar(parsedGrammar);
  };

  return (
    <div className="inputWindow">
      <h2>Zadání gramatiky</h2>
      <h3>Formát: S → aS | bA, A → aA | bS | ε</h3>
      <div>
        <textarea
          className='form-control mt-3'
          rows="5"
          value={grammarText}
          onChange={(e) => setGrammarText(e.target.value)}
          placeholder="Zadejte pravidla gramatiky (každé pravidlo na nový řádek)"
        />
      </div>
      <button className='btn btn-primary mt-3' onClick={handleParseGrammar}>Zpracovat</button>
    </div>
  );
}