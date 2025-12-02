import { useState } from 'react'
import { Navigation } from './Components/Navigation'
import { HomePage } from './Components/HomePage';
import { MCVP } from './Components/MCVP/MCVP';
import CombinatorialGame from './Components/CombinatorialGame/CombinatorialGame';
import { Grammar } from './Components/Grammar/Grammar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // Track selected page and data passed to it
  const [currentPage, setCurrentPage] = useState('Home');
  const [pageData, setPageData] = useState(null);

  // Callback function to update the selected page
  const handleNavSelection = (option, data = null) => {
    setCurrentPage(option);
    setPageData(data);
  };

  return (
    <>
      <Navigation selectedOption={currentPage} onNavSelect={handleNavSelection} />
      {currentPage === 'Home' && <HomePage onNavigate={handleNavSelection} initialData={pageData} />}
      {currentPage === 'MCVP' && <MCVP onNavigate={handleNavSelection} initialData={pageData} />}
      {currentPage === 'CombinatorialGame' && <CombinatorialGame onNavigate={handleNavSelection} initialData={pageData} />}
      {currentPage === 'Grammar' && <Grammar onNavigate={handleNavSelection} initialData={pageData} />}

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
