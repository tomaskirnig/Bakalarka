import { useState } from 'react'
import { Navigation } from './Components/Navigation'
import { HomePage } from './Components/HomePage';
import { MCVP } from './Components/MCVP/MCVP';
import { CombinatorialGame } from './Components/CombinatorialGame/CombinatorialGame';

function App() {
  // Track selected page
  const [selectedOption, setSelectedOption] = useState('Home');

  // Callback function to update the selected page
  const handleNavSelection = (option) => {
    setSelectedOption(option);
  };

  return (
    <>
      <Navigation selectedOption={selectedOption} onNavSelect={handleNavSelection} />
      {selectedOption === 'Home' && <HomePage />}
      {selectedOption === 'MCVP' && <MCVP />}
      {selectedOption === 'CombinatorialGame' && <CombinatorialGame />}
    </>
  )
}

export default App
