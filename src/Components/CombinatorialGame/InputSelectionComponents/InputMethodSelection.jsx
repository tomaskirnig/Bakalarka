import { useState } from 'react';
import { ManualInput } from './ManualInput';
import { GenerateInput } from './GenerateInput';
import { PreparedSetsInput } from './PreparedSetsInput';

export function InputMethodSelector( {onGraphUpdate, chosenOpt, setChosenOpt} ) {
  // Handle tab selection
  const handleOptionSelect = (option) => {
    setChosenOpt(option);
    onGraphUpdate(null); // Reset the tree when the option is changed
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
       </div>

      <div className="input-block">
        {chosenOpt === 'manual' && <ManualInput onGraphUpdate={ onGraphUpdate }/>}
        {chosenOpt === 'generate' && <GenerateInput onGraphUpdate={ onGraphUpdate }/>}
        {chosenOpt === 'sets' && <PreparedSetsInput onGraphUpdate={ onGraphUpdate }/>}
      </div>
    </>
    
  );
}