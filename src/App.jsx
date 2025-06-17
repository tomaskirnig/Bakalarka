import { useState } from 'react'
import { Navigation } from './Components/Navigation'
import { HomePage } from './Components/HomePage';
import { MCVP } from './Components/MCVP/MCVP';
import { CombinatorialGame } from './Components/CombinatorialGame/CombinatorialGame';
import { Grammar } from './Components/Grammar/Grammar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      {selectedOption === 'Grammar' && <Grammar />}

      <ToastContainer 
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  )
}

export default App
