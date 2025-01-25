import { useState } from 'react';
import { ManualInput } from './ManualInput';
import { GenerateInput } from './GenerateInput';
import { PreparedSetsInput } from './PreparedSetsInput';
import { TreeBuilderCanvas } from './InteractiveInput';

export function InputMethodSelector( {onTreeUpdate} ) {
  // State to track the selected option
  const [selectedOption, setSelectedOption] = useState('manual');

  // Function to handle tab selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
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
          <label className="btn btn-outline-primary" htmlFor="btnradio1">Manuálně</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio2"
            autoComplete="off"
            checked={selectedOption === 'generate'}
            onChange={() => handleOptionSelect('generate')}
          />
          <label className="btn btn-outline-primary" htmlFor="btnradio2">Generovat</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio3"
            autoComplete="off"
            checked={selectedOption === 'sets'}
            onChange={() => handleOptionSelect('sets')}
          />
          <label className="btn btn-outline-primary" htmlFor="btnradio3">Načíst ze sady</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio4"
            autoComplete="off"
            checked={selectedOption === 'interactive'}
            onChange={() => handleOptionSelect('interactive')}
          />
          <label className="btn btn-outline-primary" htmlFor="btnradio4">Interaktivně</label>
       </div>

       {/* Conditionally render the selected block */}
      <div className="input-block">
        {selectedOption === 'manual' && <ManualInput onTreeUpdate={onTreeUpdate}/>}
        {selectedOption === 'generate' && <GenerateInput onTreeUpdate={onTreeUpdate}/>}
        {selectedOption === 'sets' && <PreparedSetsInput onTreeUpdate={onTreeUpdate}/>}
        {selectedOption === 'interactive' && <TreeBuilderCanvas/>}
      </div>
    </>
    
  );
}

export default InputMethodSelector;
