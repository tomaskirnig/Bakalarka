import { useState } from 'react';
import { ManualInput } from './ManualInput';
import { GenerateInput } from './GenerateInput';
import { TreeBuilderCanvas } from './InteractiveInput';
import { PreparedSetsInput } from './PreparedSetsinput';

export function InputMethodSelection({ onGrammar, chosenOpt, onChosenOpt, onTreeUpdate }) {
  // Handle tab selection
  const handleOptionSelect = (option) => {
    onChosenOpt(option);
    onGrammar(null); // Reset the tree when the option is changed
  };

  return (
    <>
      <div className="tabs">
          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio1"
            autoComplete="off"
            checked={chosenOpt === 'manual'}
            onChange={() => handleOptionSelect('manual')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio1">Manuálně</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio2"
            autoComplete="off"
            checked={chosenOpt === 'generate'}
            onChange={() => handleOptionSelect('generate')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio2">Generovat</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio3"
            autoComplete="off"
            checked={chosenOpt === 'sets'}
            onChange={() => handleOptionSelect('sets')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio3">Načíst ze sady</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio4"
            autoComplete="off"
            checked={chosenOpt === 'interactive'}
            onChange={() => handleOptionSelect('interactive')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio4">Interaktivně</label>
       </div>

      <div className="input-block">
        {chosenOpt === 'manual' && <ManualInput onGrammar={onGrammar} />}
        {chosenOpt === 'generate' && <GenerateInput onGrammar={onGrammar} />}
        {chosenOpt === 'sets' && <PreparedSetsInput onGrammar={onGrammar} />}
        {chosenOpt === 'interactive' && <TreeBuilderCanvas onGrammar={onGrammar} />}
      </div>
    </>
  );
}