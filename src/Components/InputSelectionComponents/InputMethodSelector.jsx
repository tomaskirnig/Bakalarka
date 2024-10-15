import { useState } from 'react';
// import './style.css'; // Include your CSS here

export function InputMethodSelector() {
  // State to track the selected option
  const [selectedOption, setSelectedOption] = useState('manual');

  // Function to handle tab selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  return (
    <div>
      {/* Tabs for selecting input method */}
      <div className="tabs">
        <button
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
        </button>
      </div>

      {/* Conditionally render the selected block */}
      {/* <div className="input-block">
        {selectedOption === 'manual' && <ManualInput />}
        {selectedOption === 'generate' && <GenerateInput />}
        {selectedOption === 'sets' && <PreparedSetsInput />}
      </div> */}
    </div>
  );
}

export default InputMethodSelector;
