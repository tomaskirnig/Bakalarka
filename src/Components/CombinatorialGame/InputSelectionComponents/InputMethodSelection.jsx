import { useState } from 'react';
import { ManualInput } from './ManualInput';
import { GenerateInput } from './GenerateInput';
import { PreparedSetsInput } from './PreparedSetsInput';

export function InputMethodSelector( {onGraphUpdate, setChosenOpt} ) {
  // Selected option
  const [selectedOption, setSelectedOption] = useState('manual');

  // Handle tab selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
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
            checked={selectedOption === 'manual'}
            onChange={() => handleOptionSelect('manual')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio1">Manuálně</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio2"
            autoComplete="off"
            checked={selectedOption === 'generate'}
            onChange={() => handleOptionSelect('generate')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio2">Generovat</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio3"
            autoComplete="off"
            checked={selectedOption === 'sets'}
            onChange={() => handleOptionSelect('sets')}
          />
          <label className="btn btn-outline-primary m-1" htmlFor="btnradio3">Načíst ze sady</label>
       </div>

      <div className="input-block">
        {selectedOption === 'manual' && <ManualInput onGraphUpdate={ onGraphUpdate }/>}
        {selectedOption === 'generate' && <GenerateInput onGraphUpdate={ onGraphUpdate }/>}
        {selectedOption === 'sets' && <PreparedSetsInput onGraphUpdate={ onGraphUpdate }/>}
      </div>
    </>
    
  );
}