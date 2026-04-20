import { useState } from 'react';
import { Navigation } from './Components/Navigation';
import { HomePage } from './Components/HomePage';
import { MCVP } from './Components/MCVP/MCVP';
import CombinatorialGame from './Components/CombinatorialGame/CombinatorialGame';
import { Grammar } from './Components/Grammar/Grammar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './Components/Common/ErrorBoundary';

const DEFAULT_GRAPH_UI_SETTINGS = {
  useTopDownLayout: true,
  autoScrollToGraph: true,
  lockNodeAfterDrag: true,
};

/**
 * Root SPA component.
 * Handles top-level navigation state and renders the selected module page.
 *
 * @returns {JSX.Element} Application shell.
 */
function App() {
  // Track selected page and data passed to it
  const [currentPage, setCurrentPage] = useState('Home');
  const [pageData, setPageData] = useState(null);
  const [graphUiSettings, setGraphUiSettings] = useState(DEFAULT_GRAPH_UI_SETTINGS);

  const pageComponents = {
    Home: HomePage,
    MCVP,
    CombinatorialGame,
    Grammar,
  };

  // Callback function to update the selected page
  const handleNavSelection = (option, data = null) => {
    setCurrentPage(option);
    setPageData(data);
  };

  const handleGraphSettingsChange = (nextSettingsPatch) => {
    setGraphUiSettings((prev) => ({
      ...prev,
      ...nextSettingsPatch,
    }));
  };

  const SelectedPage = pageComponents[currentPage] || null;

  return (
    <>
      <Navigation
        selectedOption={currentPage}
        onNavSelect={handleNavSelection}
        graphSettings={graphUiSettings}
        onGraphSettingsChange={handleGraphSettingsChange}
      />
      <ErrorBoundary key={currentPage}>
        {SelectedPage && (
          <SelectedPage
            onNavigate={handleNavSelection}
            initialData={pageData}
            useTopDownLayout={graphUiSettings.useTopDownLayout}
            autoScrollToGraph={graphUiSettings.autoScrollToGraph}
            lockNodeAfterDrag={graphUiSettings.lockNodeAfterDrag}
          />
        )}
      </ErrorBoundary>

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
  );
}

export default App;
