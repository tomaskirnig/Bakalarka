import { useState } from 'react';
import { ManualInput } from './ManualInput';
import { GenerateInput } from './GenerateInput';
import { PreparedSetsInput } from './PreparedSetsInput';
// import './style.css'; // Include your CSS here

export function InputMethodSelector() {
  // State to track the selected option
  const [selectedOption, setSelectedOption] = useState('manual');

  // Function to handle tab selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  return (
    <>
    <div className="tabs">
         {/* <button
           className={'tab-button ' + (selectedOption === 'manual' ? 'active' : '')}
           onClick={() => handleOptionSelect('manual')}
         >
           Manuálně
         </button>
         <button
           className={'tab-button ' + (selectedOption === 'generate' ? 'active' : '')}
           onClick={() => handleOptionSelect('generate')}
         >
           Generovat
         </button>
         <button
           className={'tab-button ' + (selectedOption === 'sets' ? 'active' : '')}
           onClick={() => handleOptionSelect('sets')}
         >
           Připravené sady
        </button> */}
          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio1"
            autoComplete="off"
            checked={selectedOption === 'manual'}
            onClick={() => handleOptionSelect('manual')}
          />
          <label className="btn btn-outline-primary" htmlFor="btnradio1">Manuálně</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio2"
            autoComplete="off"
            checked={selectedOption === 'generate'}
            onClick={() => handleOptionSelect('generate')}
          />
          <label className="btn btn-outline-primary" htmlFor="btnradio2">Generovat</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio3"
            autoComplete="off"
            checked={selectedOption === 'sets'}
            onClick={() => handleOptionSelect('sets')}
          />
          <label className="btn btn-outline-primary" htmlFor="btnradio3">Načíst ze sady</label>
       </div>
       {/* Conditionally render the selected block */}
      <div className="input-block">
        {selectedOption === 'manual' && <ManualInput />}
        {selectedOption === 'generate' && <GenerateInput />}
        {selectedOption === 'sets' && <PreparedSetsInput />}
      </div>
    </>
    
  );
}

export default InputMethodSelector;
