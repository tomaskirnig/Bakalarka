import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from './Common/Modal';

/**
 * Main navigation component with desktop and mobile/off-canvas variants.
 *
 * @param {Object} props - Component props.
 * @returns {JSX.Element} Navigation UI.
 */
export function Navigation({ selectedOption, onNavSelect, graphSettings, onGraphSettingsChange }) {
  const mobileMenuTimerRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    return () => clearTimeout(mobileMenuTimerRef.current);
  }, []);

  const navItems = [
    { key: 'Home', label: 'Domů' },
    { key: 'MCVP', label: 'MCVP' },
    {
      key: 'CombinatorialGame',
      label: 'Kombinatorická hra',
    },
    { key: 'Grammar', label: 'Gramatika' },
  ];

  const isMcvpPage = selectedOption === 'MCVP';

  // Handle offcanvas functionality
  useEffect(() => {
    const handleOffcanvas = () => {
      const toggler = document.querySelector('.navbar-toggler');
      const offcanvas = document.querySelector('.modern-offcanvas');
      const backdrop = document.createElement('div');
      backdrop.className = 'offcanvas-backdrop fade';

      const showOffcanvas = () => {
        document.body.appendChild(backdrop);
        setTimeout(() => {
          backdrop.classList.add('show');
          offcanvas.classList.add('show');
        }, 10);

        backdrop.addEventListener('click', hideOffcanvas);
      };

      const hideOffcanvas = () => {
        backdrop.classList.remove('show');
        offcanvas.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(backdrop)) {
            document.body.removeChild(backdrop);
          }
        }, 400);
      };

      toggler?.addEventListener('click', showOffcanvas);

      // Handle close button and nav links
      const closeBtn = document.querySelector('.modern-btn-close');
      const navLinks = document.querySelectorAll('[data-bs-dismiss="offcanvas"]');

      closeBtn?.addEventListener('click', hideOffcanvas);
      navLinks.forEach((link) => link.addEventListener('click', hideOffcanvas));

      // Cleanup
      return () => {
        toggler?.removeEventListener('click', showOffcanvas);
        closeBtn?.removeEventListener('click', hideOffcanvas);
        navLinks.forEach((link) => link.removeEventListener('click', hideOffcanvas));
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop);
        }
      };
    };

    const cleanup = handleOffcanvas();
    return cleanup;
  }, []);

  const closeMobileMenu = () => {
    const offcanvas = document.querySelector('.modern-offcanvas');
    const backdrop = document.querySelector('.offcanvas-backdrop');

    offcanvas?.classList.remove('show');
    backdrop?.classList.remove('show');

    clearTimeout(mobileMenuTimerRef.current);
    mobileMenuTimerRef.current = setTimeout(() => {
      if (backdrop && document.body.contains(backdrop)) {
        document.body.removeChild(backdrop);
      }
    }, 400);
  };

  const renderButton = ({ key, label, isMobile }) => (
    <button
      type="button"
      key={key}
      className={`modern-nav-link ${selectedOption === key ? 'active' : ''}`}
      onClick={() => {
        onNavSelect(key);
        if (isMobile) closeMobileMenu();
      }}
    >
      <span className="nav-text">{label}</span>
    </button>
  );

  const handleToggleMcvpLayout = (isEnabled) => {
    onGraphSettingsChange({ useTopDownLayout: isEnabled });
  };

  const handleToggleAutoScroll = (isEnabled) => {
    onGraphSettingsChange({ autoScrollToGraph: isEnabled });
  };

  const handleToggleLockAfterDrag = (isEnabled) => {
    onGraphSettingsChange({ lockNodeAfterDrag: isEnabled });
  };

  return (
    <>
      <nav className="navbar">
        {/* Mobile toggle */}
        <div className="mobile-nav-container">
          <button className="navbar-toggler" type="button" aria-label="Přepnout navigaci">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <button
            type="button"
            className="navbar-settings-btn navbar-settings-btn-mobile"
            aria-label="Otevřít nastavení"
            title="Nastavení"
            onClick={() => setIsSettingsOpen(true)}
          >
            <i className="bi bi-gear-fill"></i>
          </button>
        </div>

        {/* Desktop menu */}
        <div className="desktop-nav-container">
          <div className="nav-items-container">
            {navItems.map((item) => renderButton({ ...item, isMobile: false }))}
          </div>
          <button
            type="button"
            className="navbar-settings-btn navbar-settings-btn-desktop"
            aria-label="Otevřít nastavení"
            title="Nastavení"
            onClick={() => setIsSettingsOpen(true)}
          >
            <i className="bi bi-gear-fill"></i>
          </button>
        </div>
      </nav>

      {/* Mobile offcanvas */}
      <div
        className="modern-offcanvas"
        tabIndex={-1}
        id="offcanvasNavbar"
        aria-labelledby="offcanvasNavbarLabel"
      >
        <div className="offcanvas-header-modern">
          <h5 className="offcanvas-title-modern" id="offcanvasNavbarLabel">
            Menu
          </h5>
          <button type="button" className="modern-btn-close" aria-label="Zavřít">
            ✕
          </button>
        </div>
        <div className="offcanvas-body-modern">
          <div className="mobile-nav-items">
            {navItems.map((item) => renderButton({ ...item, isMobile: true }))}
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <Modal
          onClose={() => setIsSettingsOpen(false)}
          title="Nastavení grafů"
          contentClassName="settings-modal-content"
          bodyClassName="settings-modal-body"
        >
          <div className="navigation-settings-panel">
            <div className="form-check form-switch navigation-settings-row">
              <input
                className="form-check-input clickable"
                type="checkbox"
                role="switch"
                id="nav-mcvp-layout-switch"
                checked={graphSettings.useTopDownLayout}
                disabled={!isMcvpPage}
                onChange={(e) => handleToggleMcvpLayout(e.target.checked)}
              />
              <label
                className="form-check-label clickable"
                htmlFor="nav-mcvp-layout-switch"
                style={{ color: 'black' }}
              >
                Režim rozložení MCVP:{' '}
                {graphSettings.useTopDownLayout ? 'Top-down (TD)' : 'Volný graf'}
              </label>
            </div>

            {!isMcvpPage && (
              <p className="navigation-settings-hint mb-3">
                Toto nastavení lze měnit pouze v sekci MCVP.
              </p>
            )}

            <div className="form-check form-switch navigation-settings-row">
              <input
                className="form-check-input clickable"
                type="checkbox"
                role="switch"
                id="nav-auto-scroll-switch"
                checked={graphSettings.autoScrollToGraph}
                onChange={(e) => handleToggleAutoScroll(e.target.checked)}
              />
              <label
                className="form-check-label clickable"
                htmlFor="nav-auto-scroll-switch"
                style={{ color: 'black' }}
              >
                Automaticky přesunout pohled na graf po načtení/generování
              </label>
            </div>

            <div className="form-check form-switch navigation-settings-row">
              <input
                className="form-check-input clickable"
                type="checkbox"
                role="switch"
                id="nav-lock-after-drag-switch"
                checked={graphSettings.lockNodeAfterDrag}
                onChange={(e) => handleToggleLockAfterDrag(e.target.checked)}
              />
              <label
                className="form-check-label clickable"
                htmlFor="nav-lock-after-drag-switch"
                style={{ color: 'black' }}
              >
                Ukotvit pozici uzlu po jeho přesunutí
              </label>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

Navigation.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  onNavSelect: PropTypes.func.isRequired,
  graphSettings: PropTypes.shape({
    useTopDownLayout: PropTypes.bool.isRequired,
    autoScrollToGraph: PropTypes.bool.isRequired,
    lockNodeAfterDrag: PropTypes.bool.isRequired,
  }).isRequired,
  onGraphSettingsChange: PropTypes.func.isRequired,
};
