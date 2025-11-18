import { useState } from 'react';
import PropTypes from 'prop-types';
import { ManualInput } from './ManualInput';
import { GenerateInput } from './GenerateInput';
import { PreparedSetsInput } from './PreparedSetsInput';
// import { TreeBuilderCanvas } from './oldInteractiveInput';
import { InteractiveMCVPGraph } from './InteractiveInput';

export function InputMethodSelector( {onTreeUpdate, setChosenOpt} ) {
  // Selected option
  const [selectedOption, setSelectedOption] = useState('manual');

  // Handle tab selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setChosenOpt(option);
    onTreeUpdate(null); // Reset the tree when the option is changed
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
          <label className="m-1" htmlFor="btnradio1">Manuálně</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio2"
            autoComplete="off"
            checked={selectedOption === 'generate'}
            onChange={() => handleOptionSelect('generate')}
          />
          <label className="m-1" htmlFor="btnradio2">Generovat</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio3"
            autoComplete="off"
            checked={selectedOption === 'sets'}
            onChange={() => handleOptionSelect('sets')}
          />
          <label className="m-1" htmlFor="btnradio3">Načíst ze sady</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio4"
            autoComplete="off"
            checked={selectedOption === 'interactive'}
            onChange={() => handleOptionSelect('interactive')}
          />
          <label className="m-1" htmlFor="btnradio4">Interaktivně</label>
       </div>

      <div className="input-block">
        {selectedOption === 'manual' && <ManualInput onTreeUpdate={ onTreeUpdate }/>}
        {selectedOption === 'generate' && <GenerateInput onTreeUpdate={ onTreeUpdate }/>}
        {selectedOption === 'sets' && <PreparedSetsInput onTreeUpdate={ onTreeUpdate }/>}
        {selectedOption === 'interactive' && <InteractiveMCVPGraph/>}
      </div>
    </>
    
  );
}

InputMethodSelector.propTypes = {
  onTreeUpdate: PropTypes.func.isRequired,
  setChosenOpt: PropTypes.func.isRequired
};