import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css'
import { Navigation } from './Components/Navigation'
import { HomePage } from './Components/HomePage';
import { MCVP } from './Components/MCVP';

export function App() {
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
    </>
  )
}

export default App
