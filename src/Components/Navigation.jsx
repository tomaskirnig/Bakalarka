import { useEffect } from 'react';
import PropTypes from 'prop-types';

export function Navigation({ selectedOption, onNavSelect }) {
  const navItems = [
    { key: 'Home',       labelDesktop: 'Domů',           labelMobile: 'Domů', icon: '🏠' },
    { key: 'MCVP',       labelDesktop: 'MCVP',           labelMobile: 'MCVP', icon: '🌳' },
    { key: 'CombinatorialGame', labelDesktop: 'Kombinatorická hra', labelMobile: 'Kombinatorická hra', icon: '🎲' },
    { key: 'Grammar',    labelDesktop: 'Gramatika',      labelMobile: 'Gramatika', icon: '📝' },
  ];

  // Handle offcanvas functionality
  useEffect(() => {
    const handleOffcanvas = () => {
      const toggler = document.querySelector('.modern-navbar-toggler');
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
      navLinks.forEach(link => link.addEventListener('click', hideOffcanvas));

      // Cleanup
      return () => {
        toggler?.removeEventListener('click', showOffcanvas);
        closeBtn?.removeEventListener('click', hideOffcanvas);
        navLinks.forEach(link => link.removeEventListener('click', hideOffcanvas));
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop);
        }
      };
    };

    const cleanup = handleOffcanvas();
    return cleanup;
  }, []);

  const renderButton = ({ key, label, icon }) => (
    <button
      key={key}
      className={`modern-nav-link ${selectedOption === key ? 'active' : ''}`}
      onClick={() => onNavSelect(key)}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-text">{label}</span>
    </button>
  );

  return (
    <>
      <nav className="modern-navbar">
        {/* Mobile toggle */}
        <div className="mobile-nav-container">
          <button
            className="modern-navbar-toggler"
            type="button"
            aria-label="Přepnout navigaci"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* Desktop menu */}
        <div className="desktop-nav-container">
          <div className="nav-items-container">
            {navItems.map(item => renderButton({ ...item, label: item.labelDesktop }))}
          </div>
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
            <span className="title-icon">📚</span>
            Bakalářka Menu
          </h5>
          <button
            type="button"
            className="modern-btn-close"
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
        <div className="offcanvas-body-modern">
          <div className="mobile-nav-items">
            {navItems.map(item => renderButton({ ...item, label: item.labelMobile }))}
          </div>
        </div>
      </div>
    </>
  );
}

Navigation.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  onNavSelect: PropTypes.func.isRequired
};
